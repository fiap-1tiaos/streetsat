from fastapi import APIRouter
from src.db.postgres import get_session, query_heatmap
from src.db.redis_client import cache_get, cache_set
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/occurrences", tags=["heatmap"])

CACHE_KEY = "heatmap:matrix"
CACHE_TTL = 3600

FALLBACK = {
    "days": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    "hours": [f"{h}h" for h in range(24)],
    "matrix": [[{"count": 0, "avg_risk": 0} for _ in range(24)] for _ in range(7)],
}


def _load_heatmap() -> dict | None:
    cached = cache_get(CACHE_KEY)
    if cached:
        return cached
    try:
        session = get_session()
        if session is None:
            return None
        try:
            result = query_heatmap(session)
            if result:
                data = result[0]
                cache_set(CACHE_KEY, data, ttl=CACHE_TTL)
                return data
            return None
        finally:
            session.close()
    except Exception as e:
        log.warning("Erro ao ler heatmap do banco: %s", e)
        return None


@router.get("/heatmap")
async def get_heatmap():
    data = _load_heatmap()
    return data or FALLBACK
