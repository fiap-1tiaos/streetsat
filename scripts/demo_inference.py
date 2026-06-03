"""Demo inferência: score por segmento + roteamento. Uso: python scripts/demo_inference.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.constants import RISK_LABELS
from src.ml.inference import get_predictor
from src.routing.graph_builder import build_graph
from src.routing.path_optimizer import compare_routes, find_nearest_node

SEGMENTS = [
    (116, 225.0, {"occurrences": [], "weather": {"precipitation_mm": 0}}),
    (116, 226.0, {"occurrences": [{"narrative": "Acidente com feridos graves. Bloqueio parcial."}], "weather": {"precipitation_mm": 15}}),
    (116, 230.0, {"occurrences": [{"narrative": "Tombamento com morte. Bloqueio total."}], "weather": {"precipitation_mm": 30}}),
    (116, 250.0, {"occurrences": [], "weather": {"precipitation_mm": 0}}),
    (381, 100.0, {"occurrences": [], "weather": {"precipitation_mm": 0}}),
]


def main():
    predictor = get_predictor()

    print("\n" + "═" * 70)
    print("STREETSAT — Demo de Inferência de Risco")
    print("═" * 70)
    print(f"\n{'BR':<6} {'KM':<8} {'Score':<8} {'Label':<12} {'Confiança'}")
    print("─" * 50)

    results = []
    for br, km, context in SEGMENTS:
        try:
            result = predictor.predict_segment(br=br, km=km, context=context)
            print(f"BR-{br:<4} {km:<8.1f} {result.score:<8} {result.risk_label:<12} {result.confidence:.1%}")
            results.append((br, km, result.score))
        except Exception as e:
            print(f"BR-{br:<4} {km:<8.1f} ERRO: {e}")

    # Demo roteamento
    print("\n" + "─" * 70)
    print("ROTEAMENTO ADAPTATIVO: BR-116 KM 225 → KM 250")
    print("─" * 70)

    graph_segments = [
        {"br": 116, "km_start": 220, "km_end": 226, "lat_start": -23.48, "lon_start": -46.54,
         "lat_end": -23.45, "lon_end": -46.54, "risk_score": 0},
        {"br": 116, "km_start": 226, "km_end": 230, "lat_start": -23.45, "lon_start": -46.54,
         "lat_end": -23.42, "lon_end": -46.54, "risk_score": 2},
        {"br": 116, "km_start": 230, "km_end": 240, "lat_start": -23.42, "lon_start": -46.54,
         "lat_end": -23.38, "lon_end": -46.54, "risk_score": 3},
        {"br": 116, "km_start": 240, "km_end": 250, "lat_start": -23.38, "lon_start": -46.54,
         "lat_end": -23.35, "lon_end": -46.54, "risk_score": 1},
    ]
    G = build_graph(graph_segments)
    origin = find_nearest_node(G, 116, 225.0)
    dest = find_nearest_node(G, 116, 250.0)

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
