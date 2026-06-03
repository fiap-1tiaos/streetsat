import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

from src.core.constants import MODEL_FEATURES
from src.utils.logger import get_logger

log = get_logger(__name__)

CATEGORICAL_COLS = {
    "causa_acidente": "cause_encoded",
    "tipo_acidente": "type_encoded",
    "condicao_metereologica": "weather_encoded",
    "fase_dia": "day_phase_encoded",
    "tipo_pista": "road_type_encoded",
    "tracado_via": "road_layout_encoded",
    "uso_solo": "land_use_encoded",
    "uf": "uf_encoded",
}

NATIONAL_HOLIDAYS = {
    (1, 1), (4, 21), (5, 1), (9, 7), (10, 12),
    (11, 2), (11, 15), (11, 20), (12, 25),
}


def build_risk_label(df: pd.DataFrame) -> pd.Series:
    label = pd.Series(0, index=df.index)
    if "feridos_leves" in df.columns:
        label = np.where(df["feridos_leves"] > 0, 1, label)
    if "feridos_graves" in df.columns:
        label = np.where(df["feridos_graves"] > 0, 2, label)
    if "mortos" in df.columns:
        label = np.where(df["mortos"] > 0, 3, label)
    return pd.Series(label, index=df.index)


def engineer_features(df: pd.DataFrame, encoders: dict | None = None, fit: bool = True) -> tuple[pd.DataFrame, dict]:
    df = df.copy()

    if "data_inversa" in df.columns:
        df["month"] = df["data_inversa"].dt.month.fillna(1).astype(int)
        df["day_of_week"] = df["data_inversa"].dt.dayofweek.fillna(0).astype(int)
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["is_holiday"] = df["data_inversa"].apply(
            lambda d: int((d.month, d.day) in NATIONAL_HOLIDAYS) if pd.notna(d) else 0
        )
    else:
        for col in ("month", "day_of_week", "is_weekend", "is_holiday"):
            df[col] = 0

    if "hour" not in df.columns:
        df["hour"] = 12

    df["br_number"] = df["br"].fillna(0).astype(int)

    if "km" in df.columns:
        df["km_bucket"] = (df["km"].fillna(0) // 10 * 10).astype(int)
    else:
        df["km_bucket"] = 0

    if encoders is None:
        encoders = {}

    for src_col, dst_col in CATEGORICAL_COLS.items():
        if src_col not in df.columns:
            df[dst_col] = 0
            continue
        col_data = df[src_col].fillna("desconhecido").astype(str)
        if fit:
            le = LabelEncoder()
            df[dst_col] = le.fit_transform(col_data)
            encoders[src_col] = le
        else:
            le = encoders.get(src_col)
            if le is None:
                df[dst_col] = 0
            else:
                known = set(le.classes_)
                col_data = col_data.apply(lambda x: x if x in known else "desconhecido")
                if "desconhecido" not in known:
                    le.classes_ = np.append(le.classes_, "desconhecido")
                df[dst_col] = le.transform(col_data)

    df["lat_rounded"] = df["latitude"].round(2) if "latitude" in df.columns else 0.0
    df["lon_rounded"] = df["longitude"].round(2) if "longitude" in df.columns else 0.0

    log.info("Feature engineering concluído: %d features geradas", len(MODEL_FEATURES))
    return df, encoders


def save_encoders(encoders: dict, path: Path | str) -> None:
    with open(path, "wb") as f:
        pickle.dump(encoders, f)
    log.info("Encoders salvos em %s", path)


def load_encoders(path: Path | str) -> dict:
    with open(path, "rb") as f:
        return pickle.load(f)
