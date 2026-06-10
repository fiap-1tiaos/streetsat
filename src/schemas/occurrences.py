from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OccurrenceSchema(BaseModel):
    occurrence_id: str
    road: str = ""
    km: float = 0.0
    municipio: str = ""
    city: str = ""
    state: str = ""
    occurrence_type: str = ""
    occurrence_subtype: str = ""
    occurrence_types: list[str] = []
    concessionaire: str = ""
    direction: str = ""
    interdiction_level: int = Field(default=0, ge=0, le=2)
    interdiction_label: str = ""
    criticality: int = Field(default=1, ge=1, le=4)
    criticality_label: str = ""
    victims: dict[str, int] = {}
    victims_total: int = 0
    narrative: str = ""
    status: str = "Ativa"
    status_timestamp: str = ""
    detected_at: datetime = Field(default_factory=datetime.now)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nlp_sentiment: Optional[str] = None
    nlp_entities: Optional[dict] = None
    risk_score: Optional[int] = None
    risk_label: str = ""
    weather_condition: str = ""
    roadway: str = ""
    lanes: str = ""
    signaling: str = ""
    update_timestamp: str = ""


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
