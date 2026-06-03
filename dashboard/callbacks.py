from datetime import datetime

import requests
from dash import Input, Output, callback, html
import dash_bootstrap_components as dbc

from dashboard.config import API_URL
from dashboard.layouts.alerts import build_alerts_layout, build_alerts_list
from dashboard.layouts.risk_map import build_map_figure, build_map_layout
from dashboard.layouts.statistics import (
    build_hour_chart,
    build_interdiction_chart,
    build_road_chart,
    build_statistics_layout,
)
from src.utils.logger import get_logger

log = get_logger(__name__)

_occurrences_store: list[dict] = []
_alerts_store: list[dict] = []


def _fetch_occurrences() -> list[dict]:
    try:
        resp = requests.get(f"{API_URL}/occurrences", timeout=5)
        return resp.json().get("items", [])
    except Exception as e:
        log.warning("API /occurrences indisponível: %s — usando dados locais", e)
        return _occurrences_store


def register_callbacks(app):
    @app.callback(
        Output("tab-content", "children"),
        Input("tabs", "active_tab"),
    )
    def render_tab(tab):
        if tab == "tab-map":
            return build_map_layout()
        elif tab == "tab-table":
            return _build_table_layout()
        elif tab == "tab-stats":
            return build_statistics_layout()
        elif tab == "tab-alerts":
            return build_alerts_layout()
        return html.Div("Selecione uma aba")

    @app.callback(
        Output("risk-map", "figure"),
        [Input("interval-refresh", "n_intervals"),
         Input("btn-refresh-map", "n_clicks"),
         Input("filter-score", "value")],
        prevent_initial_call=False,
    )
    def update_map(n, clicks, min_score):
        data = _fetch_occurrences()
        filtered = [o for o in data if (o.get("risk_score") or 0) >= (min_score or 0)]
        return build_map_figure(filtered)

    @app.callback(
        [Output("total-occurrences", "children"),
         Output("critical-count", "children"),
         Output("monitored-roads", "children"),
         Output("last-update", "children")],
        Input("interval-refresh", "n_intervals"),
    )
    def update_kpis(n):
        data = _fetch_occurrences()
        total = len(data)
        critical = sum(1 for o in data if (o.get("risk_score") or 0) == 3)
        roads = len(set(o.get("road", "") for o in data if o.get("road")))
        last = f"Atualizado: {datetime.now().strftime('%H:%M:%S')}"
        return str(total), str(critical), str(roads), last

    @app.callback(
        [Output("chart-by-hour", "figure"),
         Output("chart-by-road", "figure"),
         Output("chart-interdiction", "figure")],
        Input("interval-refresh", "n_intervals"),
    )
    def update_charts(n):
        data = _fetch_occurrences()
        return build_hour_chart(data), build_road_chart(data), build_interdiction_chart(data)

    @app.callback(
        [Output("alerts-list", "children"),
         Output("alerts-count-badge", "children")],
        Input("interval-refresh", "n_intervals"),
    )
    def update_alerts(n):
        alerts = _alerts_store
        return build_alerts_list(alerts), str(len(alerts))

    @app.callback(
        Output("occurrences-table", "data"),
        Input("interval-refresh", "n_intervals"),
        prevent_initial_call=True,
    )
    def update_table(n):
        return _fetch_occurrences()


def set_data_stores(occurrences: list[dict], alerts: list[dict]):
    global _occurrences_store, _alerts_store
    _occurrences_store = occurrences
    _alerts_store = alerts


def _build_table_layout():
    from dash import dash_table
    return dash_table.DataTable(
        id="occurrences-table",
        columns=[
            {"name": "OC-ID", "id": "occurrence_id"},
            {"name": "Rodovia", "id": "road"},
            {"name": "KM", "id": "km"},
            {"name": "Município", "id": "municipio"},
            {"name": "Tipo", "id": "occurrence_type"},
            {"name": "Interdição", "id": "interdiction_level"},
            {"name": "Score", "id": "risk_score"},
        ],
        data=[],
        sort_action="native",
        sort_by=[{"column_id": "risk_score", "direction": "desc"}],
        page_size=20,
        style_data_conditional=[
            {"if": {"filter_query": "{risk_score} = 3"}, "backgroundColor": "#FADBD8"},
            {"if": {"filter_query": "{risk_score} = 2"}, "backgroundColor": "#FDEBD0"},
            {"if": {"filter_query": "{risk_score} = 1"}, "backgroundColor": "#FEFDE7"},
        ],
        style_header={"backgroundColor": "#2C3E50", "color": "white", "fontWeight": "bold"},
        style_cell={"textAlign": "left", "fontSize": "13px"},
    )
