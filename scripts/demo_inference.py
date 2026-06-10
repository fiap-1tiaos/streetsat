"""Demo inferência: score por segmento + roteamento. Uso: python scripts/demo_inference.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.constants import RISK_LABELS
from src.ml.inference import get_predictor
from src.routing.graph_builder import build_graph
from src.routing.path_optimizer import compare_routes, find_nearest_node

SEGMENTS = [
    ("SP-330", 100.0, {"occurrences": [], "weather": {"precipitation_mm": 0}}),
    ("SP-330", 105.0, {"occurrences": [{"narrative": "Acidente com feridos graves. Bloqueio parcial."}], "weather": {"precipitation_mm": 15}}),
    ("SP-330", 110.0, {"occurrences": [{"narrative": "Tombamento com morte. Bloqueio total."}], "weather": {"precipitation_mm": 30}}),
    ("SP-330", 150.0, {"occurrences": [], "weather": {"precipitation_mm": 0}}),
    ("SP-310", 200.0, {"occurrences": [], "weather": {"precipitation_mm": 0}}),
]


def main():
    predictor = get_predictor()

    print("\n" + "═" * 70)
    print("STREETSAT — Demo de Inferência de Risco")
    print("═" * 70)
    print(f"\n{'ROAD':<8} {'KM':<8} {'Score':<8} {'Label':<12} {'Confiança'}")
    print("─" * 50)

    results = []
    for road, km, context in SEGMENTS:
        try:
            result = predictor.predict_segment(road=road, km=km, context=context)
            print(f"{road:<8} {km:<8.1f} {result.score:<8} {result.risk_label:<12} {result.confidence:.1%}")
            results.append((road, km, result.score))
        except Exception as e:
            print(f"{road:<8} {km:<8.1f} ERRO: {e}")

    print("\n" + "─" * 70)
    print("ROTEAMENTO ADAPTATIVO: SP-330 KM 100 → KM 150")
    print("─" * 70)

    graph_segments = [
        {"road": "SP-330", "km_start": 100, "km_end": 105, "lat_start": -23.48, "lon_start": -46.54,
         "lat_end": -23.45, "lon_end": -46.54, "risk_score": 0},
        {"road": "SP-330", "km_start": 105, "km_end": 110, "lat_start": -23.45, "lon_start": -46.54,
         "lat_end": -23.42, "lon_end": -46.54, "risk_score": 2},
        {"road": "SP-330", "km_start": 110, "km_end": 130, "lat_start": -23.42, "lon_start": -46.54,
         "lat_end": -23.38, "lon_end": -46.54, "risk_score": 3},
        {"road": "SP-330", "km_start": 130, "km_end": 150, "lat_start": -23.38, "lon_start": -46.54,
         "lat_end": -23.35, "lon_end": -46.54, "risk_score": 1},
    ]
    G = build_graph(graph_segments)
    origin = find_nearest_node(G, "SP-330", 100.0)
    dest = find_nearest_node(G, "SP-330", 150.0)

    if origin and dest:
        try:
            comparison = compare_routes(G, origin, dest)
            safe = comparison["safe"]
            direct = comparison["direct"]
            print(f"Rota direta:    {direct.total_distance_km:.1f} km | Score máx: {direct.max_risk_score} | {RISK_LABELS[direct.max_risk_score]}")
            print(f"Rota segura:    {safe.total_distance_km:.1f} km | Score máx: {safe.max_risk_score}  | {RISK_LABELS[safe.max_risk_score]}")
            print(f"Overhead:       +{comparison['km_overhead']:.1f} km")
            print(f"Redução risco:  {comparison['risk_reduction']:.2f} pontos")
        except Exception as e:
            print(f"Roteamento falhou: {e}")

    print("\n" + "═" * 70 + "\n")


if __name__ == "__main__":
    main()
