from pathlib import Path

import pandas as pd

from src.utils.logger import get_logger

log = get_logger(__name__)


def load_prf_data(paths: list[str | Path]) -> pd.DataFrame:
    frames = []
    for path in paths:
        path = Path(path)
        if not path.exists():
            log.warning("Arquivo não encontrado: %s", path)
            continue
        log.info("Carregando %s ...", path.name)
        df = pd.read_csv(
            path,
            sep=";",
            encoding="latin-1",
            low_memory=False,
        )
        log.info("  → %d linhas, %d colunas", len(df), len(df.columns))
        frames.append(df)

    if not frames:
        raise FileNotFoundError("Nenhum arquivo PRF encontrado nos caminhos fornecidos.")

    combined = pd.concat(frames, ignore_index=True)
    log.info("Total combinado: %d linhas", len(combined))

    combined = _normalize_columns(combined)
    return combined


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [c.strip().lower() for c in df.columns]

    if "data_inversa" in df.columns:
        df["data_inversa"] = pd.to_datetime(df["data_inversa"], errors="coerce")

    if "horario" in df.columns:
        df["hour"] = df["horario"].str[:2].astype(float, errors="ignore").fillna(0).astype(int)

    for col in ("latitude", "longitude"):
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(",", ".", regex=False)
                .str.strip()
            )
            df[col] = pd.to_numeric(df[col], errors="coerce")

    for col in ("mortos", "feridos_graves", "feridos_leves", "feridos", "ilesos", "pessoas", "veiculos"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    if "br" in df.columns:
        df["br"] = pd.to_numeric(df["br"], errors="coerce")

    if "km" in df.columns:
        df["km"] = (
            df["km"]
            .astype(str)
            .str.replace(",", ".", regex=False)
            .pipe(pd.to_numeric, errors="coerce")
        )

    return df
