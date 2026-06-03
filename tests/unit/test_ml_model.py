import pytest
from src.data.feature_engineering import build_risk_label, engineer_features
from src.data.data_cleaner import clean_prf_data


def test_risk_label_zero(sample_prf_df):
    df = sample_prf_df.copy()
    df["mortos"] = 0
    df["feridos_graves"] = 0
    df["feridos_leves"] = 0
    labels = build_risk_label(df)
    assert (labels == 0).all()


def test_risk_label_priority(sample_prf_df):
    df = sample_prf_df.copy()
    df["mortos"] = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    df["feridos_graves"] = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
    df["feridos_leves"] = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
    labels = build_risk_label(df)
    assert labels.iloc[0] == 3
    assert labels.iloc[1] == 2
    assert labels.iloc[2] == 1


def test_feature_engineering_columns(sample_prf_df):
    from src.core.constants import MODEL_FEATURES
    df, encoders = engineer_features(sample_prf_df, fit=True)
    for feat in MODEL_FEATURES:
        assert feat in df.columns, f"Feature ausente: {feat}"


def test_feature_engineering_no_nulls(sample_prf_df):
    from src.core.constants import MODEL_FEATURES
    df, _ = engineer_features(sample_prf_df, fit=True)
    for feat in MODEL_FEATURES:
        assert df[feat].notna().all(), f"Nulos em {feat}"


def test_clean_prf_removes_invalid_coords(sample_prf_df):
    import pandas as pd
    df = sample_prf_df.copy()
    # Adicionar linha com coordenada fora do Brasil
    bad = df.iloc[0:1].copy()
    bad["latitude"] = 90.0
    bad["longitude"] = 180.0
    combined = pd.concat([df, bad], ignore_index=True)
    cleaned = clean_prf_data(combined)
    assert len(cleaned) == len(df)
