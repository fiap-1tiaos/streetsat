from typing import Optional

from fastapi import APIRouter, Query

from src.core.constants import RISK_LABELS
from src.db.redis_client import cache_get, cache_set
from src.db.postgres import _risk_label
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/occurrences", tags=["occurrences"])

REDIS_CACHE_KEY = "occurrences:recent"
CACHE_TTL = 600

# Stale-while-revalidate: serve cached data first (even if stale),
# falling back to Postgres only on complete cache miss. This ensures
# the API always returns the last-known-good data when ARTESP is
# temporarily unavailable, up to CACHE_TTL seconds after the last
# successful scrape.


def _load_from_cache() -> list[dict]:
    cached = cache_get(REDIS_CACHE_KEY)
    if isinstance(cached, list):
        return cached
    return []


def _load_from_postgres() -> list[dict]:
    try:
        from src.db.postgres import get_session, query_occurrences

        session = get_session()
        if session is None:
            return []
        try:
            rows = query_occurrences(session, limit=200)
            if rows:
                cache_set(REDIS_CACHE_KEY, rows, ttl=CACHE_TTL)
            return rows
        finally:
            session.close()
    except Exception as e:
        log.warning("Erro ao ler do Postgres: %s", e)
        return []


def _load_occurrences() -> list[dict]:
    raw = _load_from_cache()
    if not raw:
        raw = _load_from_postgres()
    return raw


@router.get("")
async def list_occurrences(
    uf: Optional[str] = Query(None),
    road: Optional[str] = Query(None),
    min_risk_score: int = Query(default=0, ge=0, le=3),
    limit: int = Query(default=50, le=200),
):
    raw = _load_occurrences()

    if uf:
        raw = [o for o in raw if o.get("state", "").upper() == uf.upper()]
    if road:
        raw = [o for o in raw if road.upper() in o.get("road", "").upper()]
    raw = [o for o in raw if (o.get("risk_score", 0) or 0) >= min_risk_score]
    raw = sorted(raw, key=lambda x: x.get("risk_score", 0) or 0, reverse=True)

    for o in raw:
        o["risk_label"] = o.get("risk_label") or _risk_label(o.get("risk_score", 0))

    return {"total": len(raw), "items": raw[:limit]}
