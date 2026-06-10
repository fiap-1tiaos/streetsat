from src.core.constants import RISK_PENALTY
from src.utils.logger import get_logger
import networkx as nx
from geopy.distance import geodesic

log = get_logger(__name__)


def build_graph(segments: list[dict]) -> nx.Graph:
    G = nx.Graph()

    for seg in segments:
        road = str(seg["road"])
        km_start = float(seg["km_start"])
        km_end = float(seg["km_end"])

        node_a = (road, km_start)
        node_b = (road, km_end)

        G.add_node(node_a, lat=seg.get("lat_start"), lon=seg.get("lon_start"))
        G.add_node(node_b, lat=seg.get("lat_end"), lon=seg.get("lon_end"))

        lat_start = seg.get("lat_start")
        lon_start = seg.get("lon_start")
        lat_end = seg.get("lat_end")
        lon_end = seg.get("lon_end")

        distance_km = 0
        if lat_start is not None and lon_start is not None and lat_end is not None and lon_end is not None:
            distance_km = geodesic((lat_start, lon_start), (lat_end, lon_end)).km

        risk_score = int(seg.get("risk_score", 0))
        weight = distance_km * (1 + RISK_PENALTY.get(risk_score, 0))

        travel_time_min = distance_km / 80 * 60

        G.add_edge(
            node_a, node_b,
            distance_km=distance_km,
            risk_score=risk_score,
            weight=weight,
            travel_time_min=travel_time_min,
        )

    log.info("Grafo construído: %d nós, %d arestas", G.number_of_nodes(), G.number_of_edges())
    return G


def update_edge_weights(G, risk_scores: dict):
    for u, v, data in G.edges(data=True):
        key = f"{u[0]}:{u[1]}-{v[1]}"
        if key in risk_scores:
            data["risk_score"] = risk_scores[key]
            base_dist = data.get("distance_km", 1)
            data["weight"] = base_dist * (1 + RISK_PENALTY.get(risk_scores[key], 0))
    log.info("Pesos atualizados para %d arestas", len(risk_scores))
