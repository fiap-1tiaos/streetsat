import networkx as nx

from src.core.constants import RISK_PENALTY
from src.utils.geo_utils import haversine_km
from src.utils.logger import get_logger

log = get_logger(__name__)


def build_graph(segments: list[dict]) -> nx.Graph:
    G = nx.Graph()
    for seg in segments:
        br = seg.get("br", 0)
        km_s = float(seg.get("km_start", 0))
        km_e = float(seg.get("km_end", km_s + 10))
        lat_s = float(seg.get("lat_start", -15.0))
        lon_s = float(seg.get("lon_start", -50.0))
        lat_e = float(seg.get("lat_end", lat_s))
        lon_e = float(seg.get("lon_end", lon_s))
        risk = int(seg.get("risk_score", 0))

        node_s = (int(br), int(km_s))
        node_e = (int(br), int(km_e))

        G.add_node(node_s, lat=lat_s, lon=lon_s, br=br)
        G.add_node(node_e, lat=lat_e, lon=lon_e, br=br)

        dist = haversine_km(lat_s, lon_s, lat_e, lon_e)
        if dist == 0:
            dist = abs(km_e - km_s)

        weight = dist * (1 + RISK_PENALTY[risk])

        G.add_edge(node_s, node_e, distance_km=dist, risk_score=risk, weight=weight, travel_time_min=dist * 1.2)

    log.info("Grafo construído: %d nós, %d arestas", G.number_of_nodes(), G.number_of_edges())
    return G


def update_edge_weights(G: nx.Graph, risk_scores: dict) -> nx.Graph:
    for (u, v, data) in G.edges(data=True):
        key = f"{u[0]}:{u[1]}-{v[1]}"
        if key in risk_scores:
            risk = risk_scores[key]
            data["risk_score"] = risk
            data["weight"] = data["distance_km"] * (1 + RISK_PENALTY[risk])
    return G


def build_graph_from_prf(df) -> nx.Graph:
    """Constrói grafo a partir do DataFrame PRF agrupando por BR e KM."""
    import pandas as pd
    segments = []
    for br_num, group in df.groupby("br"):
        group_sorted = group.sort_values("km")
        kms = group_sorted["km"].dropna().unique()
        kms.sort()
        for i in range(len(kms) - 1):
            km_s = kms[i]
            km_e = kms[i + 1]
            slice_ = group_sorted[
                (group_sorted["km"] >= km_s) & (group_sorted["km"] < km_e)
            ]
            if slice_.empty:
                continue
            lat_s = slice_["latitude"].iloc[0] if "latitude" in slice_.columns else -15.0
            lon_s = slice_["longitude"].iloc[0] if "longitude" in slice_.columns else -50.0
            lat_e = slice_["latitude"].iloc[-1] if "latitude" in slice_.columns else lat_s
            lon_e = slice_["longitude"].iloc[-1] if "longitude" in slice_.columns else lon_s
            risk = 0
            if "risk_label" in slice_.columns:
                risk = int(slice_["risk_label"].max())
            segments.append({
                "br": int(br_num),
                "km_start": float(km_s),
                "km_end": float(km_e),
                "lat_start": float(lat_s),
                "lon_start": float(lon_s),
                "lat_end": float(lat_e),
                "lon_end": float(lon_e),
                "risk_score": risk,
            })
    return build_graph(segments)
