import json
import os
from pathlib import Path

import boto3
from fastapi import APIRouter, HTTPException

from src.core.config import MODELS_DIR
from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/model", tags=["model"])

S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")
_FILES = ["modelo_rf.pkl", "encoders.pkl", "model_metadata.json"]


def _sync_from_s3():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    kwargs = {"region_name": os.environ.get("AWS_REGION", "us-east-1")}
    if os.environ.get("AWS_ENDPOINT_URL"):
        kwargs["endpoint_url"] = os.environ["AWS_ENDPOINT_URL"]
    s3 = boto3.client("s3", **kwargs)

    # Sempre baixa o metadata (1.6KB) pra checar versão
    meta_tmp = MODELS_DIR / "model_metadata.json.tmp"
    try:
        s3.download_file(Bucket=S3_BUCKET, Key="models/model_metadata.json", Filename=str(meta_tmp))
        with open(meta_tmp) as f:
            s3_meta = json.load(f)
        s3_date = s3_meta.get("training_date", "")

        local_meta = MODELS_DIR / "model_metadata.json"
        local_date = ""
        if local_meta.exists():
            with open(local_meta) as f:
                local_date = json.load(f).get("training_date", "")

        if s3_date != local_date:
            log.info("Nova versão do modelo detectada S3=%s local=%s", s3_date, local_date)
            for fname in _FILES:
                dest = MODELS_DIR / fname
                try:
                    s3.download_file(Bucket=S3_BUCKET, Key=f"models/{fname}", Filename=str(dest))
                    log.info("Baixado: s3://%s/models/%s", S3_BUCKET, fname)
                except Exception as e:
                    log.warning("Falha ao baixar %s: %s", fname, e)
        else:
            # Mesma versão, só troca o metadata
            meta_tmp.rename(local_meta)
        meta_tmp.unlink(missing_ok=True)
    except Exception as e:
        log.warning("S3 indisponível, usando cache local: %s", e)
        meta_tmp.unlink(missing_ok=True)


@router.get("/metadata")
async def model_metadata():
    _sync_from_s3()
    meta_path = MODELS_DIR / "model_metadata.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Nenhum modelo treinado encontrado")
    with open(meta_path, encoding="utf-8") as f:
        raw = json.load(f)

    feat_imp = raw.get("feature_importance", {})
    features = raw.get("features", [])
    feature_importances = [feat_imp.get(f, 0) for f in features]

    return {
        "model_type": raw.get("model_name", "RandomForestClassifier"),
        "version": raw.get("version", "1.0.0"),
        "trained_at": raw.get("training_date", ""),
        "accuracy": raw.get("accuracy", 0),
        "f1_score": raw.get("f1_score", 0),
        "n_train": raw.get("n_train", 0),
        "n_test": raw.get("n_test", 0),
        "features": features,
        "feature_importances": feature_importances,
    }
