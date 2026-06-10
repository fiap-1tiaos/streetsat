from datetime import datetime

from src.apis.api_client import BaseAPIClient
from src.core.constants import SP_BOUNDS
from src.utils.geo_utils import haversine_km
from src.utils.logger import get_logger

log = get_logger(__name__)

EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"

RELEVANT_CATEGORIES = {"wildfires", "severeStorms", "floods", "landslides"}

SP_LAT_MIN, SP_LAT_MAX = SP_BOUNDS["lat_min"], SP_BOUNDS["lat_max"]
SP_LON_MIN, SP_LON_MAX = SP_BOUNDS["lon_min"], SP_BOUNDS["lon_max"]


def _in_sp_bbox(lat: float, lon: float) -> bool:
    return SP_LAT_MIN <= lat <= SP_LAT_MAX and SP_LON_MIN <= lon <= SP_LON_MAX


class NASAEONETClient(BaseAPIClient):
    DEFAULT_TTL = 1800

    def get_active_events(self, limit: int = 100) -> list[dict]:
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
                lon, lat = float(coords[0]), float(coords[1])
                if not _in_sp_bbox(lat, lon):
                    continue
                events.append({
                    "event_id": ev.get("id", ""),
                    "title": ev.get("title", ""),
                    "category": list(cat_ids)[0] if cat_ids else "",
                    "lon": lon,
                    "lat": lat,
                    "date": geometry[0].get("date", ""),
                    "magnitude": geometry[0].get("magnitudeValue"),
                })
            return events
        except Exception as e:
            log.warning("EONET falhou: %s", e)
            return []

    def get_nearest_event(self, lat: float, lon: float, radius_km: float = 150) -> dict | None:
        events = self.get_active_events()
        nearest = None
        min_dist = float("inf")
        for ev in events:
            dist = haversine_km(lat, lon, ev["lat"], ev["lon"])
            if dist <= radius_km and dist < min_dist:
                min_dist = dist
                nearest = {**ev, "distance_km": round(dist, 1)}
        return nearest

    def enrich_occurrences(self, occurrences: list[dict]) -> list[dict]:
        events = self.get_active_events()
        enriched = []
        for occ in occurrences:
            lat = occ.get("latitude")
            lon = occ.get("longitude")
            if lat is not None and lon is not None and events:
                nearest = None
                min_dist = float("inf")
                for ev in events:
                    dist = haversine_km(lat, lon, ev["lat"], ev["lon"])
                    if dist < min_dist:
                        min_dist = dist
                        nearest = {**ev, "distance_km": round(dist, 1)}
                if nearest and nearest["distance_km"] <= 150:
                    occ["nearest_eonet_distance_km"] = nearest["distance_km"]
                    occ["nearest_eonet_category"] = nearest["category"]
                else:
                    occ["nearest_eonet_distance_km"] = -1
                    occ["nearest_eonet_category"] = "none"
            else:
                occ["nearest_eonet_distance_km"] = -1
                occ["nearest_eonet_category"] = "none"
            enriched.append(occ)
        return enriched
