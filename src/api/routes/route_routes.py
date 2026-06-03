from fastapi import APIRouter, HTTPException

from src.core.exceptions import RoutingError
from src.routing.graph_builder import build_graph
from src.routing.path_optimizer import compare_routes, find_nearest_node, find_safest_route
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/route", tags=["route"])

_graph = None


def set_graph(g):
    global _graph
    _graph = g


def _get_or_build_graph():
    global _graph
    if _graph is None:
        segments = [
            {"br": 116, "km_start": i * 10, "km_end": (i + 1) * 10,
             "lat_start": -23.5 + i * 0.05, "lon_start": -46.5,
             "lat_end": -23.5 + (i + 1) * 0.05, "lon_end": -46.5,
             "risk_score": 0}
            for i in range(20)
        ]
        _graph = build_graph(segments)
    return _graph


@router.post("/optimize")
async def optimize_route(body: dict):
    origin_data = body.get("origin", {})
    dest_data = body.get("destination", {})

    origin_br = origin_data.get("br", 116)
    origin_km = float(origin_data.get("km", 0))
    dest_br = dest_data.get("br", 116)
    dest_km = float(dest_data.get("km", 100))

    G = _get_or_build_graph()

    origin = find_nearest_node(G, origin_br, origin_km)
    destination = find_nearest_node(G, dest_br, dest_km)

    if not origin or not destination:
        raise HTTPException(status_code=404, detail="Nós de origem/destino não encontrados no grafo")

    try:
        comparison = compare_routes(G, origin, destination)
        safe = comparison["safe"]
        direct = comparison["direct"]
        return {
            "origin": {"br": origin[0], "km": origin[1]},
            "destination": {"br": destination[0], "km": destination[1]},
            "safe_route": {
                "nodes": [{"br": n[0], "km": n[1]} for n in safe.nodes],
                "total_distance_km": safe.total_distance_km,
                "max_risk_score": safe.max_risk_score,
                "avg_risk_score": safe.avg_risk_score,
                "estimated_time_min": safe.estimated_time_min,
                "risk_segments_count": len(safe.risk_segments),
            },
            "direct_route": {
                "total_distance_km": direct.total_distance_km,
                "max_risk_score": direct.max_risk_score,
                "avg_risk_score": direct.avg_risk_score,
            },
            "km_overhead": comparison["km_overhead"],
            "risk_reduction": comparison["risk_reduction"],
        }
    except RoutingError as e:
        raise HTTPException(status_code=422, detail=str(e))
