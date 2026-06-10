import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

from src.core.constants import CATEGORICAL_COLS, MODEL_FEATURES
from src.data.road_encoder import normalize_road_name
from src.utils.logger import get_logger

log = get_logger(__name__)

ARTESP_CSV_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "ccm-artesp" / "ccm-artesp.csv"


def build_risk_label(df: pd.DataFrame) -> pd.Series:
    label = pd.Series(0, index=df.index)
    is_accident = df.get("classe", "").str.lower().str.strip() == "acidente"
    label = np.where(is_accident, 1, label)
    if "feridos_leves" in df.columns:
        label = np.where(df["feridos_leves"] > 0, 1, label)
    if "feridos_graves" in df.columns:
        label = np.where(df["feridos_graves"] > 0, 2, label)
    if "mortos" in df.columns:
        label = np.where(df["mortos"] > 0, 3, label)
    return pd.Series(label, index=df.index)


def engineer_features(df: pd.DataFrame, encoders: dict | None = None, fit: bool = True) -> tuple[pd.DataFrame, dict]:
    df = df.copy()
    df, encoders = _engineer_basic_features(df, encoders, fit)
    df = _engineer_eonet_features(df)
    df = _engineer_weather_features(df)
    return df, encoders


def _engineer_basic_features(df: pd.DataFrame, encoders: dict | None = None, fit: bool = True) -> tuple[pd.DataFrame, dict]:
    df = df.copy()

    if "road" in df.columns:
        df["road"] = df["road"].apply(lambda r: normalize_road_name(str(r)))
    else:
        df["road"] = "desconhecido"

    if encoders is None:
        encoders = {}

    road_le = encoders.get("road_id")
    if road_le is None and fit:
        road_le = LabelEncoder()
        valid_roads = df["road"].fillna("desconhecido").astype(str)
        known = set(valid_roads)
        known.add("desconhecido")
        road_le.fit(list(known))
        encoders["road_id"] = road_le

    if road_le is not None:
        known = set(road_le.classes_)
        if "desconhecido" not in known:
            road_le.classes_ = np.append(road_le.classes_, "desconhecido")
        clean_roads = df["road"].fillna("desconhecido").astype(str)
        clean_roads = clean_roads.apply(lambda r: r if r in known else "desconhecido")
        df["road_id_encoded"] = road_le.transform(clean_roads)
    else:
        df["road_id_encoded"] = 0

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

    for col in ("km_mid", "has_blockage", "feridos_leves", "feridos_graves", "mortos"):
        if col not in df.columns:
            df[col] = 0

    missing = [c for c in MODEL_FEATURES if c not in df.columns]
    if missing:
        log.warning("Colunas ausentes (zeradas): %s", missing)
        for c in missing:
            df[c] = 0

    log.info("Feature engineering concluído: %d features", len(MODEL_FEATURES))
    return df, encoders


def _engineer_eonet_features(df: pd.DataFrame) -> pd.DataFrame:
    if "nearest_eonet_distance_km" not in df.columns:
        df["nearest_eonet_distance_km"] = -1

    df["nearest_eonet_distance_km"] = pd.to_numeric(df["nearest_eonet_distance_km"], errors="coerce").fillna(-1)

    df["has_nearby_eonet"] = (df["nearest_eonet_distance_km"] >= 0).astype(int)

    return df


def _engineer_weather_features(df: pd.DataFrame) -> pd.DataFrame:
    for col in ("precipitation_mm", "wind_speed_ms", "temperature_c", "humidity"):
        if col not in df.columns:
            df[col] = 0 if col in ("precipitation_mm", "wind_speed_ms") else 25 if col == "temperature_c" else 70
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0 if col in ("precipitation_mm", "wind_speed_ms") else 25 if col == "temperature_c" else 70)
    return df


def save_encoders(encoders: dict, path: Path | str) -> None:
    with open(path, "wb") as f:
        pickle.dump(encoders, f)
    log.info("Encoders salvos em %s", path)


def load_encoders(path: Path | str) -> dict:
    with open(path, "rb") as f:
        return pickle.load(f)
