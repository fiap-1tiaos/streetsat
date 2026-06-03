import boto3
from botocore.exceptions import ClientError

from src.core.config import AWS_ACCESS_KEY_ID, AWS_ENDPOINT_URL, AWS_REGION, AWS_SECRET_ACCESS_KEY
from src.nlp.local_nlp import LocalNLPClient
from src.utils.logger import get_logger

log = get_logger(__name__)

MAX_CHARS = 4900


class ComprehendClient:
    def __init__(self):
        kwargs = dict(
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        if AWS_ENDPOINT_URL:
            kwargs["endpoint_url"] = AWS_ENDPOINT_URL
        self._client = boto3.client("comprehend", **kwargs)
        self._fallback = LocalNLPClient()

    def detect_entities(self, text: str, language: str = "pt") -> list[dict]:
        text = text[:MAX_CHARS]
        try:
            resp = self._client.detect_entities(Text=text, LanguageCode=language)
            return [
                {"type": e["Type"], "text": e["Text"], "score": e["Score"]}
                for e in resp.get("Entities", [])
            ]
        except ClientError as e:
            log.warning("Comprehend detect_entities falhou: %s", e)
            return self._fallback.detect_entities(text)

    def detect_sentiment(self, text: str, language: str = "pt") -> dict:
        text = text[:MAX_CHARS]
        try:
            resp = self._client.detect_sentiment(Text=text, LanguageCode=language)
            return {
                "sentiment": resp["Sentiment"],
                "scores": resp.get("SentimentScore", {}),
            }
        except ClientError as e:
            log.warning("Comprehend detect_sentiment falhou: %s", e)
            return self._fallback.detect_sentiment(text)

    def detect_key_phrases(self, text: str, language: str = "pt") -> list[str]:
        text = text[:MAX_CHARS]
        try:
            resp = self._client.detect_key_phrases(Text=text, LanguageCode=language)
            return [p["Text"] for p in resp.get("KeyPhrases", [])]
        except ClientError as e:
            log.warning("Comprehend detect_key_phrases falhou: %s", e)
            return self._fallback.detect_key_phrases(text)

    def analyze_occurrence(self, text: str) -> dict:
        if not text or not text.strip():
            return self._fallback.analyze_occurrence("")

        entities = self.detect_entities(text)
        sentiment_data = self.detect_sentiment(text)
        key_phrases = self.detect_key_phrases(text)

        text_lower = text.lower()
        from src.core.constants import BLOCKAGE_KEYWORDS, CRITICAL_KEYWORDS, DIVERSION_KEYWORDS, HIGH_KEYWORDS
        has_victims = any(kw in text_lower for kw in CRITICAL_KEYWORDS + HIGH_KEYWORDS)
        has_blockage = any(kw in text_lower for kw in BLOCKAGE_KEYWORDS)
        has_diversion = any(kw in text_lower for kw in DIVERSION_KEYWORDS)
        is_fatal = any(kw in text_lower for kw in CRITICAL_KEYWORDS)

        neg_score = sentiment_data.get("scores", {}).get("Negative", 0)
        severity_boost = 0
        if is_fatal:
            severity_boost = 2
        elif has_victims and neg_score >= 0.7:
            severity_boost = 1
        elif has_blockage:
            severity_boost = 1

        return {
            "entities": entities,
            "sentiment": sentiment_data.get("sentiment", "NEUTRAL"),
            "sentiment_score": neg_score,
            "key_phrases": key_phrases,
            "has_victims": has_victims,
            "has_blockage": has_blockage,
            "has_diversion": has_diversion,
            "is_fatal": is_fatal,
            "severity_boost": severity_boost,
        }
