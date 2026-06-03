import time
from abc import ABC, abstractmethod

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from src.utils.logger import get_logger

log = get_logger(__name__)

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class BaseScraper(ABC):
    BASE_URL: str = ""
    RATE_LIMIT_SEC: float = 1.0

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(BROWSER_HEADERS)
        retry = Retry(total=3, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        self._last_request = 0.0

    def _get(self, path: str, params: dict | None = None, timeout: int = 30) -> requests.Response:
        elapsed = time.time() - self._last_request
        if elapsed < self.RATE_LIMIT_SEC:
            time.sleep(self.RATE_LIMIT_SEC - elapsed)

        url = self.BASE_URL + path
        log.debug("GET %s params=%s", url, params)
        resp = self.session.get(url, params=params, timeout=timeout)
        self._last_request = time.time()
        resp.raise_for_status()
        return resp

    @abstractmethod
    def scrape(self) -> list[dict]:
        ...
