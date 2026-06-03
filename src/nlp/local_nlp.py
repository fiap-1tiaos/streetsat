from src.core.constants import (
    BLOCKAGE_KEYWORDS,
    CRITICAL_KEYWORDS,
    DIVERSION_KEYWORDS,
    HIGH_KEYWORDS,
    MEDIUM_KEYWORDS,
)
from src.utils.logger import get_logger

log = get_logger(__name__)


class LocalNLPClient:
    def detect_entities(self, text: str, language: str = "pt") -> list[dict]:
        entities = []
        text_lower = text.lower()
        for kw in CRITICAL_KEYWORDS + HIGH_KEYWORDS:
            if kw in text_lower:
                entities.append({"type": "EVENT", "text": kw, "score": 0.9})
        if "km" in text_lower or "rodovia" in text_lower or "br-" in text_lower:
            entities.append({"type": "LOCATION", "text": "rodovia", "score": 0.8})
        return entities

    def detect_sentiment(self, text: str, language: str = "pt") -> dict:
        text_lower = text.lower()
        negative_count = sum(1 for kw in CRITICAL_KEYWORDS + HIGH_KEYWORDS if kw in text_lower)
        neutral_count = sum(1 for kw in MEDIUM_KEYWORDS if kw in text_lower)

        if negative_count >= 2:
            sentiment = "NEGATIVE"
            score = min(0.95, 0.6 + negative_count * 0.1)
        elif negative_count == 1:
            sentiment = "NEGATIVE"
            score = 0.7
        elif neutral_count > 0:
            sentiment = "MIXED"
            score = 0.5
        else:
            sentiment = "NEUTRAL"
            score = 0.6

        return {
            "sentiment": sentiment,
            "scores": {
                "Negative": score if sentiment == "NEGATIVE" else 0.1,
                "Positive": 0.05,
                "Neutral": 0.8 if sentiment == "NEUTRAL" else 0.1,
                "Mixed": score if sentiment == "MIXED" else 0.05,
            },
        }

    def detect_key_phrases(self, text: str, language: str = "pt") -> list[str]:
        text_lower = text.lower()
        phrases = []
        for kw in CRITICAL_KEYWORDS + HIGH_KEYWORDS + MEDIUM_KEYWORDS + BLOCKAGE_KEYWORDS + DIVERSION_KEYWORDS:
            if kw in text_lower:
                phrases.append(kw)
        return phrases

    def analyze_occurrence(self, text: str) -> dict:
        if not text or not text.strip():
            return self._empty_result()

        text_lower = text.lower()
        entities = self.detect_entities(text)
        sentiment_data = self.detect_sentiment(text)
        key_phrases = self.detect_key_phrases(text)

        has_victims = any(kw in text_lower for kw in CRITICAL_KEYWORDS + HIGH_KEYWORDS)
        has_blockage = any(kw in text_lower for kw in BLOCKAGE_KEYWORDS)
        has_diversion = any(kw in text_lower for kw in DIVERSION_KEYWORDS)
        is_fatal = any(kw in text_lower for kw in CRITICAL_KEYWORDS)

        severity_boost = 0
        if is_fatal:
            severity_boost = 2
        elif has_victims and sentiment_data["sentiment"] == "NEGATIVE":
            severity_boost = 1
        elif has_blockage:
            severity_boost = 1

        log.debug("NLP local: sentiment=%s boost=%d", sentiment_data["sentiment"], severity_boost)

        return {
            "entities": entities,
            "sentiment": sentiment_data["sentiment"],
            "sentiment_score": sentiment_data["scores"].get("Negative", 0),
            "key_phrases": key_phrases,
            "has_victims": has_victims,
            "has_blockage": has_blockage,
            "has_diversion": has_diversion,
            "is_fatal": is_fatal,
            "severity_boost": severity_boost,
        }

    def _empty_result(self) -> dict:
        return {
            "entities": [],
            "sentiment": "NEUTRAL",
            "sentiment_score": 0.0,
            "key_phrases": [],
            "has_victims": False,
            "has_blockage": False,
            "has_diversion": False,
            "is_fatal": False,
            "severity_boost": 0,
        }
