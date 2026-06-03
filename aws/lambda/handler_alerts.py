"""Lambda: Publica alertas de risco via SNS."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, "/var/task")

import boto3

from src.utils.logger import get_logger

log = get_logger("lambda.alerts")

SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")

RISK_LABELS = {0: "Livre", 1: "Atenção", 2: "Alto", 3: "Crítico"}
RISK_EMOJI = {0: "✅", 1: "⚠️", 2: "🔶", 3: "🚨"}


def _sns_client():
    kwargs = {"region_name": os.environ.get("AWS_REGION", "us-east-1")}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return boto3.client("sns", **kwargs)


def _format_message(alert: dict) -> tuple[str, str]:
    score = alert.get("risk_score", 0)
    label = alert.get("risk_label") or RISK_LABELS.get(score, "Desconhecido")
    emoji = RISK_EMOJI.get(score, "⚠️")
    br = alert.get("br", "?")
    km = alert.get("km", "?")
    confidence = alert.get("confidence", 0)

    subject = f"{emoji} Alerta Streetsat: Risco {label} — BR-{br} km {km}"
    message = (
        f"{emoji} ALERTA DE RISCO RODOVIÁRIO\n\n"
        f"Rodovia: BR-{br}\n"
        f"KM: {km}\n"
        f"Nível de risco: {label} (score {score}/3)\n"
        f"Confiança do modelo: {confidence:.1%}\n\n"
        f"Recomendação: {'Evite este trecho.' if score >= 2 else 'Atenção redobrada neste trecho.'}\n\n"
        f"— Streetsat · Monitoramento Inteligente de Rodovias"
    )
    return subject, message


def lambda_handler(event, context):
    log.info("Processando %d alertas", len(event.get("Records", [])))
    published = 0

    if not SNS_TOPIC_ARN:
        log.warning("SNS_TOPIC_ARN não configurado — alertas descartados")
        return {"statusCode": 200, "published": 0, "reason": "SNS_TOPIC_ARN not set"}

    sns = _sns_client()

    for record in event.get("Records", []):
        try:
            alert = json.loads(record.get("body", "{}"))
            subject, message = _format_message(alert)
            sns.publish(TopicArn=SNS_TOPIC_ARN, Subject=subject[:100], Message=message)
            log.info("Alerta publicado: BR-%s km %s risco=%s", alert.get("br"), alert.get("km"), alert.get("risk_score"))
            published += 1
        except Exception as e:
            log.error("Erro ao publicar alerta: %s", e)

    return {"statusCode": 200, "published": published}
