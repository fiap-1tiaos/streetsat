import dash_bootstrap_components as dbc
from dash import dcc, html

from src.core.constants import RISK_COLORS, RISK_LABELS


def build_map_layout():
    return dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Filtros"),
                dbc.CardBody([
                    html.Label("Score Mínimo"),
                    dcc.Slider(0, 3, 1, value=0, id="filter-score",
                               marks={i: RISK_LABELS[i] for i in range(4)}),
                    html.Hr(),
                    html.Label("Rodovia (BR)"),
                    dcc.Input(id="filter-road", type="text", placeholder="Ex: 116",
                              className="form-control mb-2"),
                    html.Label("Município"),
                    dcc.Input(id="filter-municipio", type="text", placeholder="Ex: Guarulhos",
                              className="form-control mb-2"),
                    dbc.Button("Atualizar", id="btn-refresh-map", color="primary", className="w-100"),
                ]),
            ]),
            html.Hr(),
            html.Div(id="map-legend", children=_legend()),
        ], md=2),
        dbc.Col([
            dcc.Graph(
                id="risk-map",
                style={"height": "75vh"},
                config={"scrollZoom": True, "displayModeBar": False},
                figure=_empty_map(),
            ),
        ], md=10),
    ])


def _empty_map():
    import plotly.graph_objects as go
    fig = go.Figure(go.Scattermapbox())
    fig.update_layout(
        mapbox=dict(style="open-street-map", center=dict(lat=-15.0, lon=-50.0), zoom=4),
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=False,
    )
    return fig


def build_map_figure(occurrences: list[dict]) -> dict:
    import plotly.graph_objects as go

    if not occurrences:
        return _empty_map()

    lats, lons, texts, colors, sizes = [], [], [], [], []
    for occ in occurrences:
        lat = occ.get("latitude")
        lon = occ.get("longitude")
        if lat is None or lon is None:
            continue
        score = occ.get("risk_score", 0) or 0
        lats.append(lat)
        lons.append(lon)
        colors.append(RISK_COLORS.get(score, "#95A5A6"))
        sizes.append(8 + score * 4)
        texts.append(
            f"{occ.get('road', '')} KM {occ.get('km', '')} | "
            f"{occ.get('municipio', '')} | "
            f"Risco: {RISK_LABELS.get(score, '')}"
        )

    fig = go.Figure(go.Scattermapbox(
        lat=lats, lon=lons,
        mode="markers",
        marker=dict(size=sizes, color=colors, opacity=0.85),
        text=texts,
        hoverinfo="text",
    ))
    fig.update_layout(
        mapbox=dict(style="open-street-map", center=dict(lat=-15.0, lon=-50.0), zoom=4),
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=False,
    )
    return fig


def _legend():
    from src.core.constants import RISK_COLORS, RISK_LABELS
    items = []
    for score, label in RISK_LABELS.items():
        color = RISK_COLORS[score]
        items.append(
            html.Div([
                html.Span("●", style={"color": color, "fontSize": "20px"}),
                html.Span(f" {label}", className="ms-1 small"),
            ], className="d-flex align-items-center mb-1")
        )
    return items
