import dash_bootstrap_components as dbc
from dash import dcc, html

from src.core.constants import RISK_COLORS, RISK_LABELS


def build_layout():
    return dbc.Container(
        fluid=True,
        children=[
            dcc.Interval(id="interval-refresh", interval=300_000, n_intervals=0),
            dbc.Navbar(
                dbc.Container([
                    dbc.NavbarBrand("🛰️ Streetsat", className="fw-bold fs-4"),
                    dbc.Nav([
                        html.Span(id="last-update", className="text-muted small me-3"),
                        *[
                            dbc.Badge(RISK_LABELS[i], color=_color_name(i), className="me-1")
                            for i in range(4)
                        ],
                    ], navbar=True),
                ]),
                color="dark", dark=True, className="mb-3",
            ),
            _kpi_row(),
            dbc.Tabs(
                id="tabs",
                active_tab="tab-map",
                children=[
                    dbc.Tab(label="🗺️ Mapa de Risco", tab_id="tab-map"),
                    dbc.Tab(label="📋 Ocorrências", tab_id="tab-table"),
                    dbc.Tab(label="📊 Estatísticas", tab_id="tab-stats"),
                    dbc.Tab(label="🚨 Alertas", tab_id="tab-alerts"),
                ],
                className="mb-3",
            ),
            html.Div(id="tab-content"),
        ],
    )


def _kpi_row():
    return dbc.Row([
        dbc.Col(_kpi_card("total-occurrences", "Ocorrências Ativas", "0", "primary"), md=3),
        dbc.Col(_kpi_card("critical-count", "Críticas (Score 3)", "0", "danger"), md=3),
        dbc.Col(_kpi_card("monitored-roads", "BRs Monitoradas", "0", "info"), md=3),
        dbc.Col(_kpi_card("model-accuracy", "Acurácia do Modelo", "-", "success"), md=3),
    ], className="mb-3")


def _kpi_card(element_id: str, title: str, default: str, color: str):
    return dbc.Card(
        dbc.CardBody([
            html.H6(title, className="card-subtitle text-muted"),
            html.H2(default, id=element_id, className=f"text-{color} fw-bold"),
        ]),
        className="shadow-sm",
    )


def _color_name(score: int) -> str:
    return {0: "success", 1: "warning", 2: "orange", 3: "danger"}.get(score, "secondary")
