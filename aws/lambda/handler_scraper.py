import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, "/var/task")

import boto3

from src.scrapers.artesp_scraper import ARTESPScraper
from src.apis.nasa_eonet import NASAEONETClient
from src.utils.logger import get_logger

log = get_logger("lambda.scraper")

S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")
INFERENCE_QUEUE_URL = os.environ.get("SQS_INFERENCE_QUEUE_URL", "")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")

# ── Inicialização (executado uma vez por cold start) ─────────────────────────
#
# Justificativa: create_tables() é chamado aqui na inicialização do módulo
# (fora do handler) para que execute apenas UMA VEZ por cold start, não a cada
# invocação do Lambda. Benefícios:
#
# 1. Performance: evita chamadas repetidas de DDL em cada execução (5min).
# 2. Concorrência: previne contenção de locks de schema entre execuções
#    concorrentes do Lambda.
# 3. Cold start: o overhead de ~50ms é aceitável em init, mas não em cada
#    execução de hot start.
# 4. Boas práticas AWS Lambda: init code executa uma vez por ambiente; o
#    handler deve ser stateless e rápido.
# 5. Boas práticas PostgreSQL: DDL (CREATE TABLE) deve ser executado como
#    setup, não como parte do fluxo transacional.
#
# Migração futura: Idealmente usar Alembic para schema management e remover
# create_tables() do código Lambda.
#
try:
    from src.db.postgres import create_tables, get_session, batch_upsert_occurrences
    create_tables()
    log.info("Tabelas verificadas na inicialização")
except Exception as e:
    log.warning("PostgreSQL não disponível na inicialização: %s", e)


def _s3_client():
    kwargs = {"region_name": os.environ.get("AWS_REGION", "us-east-1")}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


def _sqs_client():
    kwargs = {"region_name": os.environ.get("AWS_REGION", "us-east-1")}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return boto3.client("sqs", **kwargs)


def _write_postgres(occurrences: list[dict]):
    """
    Persiste ocorrências no PostgreSQL via batch upsert.

    Nota: create_tables() NÃO é chamado aqui. A criação das tabelas ocorre
    na inicialização do módulo (fora do handler), uma vez por cold start.
    Isso elimina overhead de DDL, evita contenção de locks em execuções
    concorrentes, e segue a boa prática de separar schema management do
    fluxo transacional.
    """
    try:
        session = get_session()
        if session is None:
            log.warning("Postgres indisponível — pulando persistência")
            return
        try:
            count = batch_upsert_occurrences(session, occurrences)
            log.info("Postgres: %d occurrences upsertadas", count)
        finally:
            session.close()
    except Exception as e:
        log.warning("Erro ao escrever no Postgres: %s", e)


def _write_redis(occurrences: list[dict]):
    try:
        from src.db.redis_client import cache_set

        items = []
        for o in occurrences:
            risk_score = o.get("risk_score", 0) or 0
            items.append({
                "occurrence_id": o.get("occurrence_id", ""),
                "road": o.get("road", ""),
                "km": o.get("km", 0),
                "municipio": o.get("municipio", ""),
                "city": o.get("city", ""),
                "state": o.get("state", ""),
                "occurrence_type": o.get("occurrence_type", ""),
                "occurrence_subtype": o.get("occurrence_subtype", ""),
                "occurrence_types": o.get("occurrence_types", []),
                "concessionaire": o.get("concessionaire", ""),
                "direction": o.get("direction", ""),
                "interdiction_level": o.get("interdiction_level", 0) or 0,
                "interdiction_label": o.get("interdiction_label", ""),
                "criticality": o.get("criticality", 1),
                "criticality_label": o.get("criticality_label", ""),
                "victims": o.get("victims", {}),
                "victims_total": o.get("victims_total", 0),
                "risk_score": risk_score,
                "risk_label": "Crítico" if risk_score >= 3 else "Alto" if risk_score == 2 else "Atenção" if risk_score == 1 else "Livre",
                "narrative": o.get("narrative", ""),
                "status": o.get("status", "Ativa"),
                "status_timestamp": o.get("status_timestamp", ""),
                "latitude": o.get("latitude"),
                "longitude": o.get("longitude"),
                "detected_at": o.get("detected_at") or o.get("scraped_at", ""),
                "scraped_at": o.get("scraped_at", ""),
                "nearest_eonet_distance_km": o.get("nearest_eonet_distance_km", -1),
                "nearest_eonet_category": o.get("nearest_eonet_category", "none"),
                "precipitation_mm": o.get("precipitation_mm", 0),
                "wind_speed_ms": o.get("wind_speed_ms", 0),
                "temperature_c": o.get("temperature_c", 25),
                "humidity": o.get("humidity", 70),
            })
        cache_set("occurrences:recent", items, ttl=600)
        alerts = [a for a in items if a["risk_score"] >= 1]
        cache_set("alerts:recent", alerts, ttl=600)
        log.info("Redis: %d occurrences, %d alerts cacheados", len(items), len(alerts))
    except Exception as e:
        log.warning("Erro ao escrever no Redis: %s", e)


def lambda_handler(event, context):
    log.info("Iniciando coleta de dados...")
    t_start = datetime.now()

    occurrences = []
    try:
        scraper = ARTESPScraper()
        occurrences = scraper.scrape_all_pages()
        log.info("ARTESP: %d ocorrências coletadas", len(occurrences))
    except Exception as e:
        log.error("Erro ARTESP: %s", e)

    eonet_events = []
    try:
        eonet = NASAEONETClient()
        eonet_events = eonet.get_active_events()
        log.info("EONET: %d eventos ativos", len(eonet_events))
    except Exception as e:
        log.error("Erro EONET: %s", e)

    # EONET — enriquecer ocorrências com eventos naturais próximos
    if occurrences and eonet_events:
        try:
            occurrences = eonet.enrich_occurrences(occurrences)
            log.info("EONET: %d ocorrências enriquecidas", len(occurrences))
        except Exception as e:
            log.error("Erro ao enriquecer com EONET: %s", e)

    # Weather — enriquecer com condições climáticas atuais
    if occurrences:
        try:
            from src.apis.weather import WeatherClient
            weather = WeatherClient()
            for occ in occurrences:
                lat = occ.get("latitude")
                lon = occ.get("longitude")
                if lat is not None and lon is not None:
                    w = weather.get_current_weather(lat, lon)
                    occ["precipitation_mm"] = w.get("precipitation_mm", 0)
                    occ["wind_speed_ms"] = w.get("wind_speed_ms", 0)
                    occ["temperature_c"] = w.get("temperature_c", 25)
                    occ["humidity"] = w.get("humidity", 70)
            log.info("Weather: %d ocorrências enriquecidas", len(occurrences))
        except Exception as e:
            log.warning("Erro ao enriquecer com weather: %s", e)

    payload = {
        "collected_at": t_start.isoformat(),
        "occurrences": occurrences,
        "eonet_events": eonet_events,
    }

    # S3 — mantém timestamped para o fluxo de inferência, e latest.json para consulta rápida
    ts_key = f"raw/occurrences/{t_start.strftime('%Y/%m/%d/%H%M%S')}.json"
    latest_key = "raw/occurrences/latest.json"
    try:
        s3 = _s3_client()
        body = json.dumps(payload, ensure_ascii=False)
        s3.put_object(Bucket=S3_BUCKET, Key=ts_key, Body=body)
        s3.put_object(Bucket=S3_BUCKET, Key=latest_key, Body=body)
        log.info("S3: salvo %s e %s", ts_key, latest_key)
    except Exception as e:
        log.error("Erro ao salvar no S3: %s", e)

    # Postgres — upsert de todas as ocorrências
    if occurrences:
        _write_postgres(occurrences)
        _write_redis(occurrences)

    # SQS — trigger inference com a key timestamped
    if occurrences and INFERENCE_QUEUE_URL:
        try:
            sqs = _sqs_client()
            sqs.send_message(
                QueueUrl=INFERENCE_QUEUE_URL,
                MessageBody=json.dumps({"s3_key": ts_key, "count": len(occurrences)}),
            )
            log.info("Mensagem enfileirada para inferência")
        except Exception as e:
            log.error("Erro ao enfileirar: %s", e)

    elapsed = (datetime.now() - t_start).total_seconds()
    return {
        "statusCode": 200,
        "occurrences_count": len(occurrences),
        "eonet_events_count": len(eonet_events),
        "s3_key": ts_key,
        "elapsed_seconds": round(elapsed, 2),
    }
