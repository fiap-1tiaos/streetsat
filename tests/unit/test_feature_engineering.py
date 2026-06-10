import numpy as np
import pandas as pd
import pytest

from src.data.feature_engineering import build_risk_label, engineer_features
from src.core.constants import MODEL_FEATURES


def test_build_risk_label_default_zero():
    df = pd.DataFrame({"classe": ["Ocorrência"]})
    result = build_risk_label(df)
    assert (result == 0).all()


def test_build_risk_label_fatal():
    df = pd.DataFrame({"classe": ["Acidente"], "mortos": [1], "feridos_graves": [0], "feridos_leves": [0]})
    result = build_risk_label(df)
    assert (result == 3).all()


def test_build_risk_label_grave():
    df = pd.DataFrame({"classe": ["Acidente"], "mortos": [0], "feridos_graves": [1], "feridos_leves": [0]})
    result = build_risk_label(df)
    assert (result == 2).all()


def test_engineer_features_returns_expected_columns():
    df = pd.DataFrame({
        "road": ["SP-330"],
        "classe": ["Acidente"],
        "subclasse_ac": ["Colisão"],
        "tipo_ac": ["Traseira"],
        "concessionaria": ["AutoBan"],
        "municipio": ["Campinas"],
        "km_mid": [100],
        "has_blockage": [0],
        "feridos_leves": [0],
        "feridos_graves": [1],
        "mortos": [0],
    })
    result, encoders = engineer_features(df)
    for feat in MODEL_FEATURES:
        assert feat in result.columns, f"Missing feature: {feat}"
    assert "road_id_encoded" in result.columns


def test_engineer_features_no_road_column():
    df = pd.DataFrame({"km_mid": [50]})
    result, encoders = engineer_features(df, fit=True)
    assert "road_id_encoded" in result.columns
    assert result["road_id_encoded"].iloc[0] >= 0


def test_engineer_features_without_fit_uses_unknown():
    df = pd.DataFrame({"km_mid": [50]})
    result, _ = engineer_features(df, fit=True)
    result2, _ = engineer_features(df, encoders={}, fit=False)
    for feat in MODEL_FEATURES:
        assert feat in result2.columns
