import json
from typing import Any, Optional

from src.core.config import REDIS_URL
from src.utils.logger import get_logger

log = get_logger(__name__)

_client = None


def get_redis():
    global _client
    if _client is not None:
        return _client
    try:
        import redis
        _client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=2)
        _client.ping()
        log.info("Redis conectado: %s", REDIS_URL)
    except Exception as e:
        log.warning("Redis indisponível (%s) — cache desativado", e)
        _client = None
    return _client


def cache_get(key: str) -> Optional[Any]:
    r = get_redis()
    if r is None:
        return None
    try:
        val = r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl: int = 3600) -> None:
    r = get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl, json.dumps(value))
    except Exception:
        pass


def cache_delete(key: str) -> None:
    r = get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception:
        pass
