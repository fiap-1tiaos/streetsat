import json
import time
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.routes.alerts_routes import router as alerts_router
from src.api.routes.heatmap_routes import router as heatmap_router
from src.api.routes.model_routes import router as model_router
from src.api.routes.nasa_routes import router as nasa_router
from src.api.routes.occurrences_routes import router as occurrences_router
from src.api.routes.pipeline_routes import router as pipeline_router
from src.api.routes.risk_routes import router as risk_router
from src.api.routes.route_routes import router as route_router
from src.utils.logger import get_logger

log = get_logger(__name__)

def _init_db():
    try:
        from src.db.postgres import create_tables
        create_tables()
    except Exception as e:
        log.warning("Não foi possível inicializar PostgreSQL: %s", e)


app = FastAPI(
    title="Streetsat API",
    description="Monitoramento inteligente de rotas via satélite e IA",
    version="1.0.0",
    on_startup=[_init_db],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - t0) * 1000)
    log.info("%s %s → %d (%dms)", request.method, request.url.path, response.status_code, elapsed)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("Erro não tratado: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": type(exc).__name__, "detail": str(exc), "timestamp": datetime.now().isoformat()},
    )


app.include_router(alerts_router)
app.include_router(heatmap_router)
app.include_router(model_router)
app.include_router(nasa_router)
app.include_router(occurrences_router)
app.include_router(pipeline_router)
app.include_router(risk_router)
app.include_router(route_router)


@app.get("/health", tags=["health"])
async def health():
    from src.ml.inference import get_predictor
    predictor = get_predictor()
    return {
        "status": "ok",
        "model_loaded": predictor._pipeline is not None,
        "model_version": predictor._metadata.get("version", "unknown"),
        "timestamp": datetime.now().isoformat(),
    }


# Mangum handler para Lambda
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.fastapi_app:app", host="0.0.0.0", port=8000, reload=True)
