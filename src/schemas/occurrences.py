from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OccurrenceSchema(BaseModel):
    occurrence_id: str
    road: str = ""
    km: float = 0.0
    municipio: str = ""
    occurrence_type: str = ""
    concessionaire: str = ""
    direction: str = ""
    interdiction_level: int = Field(default=0, ge=0, le=2)
    criticality: int = Field(default=1, ge=1, le=4)
    narrative: str = ""
    status: str = "ativa"
    detected_at: datetime = Field(default_factory=datetime.now)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nlp_sentiment: Optional[str] = None
    nlp_entities: Optional[dict] = None
    risk_score: Optional[int] = None


class WeatherData(BaseModel):
    lat: float
    lon: float
    date: str
    precipitation_mm: float = 0.0
    wind_speed_ms: float = 0.0
    temperature_c: float = 25.0
    humidity: float = 70.0


class NaturalEvent(BaseModel):
    event_id: str
    title: str
    category: str
    lat: float
    lon: float
    date: str
    distance_km: Optional[float] = None
    magnitude: Optional[float] = None
