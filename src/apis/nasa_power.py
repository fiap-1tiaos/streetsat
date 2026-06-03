from concurrent.futures import ThreadPoolExecutor, as_completed

from src.apis.api_client import BaseAPIClient
from src.core.config import NASA_API_KEY
from src.utils.logger import get_logger

log = get_logger(__name__)

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = "PRECTOTCORR,WS2M,T2M,RH2M"


class NASAPowerClient(BaseAPIClient):
    DEFAULT_TTL = 43200  # 12h

    def get_weather(self, lat: float, lon: float, date: str | None = None) -> dict:
        from datetime import datetime, timedelta

        if date is None:
            date = (datetime.now() - timedelta(days=2)).strftime("%Y%m%d")

        params = {
            "parameters": PARAMETERS,
            "community": "RE",
            "longitude": round(lon, 4),
            "latitude": round(lat, 4),
            "start": date,
            "end": date,
            "format": "JSON",
            "api_key": NASA_API_KEY,
        }

        try:
            data = self.get(POWER_URL, params=params, ttl=self.DEFAULT_TTL)
            props = data.get("properties", {}).get("parameter", {})
            result = {
                "precipitation_mm": self._first_value(props.get("PRECTOTCORR", {})),
                "wind_speed_ms": self._first_value(props.get("WS2M", {})),
                "temperature_c": self._first_value(props.get("T2M", {})),
                "humidity": self._first_value(props.get("RH2M", {})),
                "date": date,
                "lat": lat,
                "lon": lon,
            }
            return result
        except Exception as e:
            log.warning("NASA POWER falhou lat=%s lon=%s: %s", lat, lon, e)
            return {"precipitation_mm": 0.0, "wind_speed_ms": 0.0, "temperature_c": 25.0, "humidity": 70.0, "date": date, "lat": lat, "lon": lon}

    def get_weather_batch(self, locations: list[tuple[float, float]], date: str | None = None) -> list[dict]:
        results = []
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {pool.submit(self.get_weather, lat, lon, date): (lat, lon) for lat, lon in locations}
            for f in as_completed(futures):
                try:
                    results.append(f.result())
                except Exception as e:
                    lat, lon = futures[f]
                    log.warning("Batch falhou lat=%s lon=%s: %s", lat, lon, e)
        return results

    def _first_value(self, d: dict) -> float:
        if not d:
            return 0.0
        v = list(d.values())[0]
        return float(v) if v is not None and v != -999 else 0.0
