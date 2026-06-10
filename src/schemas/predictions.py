from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PredictionResult(BaseModel):
    score: int = Field(ge=0, le=3)
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: list[float] = []
    risk_label: str = ""
    model_version: str = "1.0.0"


class PredictionResponse(BaseModel):
    road: str
    km: float
    risk_score: int
    risk_label: str
    confidence: float
    active_occurrences: int = 0
    weather_condition: str = ""
    timestamp: datetime = Field(default_factory=datetime.now)


class RouteRequest(BaseModel):
    origin: dict
    destination: dict
    risk_weight: float = Field(default=0.7, ge=0.0, le=1.0)


class RouteSegment(BaseModel):
    road: str
    km_start: float
    km_end: float
    risk_score: int
    distance_km: float


class RouteResponse(BaseModel):
    nodes: list[tuple]
    total_distance_km: float
    max_risk_score: int
    avg_risk_score: float
    estimated_time_min: float
    risk_segments: list[RouteSegment] = []
    alternative_available: bool = False


class RouteComparison(BaseModel):
    direct: Optional[RouteResponse] = None
    safe: Optional[RouteResponse] = None
    km_overhead: float = 0.0
    risk_reduction: float = 0.0
