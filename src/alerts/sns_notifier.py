import boto3
from botocore.exceptions import ClientError

from src.alerts.alert_factory import Alert
from src.core.config import (
    AWS_ACCESS_KEY_ID, AWS_ENDPOINT_URL, AWS_REGION,
    AWS_SECRET_ACCESS_KEY, SNS_TOPIC_ARN,
)
from src.utils.logger import get_logger

log = get_logger(__name__)


class SNSNotifier:
    def __init__(self):
        kwargs = dict(
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        if AWS_ENDPOINT_URL:
            kwargs["endpoint_url"] = AWS_ENDPOINT_URL
        try:
            self._client = boto3.client("sns", **kwargs)
        except Exception as e:
            log.warning("SNS client indisponível: %s — usando mock", e)
            self._client = None

    def publish_alert(self, alert: Alert, topic_arn: str | None = None) -> str:
        topic = topic_arn or SNS_TOPIC_ARN
        if not self._client or not topic:
            log.info("[MOCK SNS] %s", alert.message)
            return "mock-message-id"
        try:
            resp = self._client.publish(
                TopicArn=topic,
                Message=alert.message,
                Subject=f"Streetsat — Risco {alert.risk_label}",
            )
            msg_id = resp.get("MessageId", "")
            log.info("SNS publicado: %s → MessageId=%s", alert.occurrence_id, msg_id)
            return msg_id
        except ClientError as e:
            log.error("SNS publish falhou: %s", e)
            return ""
