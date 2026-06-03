from dataclasses import dataclass, field

import networkx as nx

from src.core.constants import RISK_LABELS
from src.core.exceptions import RoutingError
from src.utils.logger import get_logger

log = get_logger(__name__)


@dataclass
class RouteResult:
    nodes: list[tuple]
    total_distance_km: float
    max_risk_score: int
    avg_risk_score: float
    estimated_time_min: float
    risk_segments: list[dict] = field(default_factory=list)
    alternative_available: bool = False


def find_nearest_node(G: nx.Graph, br: int, km: float) -> tuple | None:
    candidates = [(b, k) for (b, k) in G.nodes if b == br]
    if not candidates:
        return None
    return min(candidates, key=lambda n: abs(n[1] - km))


def find_safest_route(G: nx.Graph, origin: tuple, destination: tuple) -> RouteResult:
    try:
        path = nx.shortest_path(G, source=origin, target=destination, weight="weight")
    except nx.NetworkXNoPath:
        raise RoutingError(f"Sem rota entre {origin} e {destination}")
    except nx.NodeNotFound as e:
        raise RoutingError(f"Nó não encontrado: {e}")

    total_dist = 0.0
    total_time = 0.0
    risk_scores = []
    risk_segments = []

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        data = G.edges[u, v]
        dist = data.get("distance_km", 0)
        risk = data.get("risk_score", 0)
        total_dist += dist
        total_time += data.get("travel_time_min", dist * 1.2)
        risk_scores.append(risk)
        if risk > 1:
            risk_segments.append({
                "from": u,
                "to": v,
                "risk_score": risk,
                "risk_label": RISK_LABELS.get(risk, ""),
                "distance_km": dist,
            })

    return RouteResult(
        nodes=path,
        total_distance_km=round(total_dist, 2),
        max_risk_score=max(risk_scores) if risk_scores else 0,
        avg_risk_score=round(sum(risk_scores) / len(risk_scores), 2) if risk_scores else 0.0,
        estimated_time_min=round(total_time, 1),
        risk_segments=risk_segments,
        alternative_available=len(risk_segments) > 0,
    )


def compare_routes(G: nx.Graph, origin: tuple, destination: tuple) -> dict:
    safe_route = find_safest_route(G, origin, destination)

    G_direct = G.copy()
    for u, v in G_direct.edges():
        G_direct.edges[u, v]["weight"] = G_direct.edges[u, v].get("distance_km", 1)
    try:
        direct_route = find_safest_route(G_direct, origin, destination)
    except RoutingError:
        direct_route = safe_route

    km_overhead = safe_route.total_distance_km - direct_route.total_distance_km
    risk_reduction = direct_route.avg_risk_score - safe_route.avg_risk_score

    return {
        "direct": direct_route,
        "safe": safe_route,
        "km_overhead": round(km_overhead, 2),
        "risk_reduction": round(risk_reduction, 2),
    }
