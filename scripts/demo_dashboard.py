"""Demo dashboard com dados simulados. Uso: python scripts/demo_dashboard.py"""
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils.logger import get_logger

log = get_logger("demo")

ROADS = ["SP-330", "SP-348", "BR-116", "BR-381", "BR-101", "SP-270"]
CITIES = ["Guarulhos", "Campinas", "São Paulo", "Santos", "Sorocaba", "Ribeirão Preto"]
OCC_TYPES = ["acidente", "obra", "pane seca", "tombamento", "colisão frontal"]
NARRATIVES = [
    "Tombamento de carreta com vítimas presas às ferragens. Bloqueio total.",
    "Colisão traseira entre dois veículos. Feridos leves atendidos pelo SAMU.",
    "Obra de manutenção na faixa da direita. Fluxo normal.",
    "Veículo em pane na acostamento. Sem interdição. Guincho acionado.",
    "Acidente com morte. Motorista faleceu após colisão frontal com caminhão.",
]

SP_COORDS = [(-23.5, -46.6), (-22.9, -47.1), (-23.9, -46.3), (-23.3, -47.8), (-22.1, -47.5)]


def generate_demo_occurrences(n: int = 30) -> list[dict]:
    occurrences = []
    for i in range(n):
        score = random.choices([0, 1, 2, 3], weights=[40, 30, 20, 10])[0]
        lat_base, lon_base = random.choice(SP_COORDS)
        occ = {
            "occurrence_id": f"OC-{19500 + i}",
            "road": random.choice(ROADS),
            "km": round(random.uniform(50, 400), 1),
            "municipio": random.choice(CITIES),
            "occurrence_type": random.choice(OCC_TYPES),
            "interdiction_level": min(score, 2),
            "criticality": min(score + 1, 4),
            "narrative": random.choice(NARRATIVES),
            "status": "ativa",
            "detected_at": (datetime.now() - timedelta(minutes=random.randint(0, 120))).isoformat(),
            "latitude": lat_base + random.uniform(-0.5, 0.5),
            "longitude": lon_base + random.uniform(-0.5, 0.5),
            "risk_score": score,
        }
        occurrences.append(occ)
    return occurrences


def main():
    occurrences = generate_demo_occurrences(30)
    log.info("Geradas %d ocorrências de demonstração", len(occurrences))

    from dashboard.app import create_app
    from dashboard.callbacks import set_data_stores
    from dashboard.config import HOST, PORT

    set_data_stores(occurrences, [])
    app = create_app(occurrences=occurrences, alerts=[])

    log.info("Dashboard de demo em: http://localhost:%d", PORT)
    log.info("Pressione Ctrl+C para parar")
    app.run(host=HOST, port=PORT, debug=False)


if __name__ == "__main__":
    main()
