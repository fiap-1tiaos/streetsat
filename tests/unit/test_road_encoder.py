import numpy as np
import pytest
from sklearn.preprocessing import LabelEncoder

from src.data.road_encoder import RoadEncoder, normalize_road_name


def test_normalize_sp330():
    assert normalize_road_name("SP330") == "SP-330"


def test_normalize_sp330_with_space():
    assert normalize_road_name("SP 330") == "SP-330"


def test_normalize_sp310():
    assert normalize_road_name("SP310") == "SP-310"


def test_normalize_case_insensitive():
    assert normalize_road_name("sp330") == "SP-330"


def test_normalize_unknown():
    assert normalize_road_name("Marginal Tietê") == "Marginal Tietê"


def test_road_encoder_encode_known():
    le = LabelEncoder()
    le.fit(["SP-330", "SP-310", "desconhecido"])
    encoders = {"road_id": le}
    encoder = RoadEncoder(encoders)
    idx = encoder.encode("SP-330")
    assert idx == list(le.classes_).index("SP-330")


def test_road_encoder_encode_unknown():
    le = LabelEncoder()
    le.fit(["SP-330", "SP-310", "desconhecido"])
    encoders = {"road_id": le}
    encoder = RoadEncoder(encoders)
    idx = encoder.encode("SP-999")
    assert idx == list(le.classes_).index("desconhecido")


def test_road_encoder_missing_encoder():
    with pytest.raises(ValueError, match="road_id encoder not found"):
        RoadEncoder({})
