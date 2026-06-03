"""Lambda: Lê ocorrências do S3, roda inferência e enfileira alertas."""
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, "/var/task")

import boto3

from src.ml.inference import get_predictor
from src.ml.scoring import enrich_score_with_nlp
from src.utils.logger import get_logger

log = get_logger("lambda.inference")

S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")
ALERTS_QUEUE_URL = os.environ.get("SQS_ALERTS_QUEUE_URL", "")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")
RISK_THRESHOLD = int(os.environ.get("RISK_THRESHOLD", "2"))
PROCESSED_KEY = "processed/occurrences/latest.json"


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


def _road_to_br(road: str) -> int:
    import re
    m = re.search(r"\d+", road or "")
    return int(m.group()) if m else 0


def _process_record(record: dict) -> tuple[list[dict], list[dict]]:
    """Retorna (all_scored, alerts) onde all_scored contém todas as ocorrências
    com risk_score atribuído e alerts contém apenas as de risco >= RISK_THRESHOLD."""
    body = json.loads(record.get("body", "{}"))
    s3_key = body.get("s3_key")
    if not s3_key:
        return [], []

    s3 = _s3_client()
    obj = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
    data = json.loads(obj["Body"].read())

    predictor = get_predictor()
    all_scored = []
    alerts = []

    for occ in data.get("occurrences", []):
        road = occ.get("road", "")
        br = occ.get("br") or _road_to_br(road)
        km = float(occ.get("km", 0))
        try:
            result = predictor.predict_segment(br=int(br), km=km, context={"occurrences": [occ]})
            scored = {
                **occ,
                "risk_score": result.score,
                "risk_label": result.risk_label,
                "confidence": round(result.confidence, 4),
            }
            all_scored.append(scored)
            if result.score >= RISK_THRESHOLD:
                alerts.append({
                    "br": br,
                    "km": km,
                    "risk_score": result.score,
                    "risk_label": result.risk_label,
                    "confidence": round(result.confidence, 4),
                    "occurrence": occ,
                })
        except Exception as e:
            log.error("Erro na inferência br=%s km=%s: %s", br, km, e)
            all_scored.append({**occ, "risk_score": 0, "risk_label": "Livre", "confidence": 0.0})

    return all_scored, alerts


def lambda_handler(event, context):
    log.info("Processando %d records SQS", len(event.get("Records", [])))
    all_scored: list[dict] = []
    all_alerts: list[dict] = []

    for record in event.get("Records", []):
        try:
            scored, alerts = _process_record(record)
            all_scored.extend(scored)
            all_alerts.extend(alerts)
        except Exception as e:
            log.error("Erro no record: %s", e)

    log.info(
        "%d ocorrências processadas, %d alertas gerados (risco >= %d)",
        len(all_scored), len(all_alerts), RISK_THRESHOLD,
    )

    # Persistir todas as ocorrências scored para o endpoint /occurrences da API
    if all_scored:
        try:
            s3 = _s3_client()
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=PROCESSED_KEY,
                Body=json.dumps(
                    {"generated_at": datetime.now().isoformat(), "occurrences": all_scored},
                    ensure_ascii=False,
                ),
            )
            log.info("Ocorrências processadas salvas em s3://%s/%s", S3_BUCKET, PROCESSED_KEY)
        except Exception as e:
            log.error("Erro ao salvar processed occurrences: %s", e)

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

    return {
        "statusCode": 200,
        "occurrences_processed": len(all_scored),
        "alerts_generated": len(all_alerts),
    }
