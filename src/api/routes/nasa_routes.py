import json
import os
from collections import Counter
from datetime import datetime

import boto3
from fastapi import APIRouter

from src.core.constants import SP_BOUNDS
from src.utils.geo_utils import haversine_km
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/nasa", tags=["nasa"])

AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")

SP_CENTER_LAT, SP_CENTER_LON = -23.5, -46.6
SP_RADIUS_KM = 350

SP_LAT_MIN, SP_LAT_MAX = SP_BOUNDS["lat_min"], SP_BOUNDS["lat_max"]
SP_LON_MIN, SP_LON_MAX = SP_BOUNDS["lon_min"], SP_BOUNDS["lon_max"]


def _aws_kwargs():
    kwargs = {"region_name": AWS_REGION}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return kwargs


def _in_sp_bbox(lat: float, lon: float) -> bool:
    return SP_LAT_MIN <= lat <= SP_LAT_MAX and SP_LON_MIN <= lon <= SP_LON_MAX


@router.get("/status")
async def nasa_status():
    s3 = boto3.client("s3", **_aws_kwargs())
    now = datetime.now()

    all_eonet: list[dict] = []
    eonet_events: list[dict] = []
    last_collected = None
    try:
        resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="raw/occurrences/", MaxKeys=10)
        objects = sorted(resp.get("Contents", []), key=lambda o: o["LastModified"], reverse=True)
        if objects:
            latest = objects[0]
            last_collected = latest["LastModified"].isoformat()
            obj = s3.get_object(Bucket=S3_BUCKET, Key=latest["Key"])
            data = json.loads(obj["Body"].read())
            all_eonet = data.get("eonet_events", [])

            for ev in all_eonet:
                lat, lon = ev.get("lat"), ev.get("lon")
                if lat is not None and lon is not None and _in_sp_bbox(lat, lon):
                    ev["distance_km"] = round(haversine_km(SP_CENTER_LAT, SP_CENTER_LON, lat, lon), 1)
                    eonet_events.append(ev)
            eonet_events = sorted(eonet_events, key=lambda e: e.get("distance_km", 999))[:20]
    except Exception as e:
        log.warning("S3/EONET unavailable: %s", e)

    eonet_categories = dict(Counter(ev.get("category", "unknown") for ev in eonet_events))

    return {
        "eonet": {
            "total_events_in_sp": len(eonet_events),
            "total_collected": len(all_eonet),
            "categories": eonet_categories,
            "events": eonet_events,
            "last_collected": last_collected,
            "region_radius_km": SP_RADIUS_KM,
            "note": "Eventos EONET filtrados para SP no momento da coleta. Apenas categorias com impacto rodoviário: wildfires, severeStorms, floods, landslides. Os dados de nearest_eonet_distance_km e has_nearby_eonet alimentam features do modelo ML em tempo real.",
        },
        "collected_at": now.isoformat(),
    }
