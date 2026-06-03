from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from src.core.constants import RISK_LABELS
from src.db.redis_client import cache_get, cache_set
from src.ml.inference import get_predictor
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/br/{br_number}/km/{km}")
async def get_risk_score(
    br_number: int,
    km: float,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    cache_key = f"prediction:br{br_number}:km{int(km)}"
    cached = cache_get(cache_key)
    if cached:
        log.debug("Cache hit: %s", cache_key)
        return cached

    predictor = get_predictor()
    context = {"occurrences": [], "weather": {}}

    try:
        result = predictor.predict_segment(br=br_number, km=km, context=context)
    except Exception as e:
        log.error("Erro na inferência br=%d km=%s: %s", br_number, km, e)
        raise HTTPException(status_code=500, detail=str(e))

    response = {
        "br": br_number,
        "km": km,
        "risk_score": result.score,
        "risk_label": RISK_LABELS.get(result.score, ""),
        "confidence": round(result.confidence, 4),
        "active_occurrences": 0,
        "weather_condition": "Não disponível",
        "timestamp": datetime.now().isoformat(),
    }

    cache_set(cache_key, response, ttl=3600)
    return response
