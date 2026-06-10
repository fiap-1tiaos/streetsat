from pathlib import Path

import pandas as pd

from src.data.road_encoder import normalize_road_name
from src.data.victims_parser import parse_victims
from src.data.blockage_parser import has_blockage
from src.utils.logger import get_logger

log = get_logger(__name__)

DT_COL = "data_hora_inicio"
ROAD_COL = "rodovia"
KM_START_COL = "km_inicial"
KM_END_COL = "km_final"
LAT_COL = "latitude"
LNG_COL = "longitude"
VICTIMS_COL = "vitimas"
BLOCKAGE_COL = "interdicoes"
CLASSE_COL = "classe"
SUBCLASSE_COL = "subclasse_ac"
TIPO_COL = "tipo_ac"
CONCESSIONARIA_COL = "concessionaria"
MUNICIPIO_COL = "municipio"

COLUMN_MAP = {
    "data hora início": DT_COL,
    "data hora inicio": DT_COL,
    "data_hora_inicio": DT_COL,
    "km inicial": KM_START_COL,
    "km_inicial": KM_START_COL,
    "km final": KM_END_COL,
    "km_final": KM_END_COL,
    "subclasse ac.": SUBCLASSE_COL,
    "tipo ac.": TIPO_COL,
    "município": MUNICIPIO_COL,
}


def load_artesp_data(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    log.info("Carregando ARTESP: %s", path)
    df = pd.read_csv(path, sep=";", encoding="utf-8-sig", low_memory=False)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.rename(columns=COLUMN_MAP)

    if DT_COL not in df.columns:
        candidates = [c for c in df.columns if "data" in c and "hora" in c]
        if candidates:
            df[DT_COL] = pd.to_datetime(df[candidates[0]], errors="coerce")
    else:
        df[DT_COL] = pd.to_datetime(df[DT_COL], errors="coerce")

    df["hour"] = df[DT_COL].dt.hour.fillna(12).astype(int)
    df["day_of_week"] = df[DT_COL].dt.dayofweek.fillna(0).astype(int)
    df["month"] = df[DT_COL].dt.month.fillna(1).astype(int)
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    for col in (LAT_COL, LNG_COL):
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(",", ".", regex=False)
                .str.strip()
            )
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if ROAD_COL in df.columns:
        df["road"] = df[ROAD_COL].apply(normalize_road_name)
    else:
        df["road"] = "desconhecido"

    km_start = df.get(KM_START_COL)
    km_end = df.get(KM_END_COL)
    if km_start is not None and km_end is not None:
        km_start = pd.to_numeric(km_start, errors="coerce").fillna(0)
        km_end = pd.to_numeric(km_end, errors="coerce").fillna(0)
        df["km_mid"] = ((km_start + km_end) / 2).fillna(0).astype(float)
    else:
        df["km_mid"] = 0.0

    if VICTIMS_COL in df.columns:
        parsed = df[VICTIMS_COL].apply(parse_victims)
        for key in ("ilesos", "feridos_leves", "feridos_graves", "mortos"):
            df[key] = parsed.apply(lambda d: d.get(key, 0))
    else:
        for key in ("ilesos", "feridos_leves", "feridos_graves", "mortos"):
            df[key] = 0

    if BLOCKAGE_COL in df.columns:
        df["has_blockage"] = df[BLOCKAGE_COL].apply(has_blockage).astype(int)
    else:
        df["has_blockage"] = 0

    for col, default in ((SUBCLASSE_COL, "desconhecido"), (TIPO_COL, "desconhecido"),
                          (CONCESSIONARIA_COL, "desconhecido"), (MUNICIPIO_COL, "desconhecido"),
                          (CLASSE_COL, "Ocorrência")):
        if col in df.columns:
            df[col] = df[col].fillna(default).astype(str)
        else:
            df[col] = default

    log.info("Carregado: %d linhas, %d colunas", len(df), len(df.columns))
    return df
