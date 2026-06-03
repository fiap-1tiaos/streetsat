import dash_bootstrap_components as dbc
from dash import html


def build_alerts_layout():
    return dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader([
                    html.H5("Alertas Recentes", className="mb-0 d-inline"),
                    dbc.Badge("0", id="alerts-count-badge", color="danger", className="ms-2"),
                ]),
                dbc.CardBody(html.Div(id="alerts-list")),
            ]),
        ], md=12),
    ])


def build_alerts_list(alerts: list[dict]) -> list:
    if not alerts:
        return [html.P("Nenhum alerta recente.", className="text-muted")]

    items = []
    color_map = {0: "success", 1: "warning", 2: "orange", 3: "danger"}
    for alert in alerts[:20]:
        score = alert.get("risk_score", 0)
        color = color_map.get(score, "secondary")
        items.append(
            dbc.ListGroupItem([
                dbc.Row([
                    dbc.Col(html.Strong(alert.get("occurrence_id", "")), md=2),
                    dbc.Col(alert.get("message", "")[:80] + "...", md=7),
                    dbc.Col(dbc.Badge(f"Score {score}", color=color), md=1),
                    dbc.Col(alert.get("created_at", "")[:16], md=2, className="text-muted small"),
                ])
            ])
        )
    return [dbc.ListGroup(items)]
