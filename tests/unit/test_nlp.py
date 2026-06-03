import pytest
from src.nlp.local_nlp import LocalNLPClient
from src.ml.scoring import enrich_score_with_nlp


@pytest.fixture
def nlp():
    return LocalNLPClient()


def test_critical_text_boost(nlp):
    result = nlp.analyze_occurrence("Acidente com morto. Vítima fatal no local.")
    assert result["severity_boost"] == 2
    assert result["is_fatal"] is True


def test_blockage_detected(nlp):
    result = nlp.analyze_occurrence("Bloqueio total da pista. Desvio sinalizado.")
    assert result["has_blockage"] is True


def test_empty_text_no_crash(nlp):
    result = nlp.analyze_occurrence("")
    assert result["severity_boost"] == 0
    assert result["sentiment"] == "NEUTRAL"


def test_enrich_score_caps_at_3(nlp):
    occurrences = [{"narrative": "Morto no local. Bloqueio total. Vítima fatal."}]
    enriched = enrich_score_with_nlp(2, occurrences)
    assert enriched == 3


def test_enrich_score_no_occurrences():
    enriched = enrich_score_with_nlp(1, [])
    assert enriched == 1


def test_enrich_score_no_narrative():
    enriched = enrich_score_with_nlp(2, [{"narrative": ""}])
    assert enriched == 2


def test_sentiment_neutral_for_routine(nlp):
    result = nlp.analyze_occurrence("Obra de manutenção. Fluxo normal.")
    assert result["sentiment"] in ("NEUTRAL", "MIXED")
    assert result["severity_boost"] == 0
