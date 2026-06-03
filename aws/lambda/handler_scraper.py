"""Lambda: Coleta ARTESP + NASA e salva em S3."""
import json
import os
import sys
from datetime import datetime

# Garante que o pacote src/ seja encontrado tanto em Lambda real quanto em invoke local
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, "/var/task")

import boto3

from src.scrapers.artesp_scraper import ARTESPScraper
from src.apis.nasa_power import NASAPowerClient
from src.apis.nasa_eonet import NASAEONETClient
from src.utils.logger import get_logger

log = get_logger("lambda.scraper")

S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")
INFERENCE_QUEUE_URL = os.environ.get("SQS_INFERENCE_QUEUE_URL", "")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")
LAST_IDS_KEY = "raw/occurrences/last_ids.json"


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


def _get_last_ids(s3) -> set:
    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=LAST_IDS_KEY)
        return set(json.loads(obj["Body"].read()))
    except Exception:
        return set()


def _save_last_ids(s3, ids: set) -> None:
    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=LAST_IDS_KEY,
            Body=json.dumps(list(ids)),
        )
    except Exception as e:
        log.warning("Erro ao salvar last_ids: %s", e)


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

    s3 = _s3_client()

    # Deduplicação: só processa se houver ocorrências novas desde a última execução
    current_ids = {o.get("occurrence_id") for o in occurrences if o.get("occurrence_id")}
    last_ids = _get_last_ids(s3)
    new_ids = current_ids - last_ids

    if not new_ids and last_ids:
        elapsed = (datetime.now() - t_start).total_seconds()
        log.info("Nenhuma nova ocorrência desde a última execução — pulando")
        return {
            "statusCode": 200,
            "occurrences_count": 0,
            "eonet_events_count": len(eonet_events),
            "s3_key": None,
            "elapsed_seconds": round(elapsed, 2),
            "skipped": True,
        }

    log.info("%d novas ocorrências detectadas (total: %d)", len(new_ids), len(occurrences))

    # Salvar ocorrências no S3
    payload = {
        "collected_at": t_start.isoformat(),
        "occurrences": occurrences,
        "eonet_events": eonet_events,
    }
    key = f"raw/occurrences/{t_start.strftime('%Y/%m/%d/%H%M%S')}.json"
    try:
        s3.put_object(Bucket=S3_BUCKET, Key=key, Body=json.dumps(payload, ensure_ascii=False))
        log.info("Salvo em s3://%s/%s", S3_BUCKET, key)
        _save_last_ids(s3, current_ids)
    except Exception as e:
        log.error("Erro ao salvar no S3: %s", e)

    # Enfileirar para inferência
    if occurrences and INFERENCE_QUEUE_URL:
        try:
            sqs = _sqs_client()
            sqs.send_message(
                QueueUrl=INFERENCE_QUEUE_URL,
                MessageBody=json.dumps({"s3_key": key, "count": len(occurrences)}),
            )
            log.info("Mensagem enfileirada para inferência")
        except Exception as e:
            log.error("Erro ao enfileirar: %s", e)

    elapsed = (datetime.now() - t_start).total_seconds()
    return {
        "statusCode": 200,
        "occurrences_count": len(occurrences),
        "eonet_events_count": len(eonet_events),
        "s3_key": key,
        "elapsed_seconds": round(elapsed, 2),
        "new_ids_count": len(new_ids),
    }
