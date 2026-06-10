import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

from src.core.config import MODELS_DIR
from src.core.constants import MODEL_FEATURES, RISK_LABELS
from src.data.feature_engineering import load_encoders
from src.data.road_encoder import RoadEncoder
from src.ml.scoring import enrich_score_with_nlp, score_to_label
from src.utils.logger import get_logger

log = get_logger(__name__)


@dataclass
class PredictionResult:
    score: int
    confidence: float
    probabilities: list[float] = field(default_factory=list)
    risk_label: str = ""
    model_version: str = "1.0.0"

    def __post_init__(self):
        if not self.risk_label:
            self.risk_label = RISK_LABELS.get(self.score, "")


class RiskPredictor:
    def __init__(self):
        self._pipeline = None
        self._encoders = None
        self._metadata = {}
        self._road_encoder = None

    def load_model(self, models_dir: Path | None = None) -> None:
        models_dir = models_dir or MODELS_DIR
        model_path = models_dir / "modelo_rf.pkl"
        enc_path = models_dir / "encoders.pkl"
        meta_path = models_dir / "model_metadata.json"

        if not model_path.exists():
            raise FileNotFoundError(f"Modelo não encontrado: {model_path}")

        import joblib
        self._pipeline = joblib.load(model_path)
        log.info("Modelo carregado: %s", model_path)

        if enc_path.exists():
            self._encoders = load_encoders(enc_path)
            self._road_encoder = RoadEncoder(self._encoders)

        if meta_path.exists():
            with open(meta_path) as f:
                self._metadata = json.load(f)

    def _encode_or_default(self, encoder_key: str, value: str) -> int:
        if self._encoders is None:
            return 0
        le = self._encoders.get(encoder_key)
        if le is None:
            return 0
        known = set(le.classes_)
        if "desconhecido" not in known:
            le.classes_ = np.append(le.classes_, "desconhecido")
        clean = value if value in known else "desconhecido"
        return int(le.transform([clean])[0])

    def _features_from_occurrence(self, occurrence: dict) -> dict:
        victims = occurrence.get("victims", {}) or {}
        interdiction = occurrence.get("interdiction_level", 0)

        types_list = occurrence.get("occurrence_types", []) or []
        classe = types_list[0] if types_list else "desconhecido"

        eonet_dist = occurrence.get("nearest_eonet_distance_km", -1)
        try:
            eonet_dist = float(eonet_dist)
        except (ValueError, TypeError):
            eonet_dist = -1

        return {
            "class_encoded": self._encode_or_default("classe", classe),
            "subclass_encoded": self._encode_or_default("subclasse_ac", occurrence.get("occurrence_subtype", "")),
            "accident_type_encoded": self._encode_or_default("tipo_ac", occurrence.get("occurrence_type", "")),
            "concessionaire_encoded": self._encode_or_default("concessionaria", occurrence.get("concessionaire", "") or occurrence.get("concessionaria", "")),
            "municipio_encoded": self._encode_or_default("municipio", occurrence.get("municipio", "") or occurrence.get("city", "")),
            "has_blockage": 1 if interdiction and int(interdiction) > 0 else 0,
            "feridos_leves": int(victims.get("feridos_leves", 0)),
            "feridos_graves": int(victims.get("feridos_graves", 0)),
            "mortos": int(victims.get("mortos", 0)),
            "nearest_eonet_distance_km": eonet_dist,
            "has_nearby_eonet": 1 if eonet_dist >= 0 else 0,
        }

    def predict(self, features: dict) -> PredictionResult:
        if self._pipeline is None:
            self.load_model()

        row = {feat: features.get(feat, 0) for feat in MODEL_FEATURES}
        X = pd.DataFrame([row])

        proba = self._pipeline.predict_proba(X)[0].tolist()
        score = int(np.argmax(proba))
        confidence = float(max(proba))

        return PredictionResult(
            score=score,
            confidence=confidence,
            probabilities=proba,
            model_version=self._metadata.get("version", "1.0.0"),
        )

    def _weather_from_context(self, context: dict, lat: float | None, lon: float | None) -> dict:
        if lat is not None and lon is not None:
            try:
                from src.apis.weather import WeatherClient
                w = WeatherClient()
                return w.get_current_weather(lat, lon)
            except Exception:
                pass
        return {"temperature_c": 25, "humidity": 70, "precipitation_mm": 0, "wind_speed_ms": 0}

    def predict_segment(self, road: str, km: float, context: dict | None = None) -> PredictionResult:
        context = context or {}
        now = datetime.now()

        road_id_encoded = 0
        if self._road_encoder:
            road_id_encoded = self._road_encoder.encode(road)

        features = {
            "hour": now.hour,
            "day_of_week": now.weekday(),
            "is_weekend": int(now.weekday() >= 5),
            "month": now.month,
            "road_id_encoded": road_id_encoded,
            "km_mid": float(km),
            "class_encoded": 0,
            "subclass_encoded": 0,
            "accident_type_encoded": 0,
            "concessionaire_encoded": 0,
            "municipio_encoded": 0,
            "has_blockage": 0,
            "feridos_leves": 0,
            "feridos_graves": 0,
            "mortos": 0,
            "nearest_eonet_distance_km": -1,
            "has_nearby_eonet": 0,
            "precipitation_mm": 0,
            "wind_speed_ms": 0,
            "temperature_c": 25,
            "humidity": 70,
        }

        occurrences = context.get("occurrences", [])
        if occurrences:
            features.update(self._features_from_occurrence(occurrences[0]))

        lat = occurrences[0].get("latitude") if occurrences else None
        lon = occurrences[0].get("longitude") if occurrences else None
        weather = self._weather_from_context(context, lat, lon)
        features.update(weather)

        result = self.predict(features)

        enriched_score = enrich_score_with_nlp(result.score, occurrences)
        result.score = enriched_score
        result.risk_label = score_to_label(enriched_score)

        return result


_predictor: RiskPredictor | None = None


def get_predictor() -> RiskPredictor:
    global _predictor
    if _predictor is None:
        _predictor = RiskPredictor()
        try:
            _predictor.load_model()
        except FileNotFoundError:
            log.warning("Modelo não encontrado — preditor em modo stub (score=0)")
    return _predictor
