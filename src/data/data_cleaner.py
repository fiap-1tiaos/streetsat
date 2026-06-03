import pandas as pd

from src.core.constants import BRAZIL_BOUNDS
from src.utils.logger import get_logger

log = get_logger(__name__)


def clean_prf_data(df: pd.DataFrame) -> pd.DataFrame:
    initial = len(df)

    if "id" in df.columns:
        df = df.drop_duplicates(subset=["id"])
        log.info("Após dedup: %d linhas (removidas %d)", len(df), initial - len(df))

    df = df[df["latitude"].notna() & df["longitude"].notna()]
    df = df[
        (df["latitude"] >= BRAZIL_BOUNDS["lat_min"])
        & (df["latitude"] <= BRAZIL_BOUNDS["lat_max"])
        & (df["longitude"] >= BRAZIL_BOUNDS["lon_min"])
        & (df["longitude"] <= BRAZIL_BOUNDS["lon_max"])
    ]
    log.info("Após filtro coordenadas Brasil: %d linhas", len(df))

    if "br" in df.columns:
        df = df[df["br"].notna() & (df["br"] > 0)]

    if "km" in df.columns:
        df = df[df["km"].notna() & (df["km"] >= 0)]

    str_cols = ["causa_acidente", "tipo_acidente", "condicao_metereologica",
                "fase_dia", "tipo_pista", "tracado_via", "uso_solo", "municipio", "uf"]
    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].fillna("desconhecido").str.strip().str.lower()

    df = df[df["data_inversa"].notna()]

    final = len(df)
    log.info("Limpeza concluída: %d → %d linhas (%.1f%% retidos)",
             initial, final, 100 * final / initial if initial else 0)
    return df.reset_index(drop=True)
