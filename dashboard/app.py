import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import dash
import dash_bootstrap_components as dbc

from dashboard.callbacks import register_callbacks, set_data_stores
from dashboard.config import DEBUG, HOST, PORT
from dashboard.layouts.main import build_layout
from src.utils.logger import get_logger

log = get_logger("dashboard")


def create_app(occurrences: list[dict] | None = None, alerts: list[dict] | None = None) -> dash.Dash:
    app = dash.Dash(
        __name__,
        external_stylesheets=[dbc.themes.DARKLY],
        suppress_callback_exceptions=True,
        title="Streetsat",
    )
    app.layout = build_layout()
    register_callbacks(app)

    if occurrences is not None or alerts is not None:
        set_data_stores(occurrences or [], alerts or [])

    return app


if __name__ == "__main__":
    log.info("Iniciando Streetsat Dashboard em http://%s:%d", HOST, PORT)
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG)
