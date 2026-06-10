import pytest
from src.data.victims_parser import parse_victims


def test_parse_all_types():
    text = "ILESA: 3 | FERIDA LEVE: 2 | FERIDA GRAVE: 1 | MORTA: 1"
    result = parse_victims(text)
    assert result["ilesos"] == 3
    assert result["feridos_leves"] == 2
    assert result["feridos_graves"] == 1
    assert result["mortos"] == 1


def test_parse_empty():
    assert parse_victims(None) == {"ilesos": 0, "feridos_leves": 0, "feridos_graves": 0, "mortos": 0}
    assert parse_victims("") == {"ilesos": 0, "feridos_leves": 0, "feridos_graves": 0, "mortos": 0}


def test_parse_no_match():
    result = parse_victims("Sem vítimas. Apenas danos materiais.")
    assert all(v == 0 for v in result.values())


def test_parse_partial():
    result = parse_victims("MORTA: 2")
    assert result["mortos"] == 2
    assert result["ilesos"] == 0


def test_parse_case_insensitive():
    result = parse_victims("ilesa: 5 | morta: 1")
    assert result["ilesos"] == 5
    assert result["mortos"] == 1
