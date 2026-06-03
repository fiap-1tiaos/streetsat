import pytest
import networkx as nx
from src.routing.graph_builder import build_graph
from src.routing.path_optimizer import find_nearest_node, find_safest_route, compare_routes
from src.core.exceptions import RoutingError


@pytest.fixture
def simple_graph():
    segments = [
        {"br": 116, "km_start": 0, "km_end": 10, "lat_start": -23.0, "lon_start": -46.0,
         "lat_end": -23.1, "lon_end": -46.0, "risk_score": 0},
        {"br": 116, "km_start": 10, "km_end": 20, "lat_start": -23.1, "lon_start": -46.0,
         "lat_end": -23.2, "lon_end": -46.0, "risk_score": 2},
        {"br": 116, "km_start": 20, "km_end": 30, "lat_start": -23.2, "lon_start": -46.0,
         "lat_end": -23.3, "lon_end": -46.0, "risk_score": 1},
    ]
    return build_graph(segments)


def test_graph_has_nodes(simple_graph):
    assert simple_graph.number_of_nodes() > 0


def test_graph_has_edges(simple_graph):
    assert simple_graph.number_of_edges() > 0


def test_edge_weights_positive(simple_graph):
    for u, v, data in simple_graph.edges(data=True):
        assert data["weight"] > 0


def test_find_nearest_node(simple_graph):
    node = find_nearest_node(simple_graph, 116, 5.0)
    assert node is not None
    assert node[0] == 116


def test_route_found(simple_graph):
    origin = find_nearest_node(simple_graph, 116, 0)
    dest = find_nearest_node(simple_graph, 116, 30)
    result = find_safest_route(simple_graph, origin, dest)
    assert result.total_distance_km > 0
    assert 0 <= result.max_risk_score <= 3


def test_compare_routes(simple_graph):
    origin = find_nearest_node(simple_graph, 116, 0)
    dest = find_nearest_node(simple_graph, 116, 30)
    comparison = compare_routes(simple_graph, origin, dest)
    assert "safe" in comparison
    assert "direct" in comparison
    assert isinstance(comparison["km_overhead"], float)
