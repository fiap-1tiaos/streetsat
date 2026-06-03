from src.apis.api_client import BaseAPIClient
from src.utils.geo_utils import haversine_km
from src.utils.logger import get_logger

log = get_logger(__name__)

EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"
RELEVANT_CATEGORIES = {"wildfires", "severeStorms", "floods", "volcanoes", "drought"}


class NASAEONETClient(BaseAPIClient):
    DEFAULT_TTL = 1800  # 30min

    def get_active_events(self, limit: int = 50) -> list[dict]:
        params = {"status": "open", "limit": limit}
        try:
            data = self.get(EONET_URL, params=params, ttl=self.DEFAULT_TTL)
            events = []
            for ev in data.get("events", []):
                cat_ids = {c["id"] for c in ev.get("categories", [])}
                if not cat_ids.intersection(RELEVANT_CATEGORIES):
                    continue
                geometry = ev.get("geometry", [])
                if not geometry:
                    continue
                coords = geometry[0].get("coordinates", [])
                if len(coords) < 2:
                    continue
                events.append({
                    "event_id": ev.get("id", ""),
                    "title": ev.get("title", ""),
                    "category": list(cat_ids)[0] if cat_ids else "",
                    "lon": float(coords[0]),
                    "lat": float(coords[1]),
                    "date": geometry[0].get("date", ""),
                    "magnitude": geometry[0].get("magnitudeValue"),
                })
            return events
        except Exception as e:
            log.warning("EONET falhou: %s", e)
            return []

    def get_nearest_event(self, lat: float, lon: float, radius_km: float = 100) -> dict | None:
        events = self.get_active_events()
        nearest = None
        min_dist = float("inf")
        for ev in events:
            dist = haversine_km(lat, lon, ev["lat"], ev["lon"])
            if dist <= radius_km and dist < min_dist:
                min_dist = dist
                nearest = {**ev, "distance_km": round(dist, 1)}
        return nearest
