import pytest
from src.ml.scoring import score_to_label, enrich_score_with_nlp


def test_score_to_label_known():
    assert score_to_label(0) == "Livre"
    assert score_to_label(1) == "Atenção"
    assert score_to_label(2) == "Alto"
    assert score_to_label(3) == "Crítico"


def test_score_to_label_unknown():
    assert score_to_label(99) == "Desconhecido"
    assert score_to_label(-1) == "Desconhecido"


def test_enrich_no_occurrences():
    assert enrich_score_with_nlp(1, []) == 1


def test_enrich_empty_narrative():
    assert enrich_score_with_nlp(1, [{"narrative": ""}]) == 1


def test_enrich_score_caps_at_3():
    occurrences = [{"narrative": "Morto no local. Bloqueio total. Vítima fatal."}]
    assert enrich_score_with_nlp(2, occurrences) == 3
    assert enrich_score_with_nlp(3, occurrences) == 3
