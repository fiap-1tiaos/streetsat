import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("ENV", "test")
os.environ.setdefault("COMPREHEND_ENABLED", "false")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("NASA_API_KEY", "DEMO_KEY")


@pytest.fixture
def sample_prf_df():
    import pandas as pd
    from datetime import datetime

    return pd.DataFrame({
        "id": range(10),
        "data_inversa": pd.to_datetime(["2025-01-15"] * 10),
        "horario": ["08:00:00"] * 10,
        "hour": [8] * 10,
        "uf": ["SP"] * 10,
        "br": [116.0] * 10,
        "km": [225.0 + i for i in range(10)],
        "municipio": ["guarulhos"] * 10,
        "causa_acidente": ["reacao tardia"] * 10,
        "tipo_acidente": ["colisao traseira"] * 10,
        "classificacao_acidente": ["com vitimas feridas"] * 5 + ["sem vitimas"] * 5,
        "fase_dia": ["pleno dia"] * 10,
        "condicao_metereologica": ["ceu claro"] * 10,
        "tipo_pista": ["dupla"] * 10,
        "tracado_via": ["reta"] * 10,
        "uso_solo": ["sim"] * 10,
        "mortos": [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "feridos_graves": [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        "feridos_leves": [1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        "ilesos": [1] * 10,
        "pessoas": [2] * 10,
        "latitude": [-23.48 + i * 0.01 for i in range(10)],
        "longitude": [-46.54] * 10,
    })


@pytest.fixture
def sample_occurrence():
    return {
        "occurrence_id": "OC-19500",
        "road": "SP-330",
        "km": 225.0,
        "municipio": "Guarulhos",
        "occurrence_type": "acidente",
        "interdiction_level": 1,
        "criticality": 3,
        "narrative": "Tombamento de carreta com vítimas presas às ferragens. Bloqueio total.",
        "status": "ativa",
        "latitude": -23.48,
        "longitude": -46.54,
    }
