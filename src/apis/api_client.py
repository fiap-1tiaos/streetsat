import hashlib
import json
import time
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from src.utils.logger import get_logger

log = get_logger(__name__)

CACHE_DIR = Path("/tmp/streetsat_api_cache")
CACHE_DIR.mkdir(exist_ok=True)


class BaseAPIClient:
    BASE_URL: str = ""
    DEFAULT_TTL: int = 3600

    def __init__(self):
        self.session = requests.Session()
        retry = Retry(total=3, backoff_factor=2, status_forcelist=[429, 500, 502, 503])
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def get(self, url: str, params: dict | None = None, timeout: int = 30, ttl: int | None = None) -> Any:
        cache_key = self._cache_key(url, params)
        cached = self._cache_get(cache_key, ttl or self.DEFAULT_TTL)
        if cached is not None:
            return cached

        t0 = time.time()
        try:
            resp = self.session.get(url, params=params, timeout=timeout)
            resp.raise_for_status()
            data = resp.json()
            log.debug("GET %s → %d (%.2fs)", url, resp.status_code, time.time() - t0)
            self._cache_set(cache_key, data)
            return data
        except Exception as e:
            log.error("Erro GET %s: %s", url, e)
            raise

    def _cache_key(self, url: str, params: dict | None) -> str:
        raw = url + json.dumps(params or {}, sort_keys=True)
        return hashlib.md5(raw.encode()).hexdigest()

    def _cache_get(self, key: str, ttl: int) -> Any:
        path = CACHE_DIR / f"{key}.json"
        if not path.exists():
            return None
        if time.time() - path.stat().st_mtime > ttl:
            path.unlink(missing_ok=True)
            return None
        try:
            return json.loads(path.read_text())
        except Exception:
            return None

    def _cache_set(self, key: str, data: Any) -> None:
        try:
            (CACHE_DIR / f"{key}.json").write_text(json.dumps(data))
        except Exception:
            pass
