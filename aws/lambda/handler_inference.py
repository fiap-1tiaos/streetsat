import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, "/var/task")

import boto3

from src.ml.inference import get_predictor
from src.utils.logger import get_logger

log = get_logger("lambda.inference")

S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")
ALERTS_QUEUE_URL = os.environ.get("SQS_ALERTS_QUEUE_URL", "")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")
RISK_THRESHOLD = int(os.environ.get("RISK_THRESHOLD", "2"))
MODEL_DIR = Path("/tmp/streetsat/models")

_FILES = ["modelo_rf.pkl", "encoders.pkl", "model_metadata.json"]


def _ensure_model():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    endpoint = AWS_ENDPOINT_URL or "aws default"
    s3 = _s3_client()

    meta_tmp = MODEL_DIR / "model_metadata.json.tmp"
    try:
        s3.download_file(Bucket=S3_BUCKET, Key="models/model_metadata.json", Filename=str(meta_tmp))
        with open(meta_tmp) as f:
            s3_date = json.load(f).get("training_date", "")
        local_meta = MODEL_DIR / "model_metadata.json"
        local_date = ""
        if local_meta.exists():
            with open(local_meta) as f:
                local_date = json.load(f).get("training_date", "")

        if s3_date != local_date:
            log.info("Nova versão S3=%s local=%s, baixando modelos", s3_date, local_date)
            for fname in _FILES:
                key = f"models/{fname}"
                try:
                    s3.download_file(Bucket=S3_BUCKET, Key=key, Filename=str(MODEL_DIR / fname))
                    log.info("OK: s3://%s/%s", S3_BUCKET, key)
                except Exception as e:
                    log.error("Falha ao baixar s3://%s/%s: %s", S3_BUCKET, key, e)
                    raise
        else:
            meta_tmp.rename(local_meta)
        meta_tmp.unlink(missing_ok=True)
    except Exception as e:
        log.warning("S3 indisponível, usando cache local: %s", e)
        meta_tmp.unlink(missing_ok=True)


def _s3_client():
    kwargs = {"region_name": os.environ.get("AWS_REGION", "us-east-1")}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
        kwargs["config"] = boto3.session.Config(connect_timeout=5, read_timeout=10)
    return boto3.client("s3", **kwargs)


def _sqs_client():
    kwargs = {"region_name": os.environ.get("AWS_REGION", "us-east-1")}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return boto3.client("sqs", **kwargs)


def _update_postgres_risk(occurrence_id: str, risk_score: int):
    try:
        from src.db.postgres import get_session, update_occurrence_risk

        session = get_session()
        if session is None:
            return
        try:
            update_occurrence_risk(session, occurrence_id, risk_score)
        finally:
            session.close()
    except Exception as e:
        log.warning("Erro ao atualizar risco no Postgres: %s", e)


def _update_redis_cache(occurrences: list[dict]):
    try:
        from src.db.redis_client import cache_set, cache_get

        existing = cache_get("occurrences:recent")
        if existing is None:
            return

        ids = {o.get("occurrence_id"): o for o in existing}
        for occ in occurrences:
            oid = occ.get("occurrence_id")
            if oid and oid in ids:
                ids[oid]["risk_score"] = occ.get("risk_score", 0)
        cache_set("occurrences:recent", list(ids.values()), ttl=600)

        alerts = [o for o in ids.values() if o.get("risk_score", 0) >= 1]
        cache_set("alerts:recent", alerts, ttl=600)
    except Exception as e:
        log.warning("Erro ao atualizar Redis: %s", e)


def _process_record(record: dict) -> list[dict]:
    body = json.loads(record.get("body", "{}"))
    s3_key = body.get("s3_key")
    if not s3_key:
        return []

    s3 = _s3_client()
    obj = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
    data = json.loads(obj["Body"].read())

    predictor = get_predictor()
    alerts = []

    for occ in data.get("occurrences", []):
        road = occ.get("road", "desconhecido")
        km = float(occ.get("km", 0))
        try:
            result = predictor.predict_segment(road=str(road), km=km, context={"occurrences": [occ]})
            occ["risk_score"] = result.score
            occ["risk_label"] = result.risk_label

            _update_postgres_risk(occ.get("occurrence_id", ""), int(result.score))

            if result.score >= RISK_THRESHOLD:
                alerts.append({
                    "road": road,
                    "km": km,
                    "risk_score": result.score,
                    "risk_label": result.risk_label,
                    "confidence": round(result.confidence, 4),
                    "occurrence": occ,
                })
        except Exception as e:
            log.error("Erro na inferência road=%s km=%s: %s", road, km, e)

    _update_redis_cache(data.get("occurrences", []))
    return alerts


def lambda_handler(event, context):
    _ensure_model()
    log.info("Processando %d records SQS", len(event.get("Records", [])))
    all_alerts = []

    for record in event.get("Records", []):
        try:
            alerts = _process_record(record)
            all_alerts.extend(alerts)
        except Exception as e:
            log.error("Erro no record: %s", e)

    log.info("%d alertas gerados (risco >= %d)", len(all_alerts), RISK_THRESHOLD)

    if all_alerts and ALERTS_QUEUE_URL:
        try:
            sqs = _sqs_client()
            for alert in all_alerts:
                sqs.send_message(
                    QueueUrl=ALERTS_QUEUE_URL,
                    MessageBody=json.dumps(alert, ensure_ascii=False),
                )
        except Exception as e:
            log.error("Erro ao enfileirar alertas: %s", e)

    return {"statusCode": 200, "alerts_generated": len(all_alerts)}
