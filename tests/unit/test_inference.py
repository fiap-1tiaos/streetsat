import numpy as np
import pytest
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from src.core.constants import MODEL_FEATURES, RISK_LABELS
from src.ml.inference import PredictionResult, RiskPredictor


@pytest.fixture
def dummy_pipeline():
    X_dummy = np.zeros((10, len(MODEL_FEATURES)))
    y_dummy = np.zeros(10, dtype=int)
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", RandomForestClassifier(n_estimators=10, random_state=42))])
    pipe.fit(X_dummy, y_dummy)
    return pipe


class TestPredictionResult:
    def test_default_risk_label(self):
        r = PredictionResult(score=2, confidence=0.85)
        assert r.risk_label == RISK_LABELS[2]

    def test_custom_risk_label(self):
        r = PredictionResult(score=1, confidence=0.9, risk_label="Teste")
        assert r.risk_label == "Teste"


class TestRiskPredictor:
    def test_predict_returns_valid_result(self, dummy_pipeline):
        predictor = RiskPredictor()
        predictor._pipeline = dummy_pipeline
        result = predictor.predict({
            "hour": 14,
            "day_of_week": 2,
            "is_weekend": 0,
            "month": 6,
            "road_id_encoded": 0,
            "km_mid": 100,
            "class_encoded": 0,
            "subclass_encoded": 0,
            "accident_type_encoded": 0,
            "concessionaire_encoded": 0,
            "municipio_encoded": 0,
            "has_blockage": 0,
            "feridos_leves": 0,
            "feridos_graves": 0,
            "mortos": 0,
        })
        assert isinstance(result, PredictionResult)
        assert 0 <= result.score <= 3
        assert 0 <= result.confidence <= 1
        assert len(result.probabilities) > 0

    def test_predict_segment_returns_result(self, dummy_pipeline):
        predictor = RiskPredictor()
        predictor._pipeline = dummy_pipeline
        result = predictor.predict_segment(road="SP-330", km=100)
        assert isinstance(result, PredictionResult)
        assert 0 <= result.score <= 3
