import dash_bootstrap_components as dbc
from dash import dcc, html


def build_statistics_layout():
    return dbc.Row([
        dbc.Col(dcc.Graph(id="chart-by-hour", style={"height": "350px"}), md=6),
        dbc.Col(dcc.Graph(id="chart-by-road", style={"height": "350px"}), md=6),
        dbc.Col(dcc.Graph(id="chart-time-series", style={"height": "350px"}), md=8),
        dbc.Col(dcc.Graph(id="chart-interdiction", style={"height": "350px"}), md=4),
    ])


def build_hour_chart(occurrences: list[dict]) -> dict:
    import plotly.graph_objects as go
    from collections import Counter

    counts = Counter(occ.get("risk_score", 0) for occ in occurrences)
    fig = go.Figure(go.Bar(
        x=[f"Score {k}" for k in sorted(counts)],
        y=[counts[k] for k in sorted(counts)],
        marker_color=["#2ECC71", "#F1C40F", "#E67E22", "#E74C3C"][:len(counts)],
    ))
    fig.update_layout(title="Distribuição por Score de Risco", margin=dict(t=40, b=0))
    return fig


def build_road_chart(occurrences: list[dict]) -> dict:
    import plotly.graph_objects as go
    from collections import Counter

    counts = Counter(occ.get("road", "N/A") for occ in occurrences)
    top = counts.most_common(10)
    fig = go.Figure(go.Bar(
        y=[r[0] for r in top[::-1]],
        x=[r[1] for r in top[::-1]],
        orientation="h",
        marker_color="#3498DB",
    ))
    fig.update_layout(title="Top 10 Rodovias por Ocorrências", margin=dict(t=40, b=0))
    return fig


def build_interdiction_chart(occurrences: list[dict]) -> dict:
    import plotly.graph_objects as go
    from collections import Counter

    labels = {0: "Livre", 1: "Parcial", 2: "Total"}
    counts = Counter(occ.get("interdiction_level", 0) for occ in occurrences)
    fig = go.Figure(go.Pie(
        labels=[labels.get(k, str(k)) for k in counts],
        values=list(counts.values()),
        marker_colors=["#2ECC71", "#F1C40F", "#E74C3C"],
    ))
    fig.update_layout(title="Tipo de Interdição", margin=dict(t=40, b=0))
    return fig
