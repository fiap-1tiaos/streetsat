import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

from src.core.config import MODELS_DIR, S3_BUCKET, _IS_LAMBDA
from src.core.constants import MODEL_FEATURES, RISK_LABELS
from src.core.exceptions import ModelNotFoundError
from src.data.feature_engineering import load_encoders
from src.ml.scoring import enrich_score_with_nlp, score_to_label
from src.utils.logger import get_logger

log = get_logger(__name__)

_S3_MODEL_PREFIX = "models"


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

    def load_model(self, models_dir: Path | None = None) -> None:
        models_dir = models_dir or MODELS_DIR
        model_path = models_dir / "modelo_rf.pkl"
        enc_path = models_dir / "encoders.pkl"
        meta_path = models_dir / "model_metadata.json"

        if not model_path.exists():
            if _IS_LAMBDA:
                self._download_models_from_s3(models_dir)
            if not model_path.exists():
                raise ModelNotFoundError(f"Modelo não encontrado: {model_path}")

        import joblib
        self._pipeline = joblib.load(model_path)
        log.info("Modelo carregado: %s", model_path)

        if enc_path.exists():
            self._encoders = load_encoders(enc_path)

        if meta_path.exists():
            with open(meta_path) as f:
                self._metadata = json.load(f)

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

    def predict_segment(self, br: int, km: float, context: dict) -> PredictionResult:
        now = datetime.now()
        features = {
            "hour": now.hour,
            "day_of_week": now.weekday(),
            "is_weekend": int(now.weekday() >= 5),
            "month": now.month,
            "br_number": br,
            "km_bucket": int(km // 10 * 10),
            "cause_encoded": 0,
            "type_encoded": 0,
            "weather_encoded": self._weather_encode(context.get("weather", {})),
            "day_phase_encoded": self._day_phase_encode(now.hour),
            "road_type_encoded": 0,
            "road_layout_encoded": 0,
            "land_use_encoded": 0,
            "uf_encoded": 0,
        }

        result = self.predict(features)

        occurrences = context.get("occurrences", [])
        enriched_score = enrich_score_with_nlp(result.score, occurrences)
        result.score = enriched_score
        result.risk_label = score_to_label(enriched_score)

        return result

    def _weather_encode(self, weather: dict) -> int:
        precip = weather.get("precipitation_mm", 0)
        if precip > 20:
            return 3
        elif precip > 5:
            return 2
        elif precip > 0:
            return 1
        return 0

    def _day_phase_encode(self, hour: int) -> int:
        if 6 <= hour < 12:
            return 0
        elif 12 <= hour < 18:
            return 1
        elif 18 <= hour < 22:
            return 2
        return 3


    def _download_models_from_s3(self, dest_dir: Path) -> None:
        import boto3
        from src.core.config import AWS_ENDPOINT_URL, AWS_REGION

        dest_dir.mkdir(parents=True, exist_ok=True)
        kwargs = {"region_name": AWS_REGION}
        if AWS_ENDPOINT_URL:
            kwargs["endpoint_url"] = AWS_ENDPOINT_URL

        s3 = boto3.client("s3", **kwargs)
        files = ["modelo_rf.pkl", "encoders.pkl", "model_metadata.json"]
        for fname in files:
            key = f"{_S3_MODEL_PREFIX}/{fname}"
            dest = dest_dir / fname
            try:
                log.info("Baixando modelo do S3: s3://%s/%s → %s", S3_BUCKET, key, dest)
                s3.download_file(S3_BUCKET, key, str(dest))
                log.info("Download concluído: %s", fname)
            except Exception as e:
                log.warning("Não foi possível baixar %s do S3: %s", fname, e)


_predictor: RiskPredictor | None = None


def get_predictor() -> RiskPredictor:
    global _predictor
    if _predictor is None:
        _predictor = RiskPredictor()
        try:
            _predictor.load_model()
        except ModelNotFoundError:
            log.warning("Modelo não encontrado — preditor em modo stub (score=0)")
    return _predictor
