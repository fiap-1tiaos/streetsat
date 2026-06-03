import io

import requests

from src.apis.api_client import BaseAPIClient
from src.core.config import FIRMS_MAP_KEY
from src.utils.geo_utils import bounding_box, haversine_km
from src.utils.logger import get_logger

log = get_logger(__name__)

FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


class NASAFIRMSClient(BaseAPIClient):
    DEFAULT_TTL = 10800  # 3h

    def get_fire_hotspots(self, lat: float, lon: float, radius_km: float = 50, days: int = 1) -> list[dict]:
        if not FIRMS_MAP_KEY:
            log.debug("FIRMS_MAP_KEY não configurado — retornando lista vazia")
            return []

        lat_min, lon_min, lat_max, lon_max = bounding_box(lat, lon, radius_km)
        area = f"{lon_min:.4f},{lat_min:.4f},{lon_max:.4f},{lat_max:.4f}"
        url = f"{FIRMS_BASE}/{FIRMS_MAP_KEY}/MODIS_NRT/{area}/{days}"

        try:
            resp = self.session.get(url, timeout=30)
            resp.raise_for_status()
            return self._parse_csv(resp.text)
        except Exception as e:
            log.warning("FIRMS falhou: %s", e)
            return []

    def get_max_frp_nearby(self, lat: float, lon: float) -> float:
        hotspots = self.get_fire_hotspots(lat, lon)
        if not hotspots:
            return 0.0
        return max(float(h.get("frp", 0) or 0) for h in hotspots)

    def _parse_csv(self, text: str) -> list[dict]:
        import csv
        reader = csv.DictReader(io.StringIO(text))
        results = []
        for row in reader:
            try:
                results.append({
                    "lat": float(row.get("latitude", 0)),
                    "lon": float(row.get("longitude", 0)),
                    "frp": float(row.get("frp", 0) or 0),
                    "brightness": float(row.get("brightness", 0) or 0),
                    "confidence": row.get("confidence", ""),
                    "acq_date": row.get("acq_date", ""),
                })
            except (ValueError, KeyError):
                continue
        return results
