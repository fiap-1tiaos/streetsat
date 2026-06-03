from src.core.constants import RISK_LABELS
from src.utils.logger import get_logger

log = get_logger(__name__)


def enrich_score_with_nlp(base_score: int, occurrences: list[dict]) -> int:
    if not occurrences:
        return base_score

    from src.nlp import get_nlp_client
    nlp = get_nlp_client()

    max_boost = 0
    for occ in occurrences:
        narrative = occ.get("narrative", "")
        if not narrative:
            continue
        result = nlp.analyze_occurrence(narrative)
        max_boost = max(max_boost, result.get("severity_boost", 0))

    enriched = min(3, base_score + max_boost)
    if enriched != base_score:
        log.info("Score enriquecido: %d → %d (NLP boost: +%d)", base_score, enriched, max_boost)
    return enriched


def score_to_label(score: int) -> str:
    return RISK_LABELS.get(score, "Desconhecido")
