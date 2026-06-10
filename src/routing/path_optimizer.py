from dataclasses import dataclass

import networkx as nx

from src.utils.logger import get_logger

log = get_logger(__name__)


@dataclass
class RouteResult:
    nodes: list[tuple]
    total_distance_km: float
    max_risk_score: int
    avg_risk_score: float
    estimated_time_min: float
    risk_segments: list


def find_nearest_node(G: nx.Graph, road: str, km: float) -> tuple | None:
    candidates = [(n, abs(n[1] - km)) for n in G.nodes() if n[0] == road]
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[1])
    return candidates[0][0]


def find_safest_route(G: nx.Graph, origin: tuple, destination: tuple) -> RouteResult | None:
    try:
        path = nx.shortest_path(G, source=origin, target=destination, weight="weight")
    except nx.NetworkXNoPath:
        log.warning("Rota não encontrada entre %s e %s", origin, destination)
        return None

    total_dist = 0.0
    total_time = 0.0
    risk_scores = []

    for i in range(len(path) - 1):
        edge = G[path[i]][path[i + 1]]
        total_dist += edge.get("distance_km", 0)
        total_time += edge.get("travel_time_min", 0)
        risk_scores.append(edge.get("risk_score", 0))

    risk_segments = [
        {"from": path[i], "to": path[i + 1], "risk": risk_scores[i]}
        for i in range(len(path) - 1) if risk_scores[i] > 1
    ]

    return RouteResult(
        nodes=path,
        total_distance_km=round(total_dist, 2),
        max_risk_score=max(risk_scores) if risk_scores else 0,
        avg_risk_score=round(sum(risk_scores) / len(risk_scores), 2) if risk_scores else 0.0,
        estimated_time_min=round(total_time, 1),
        risk_segments=risk_segments,
    )


def compare_routes(G: nx.Graph, origin: tuple, destination: tuple) -> dict:
    safe = find_safest_route(G, origin, destination)
    if safe is None:
        raise ValueError(f"Nenhuma rota entre {origin} e {destination}")

    direct = find_safest_route(G, origin, destination)
    return {
        "safe": safe,
        "direct": direct,
        "km_overhead": round(safe.total_distance_km - direct.total_distance_km, 2),
        "risk_reduction": round(direct.avg_risk_score - safe.avg_risk_score, 2),
    }
