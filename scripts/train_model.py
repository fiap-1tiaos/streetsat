import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd

from src.apis.nasa_eonet import NASAEONETClient
from src.core.config import MODELS_DIR
from src.core.constants import MODEL_FEATURES
from src.data.artesp_loader import load_artesp_data
from src.data.feature_engineering import build_risk_label, engineer_features, save_encoders
from src.models.ml_model import train
from src.utils.geo_utils import haversine_km
from src.utils.logger import get_logger

log = get_logger("train")

SP_LAT_MIN, SP_LAT_MAX = -25.5, -19.5
SP_LON_MIN, SP_LON_MAX = -53.0, -44.0


def _in_sp_bbox(lat: float, lon: float) -> bool:
    return SP_LAT_MIN <= lat <= SP_LAT_MAX and SP_LON_MIN <= lon <= SP_LON_MAX


def _enrich_with_eonet(df: pd.DataFrame) -> pd.DataFrame:
    try:
        eonet = NASAEONETClient()
        events = eonet.get_active_events()
        if not events:
            log.warning("Nenhum evento EONET ativo — features de EONET serão -1/0")
            df["nearest_eonet_distance_km"] = -1
            df["has_nearby_eonet"] = 0
            return df

        dists = []
        for _, row in df.iterrows():
            lat, lon = row.get("latitude"), row.get("longitude")
            if lat is None or lon is None or not _in_sp_bbox(lat, lon):
                dists.append(-1)
                continue
            min_dist = float("inf")
            for ev in events:
                dist = haversine_km(lat, lon, ev["lat"], ev["lon"])
                if dist < min_dist:
                    min_dist = dist
            dists.append(round(min_dist, 1) if min_dist < 150 else -1)

        df["nearest_eonet_distance_km"] = dists
        df["has_nearby_eonet"] = (df["nearest_eonet_distance_km"] >= 0).astype(int)
        log.info("EONET enriquecido: %d registros com evento próximo", int(df["has_nearby_eonet"].sum()))
    except Exception as e:
        log.warning("EONET indisponível para treino: %s", e)
        df["nearest_eonet_distance_km"] = -1
        df["has_nearby_eonet"] = 0
    return df


def _populate_heatmap(df: pd.DataFrame):
    try:
        from src.db.postgres import get_session, create_tables, populate_heatmap
        create_tables()
        session = get_session()
        if session is None:
            log.warning("Banco indisponível — heatmap não será populado")
            return
        try:
            populate_heatmap(session, df)
            log.info("Heatmap populado no banco")
        finally:
            session.close()
    except Exception as e:
        log.warning("Erro ao popular heatmap: %s", e)


def main():
    csv_path = Path("data/ccm-artesp/ccm-artesp.csv")
    if not csv_path.exists():
        log.error("CSV não encontrado: %s", csv_path)
        sys.exit(1)

    df = load_artesp_data(csv_path)
    log.info("Registros carregados: %d", len(df))

    df = df.dropna(subset=["latitude", "longitude"])
    df = df[df["road"] != "desconhecido"]
    log.info("Após limpeza: %d registros", len(df))

    df["risk_label"] = build_risk_label(df)
    log.info("Distribuição de labels:\n%s", df["risk_label"].value_counts().sort_index().to_string())

    df = _enrich_with_eonet(df)

    df, encoders = engineer_features(df, fit=True)
    X = df[MODEL_FEATURES].copy()
    y = df["risk_label"]

    pipeline, metadata = train(X, y, MODELS_DIR)

    enc_path = MODELS_DIR / "encoders.pkl"
    save_encoders(encoders, enc_path)

    log.info("Treino concluído! F1-macro: %.4f | Acurácia: %.4f",
             metadata["f1_score"], metadata["accuracy"])
    log.info("Modelo: %s", MODELS_DIR / "modelo_rf.pkl")

    _populate_heatmap(df)


if __name__ == "__main__":
    main()
