from src.apis.api_client import BaseAPIClient
from src.utils.logger import get_logger

log = get_logger(__name__)

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


class WeatherClient(BaseAPIClient):
    DEFAULT_TTL = 1800

    def get_current_weather(self, lat: float, lon: float) -> dict:
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
            "timezone": "America/Sao_Paulo",
        }
        try:
            data = self.get(WEATHER_URL, params=params, ttl=self.DEFAULT_TTL)
            current = data.get("current", {})
            return {
                "temperature_c": current.get("temperature_2m", 25),
                "humidity": current.get("relative_humidity_2m", 70),
                "precipitation_mm": current.get("precipitation", 0),
                "wind_speed_ms": current.get("wind_speed_10m", 0),
                "lat": lat,
                "lon": lon,
                "time": current.get("time", ""),
            }
        except Exception as e:
            log.warning("Weather API falhou lat=%s lon=%s: %s", lat, lon, e)
            return {"temperature_c": 25, "humidity": 70, "precipitation_mm": 0, "wind_speed_ms": 0, "lat": lat, "lon": lon, "time": ""}
