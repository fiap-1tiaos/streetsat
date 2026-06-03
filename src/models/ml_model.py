import json
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    accuracy_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from src.core.constants import MODEL_FEATURES, RISK_LABELS
from src.utils.logger import get_logger

log = get_logger(__name__)


def train(X: pd.DataFrame, y: pd.Series, models_dir: Path) -> tuple[Pipeline, dict]:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    log.info("Treino: %d | Teste: %d", len(X_train), len(X_test))

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_leaf=5,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="f1_macro", n_jobs=-1)
    log.info("CV F1-macro: %.4f ± %.4f", cv_scores.mean(), cv_scores.std())

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")
    report = classification_report(y_test, y_pred, target_names=[RISK_LABELS[i] for i in range(4)])
    cm = confusion_matrix(y_test, y_pred).tolist()

    log.info("Acurácia: %.4f | F1-macro: %.4f", acc, f1)
    log.info("\n%s", report)

    feature_imp = dict(zip(X.columns.tolist(), pipeline.named_steps["clf"].feature_importances_.tolist()))

    metadata = {
        "model_name": "random_forest_risk_scorer",
        "version": "1.0.0",
        "training_date": datetime.now().isoformat(),
        "accuracy": round(float(acc), 4),
        "f1_score": round(float(f1), 4),
        "cv_f1_mean": round(float(cv_scores.mean()), 4),
        "cv_f1_std": round(float(cv_scores.std()), 4),
        "features": X.columns.tolist(),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "confusion_matrix": cm,
        "classification_report": report,
        "feature_importance": dict(sorted(feature_imp.items(), key=lambda x: x[1], reverse=True)[:20]),
        "hyperparameters": {
            "n_estimators": 200,
            "max_depth": 15,
            "min_samples_leaf": 5,
            "class_weight": "balanced",
        },
    }

    model_path = models_dir / "modelo_rf.pkl"
    meta_path = models_dir / "model_metadata.json"

    joblib.dump(pipeline, model_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    log.info("Modelo salvo em %s", model_path)
    return pipeline, metadata


def load_model(models_dir: Path) -> Pipeline:
    path = models_dir / "modelo_rf.pkl"
    if not path.exists():
        from src.core.exceptions import ModelNotFoundError
        raise ModelNotFoundError(f"Modelo não encontrado: {path}")
    return joblib.load(path)
