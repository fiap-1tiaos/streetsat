import json
import os
import re
from typing import Optional

import boto3
from fastapi import APIRouter, Query

from src.core.constants import RISK_LABELS
from src.schemas.occurrences import OccurrenceSchema
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/occurrences", tags=["occurrences"])

S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")
PROCESSED_KEY = "processed/occurrences/latest.json"


def _s3_client():
    kwargs = {"region_name": os.environ.get("AWS_REGION", "us-east-1")}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


def _load_processed() -> list[dict]:
    try:
        obj = _s3_client().get_object(Bucket=S3_BUCKET, Key=PROCESSED_KEY)
        data = json.loads(obj["Body"].read())
        return data.get("occurrences", [])
    except Exception as e:
        log.warning("processed/occurrences/latest.json indisponível: %s", e)
        return []


def _road_to_br(road: str) -> int:
    m = re.search(r"\d+", road or "")
    return int(m.group()) if m else 0


def _road_to_uf(road: str) -> str:
    m = re.match(r"^([A-Z]{2})-", road or "")
    if m and m.group(1) != "BR":
        return m.group(1)
    return "SP"  # ARTESP é concessionária paulista


def _to_frontend(occ: dict) -> dict:
    """Mapeia OccurrenceSchema para o shape esperado pelo frontend."""
    road = occ.get("road", "")
    risk_score = occ.get("risk_score", 0) or 0
    return {
        "id": occ.get("occurrence_id", ""),
        "br": _road_to_br(road),
        "km": occ.get("km", 0),
        "municipio": occ.get("municipio", ""),
        "uf": _road_to_uf(road),
        "tipo": occ.get("occurrence_type", ""),
        "interdicao": (occ.get("interdiction_level", 0) or 0) > 0,
        "risk_score": risk_score,
        "risk_label": occ.get("risk_label") or RISK_LABELS.get(risk_score, "Livre"),
        "detectado_em": occ.get("detected_at") or occ.get("scraped_at", ""),
        "lat": occ.get("latitude"),
        "lon": occ.get("longitude"),
    }


@router.get("")
async def list_occurrences(
    uf: Optional[str] = Query(None),
    road: Optional[str] = Query(None),
    min_risk_score: int = Query(default=0, ge=0, le=3),
    limit: int = Query(default=50, le=200),
):
    raw = _load_processed()
    results = [_to_frontend(o) for o in raw]

    if uf:
        results = [o for o in results if o["uf"] == uf.upper()]
    if road:
        results = [o for o in results if road.upper() in str(o["br"])]
    results = [o for o in results if o["risk_score"] >= min_risk_score]
    results = sorted(results, key=lambda x: x["risk_score"], reverse=True)

    return {"total": len(results), "items": results[:limit]}
