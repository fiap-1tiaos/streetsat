from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

from src.db.redis_client import cache_get, cache_set
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/alerts", tags=["alerts"])

REDIS_CACHE_KEY = "alerts:recent"
CACHE_TTL = 120


def _load_from_cache() -> list[dict]:
    cached = cache_get(REDIS_CACHE_KEY)
    if isinstance(cached, list):
        return cached
    return []


def _load_from_postgres() -> list[dict]:
    try:
        from src.db.postgres import get_session, query_alerts

        session = get_session()
        if session is None:
            return []
        try:
            rows = query_alerts(session, min_risk_score=1, limit=200)
            if rows:
                cache_set(REDIS_CACHE_KEY, rows, ttl=CACHE_TTL)
            return rows
        finally:
            session.close()
    except Exception as e:
        log.warning("Erro ao ler alerts do Postgres: %s", e)
        return []


@router.get("")
async def list_alerts(
    min_risk_score: int = Query(default=0, ge=0, le=3),
    date_from: Optional[str] = Query(None),
    limit: int = Query(default=100, le=500),
):
    items = _load_from_cache()
    if not items:
        items = _load_from_postgres()

    if min_risk_score > 0:
        items = [a for a in items if a.get("risk_score", 0) >= min_risk_score]
    if date_from:
        items = [a for a in items if (a.get("timestamp") or "")[:10] >= date_from]

    items.sort(key=lambda a: a.get("timestamp", ""), reverse=True)
    return {"total": len(items), "items": items[:limit]}
