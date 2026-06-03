import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

_env_file = BASE_DIR / ".env.local"
if not _env_file.exists():
    _env_file = BASE_DIR / ".env"
load_dotenv(_env_file)

ENV = os.getenv("ENV", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://streetsat:streetsat_dev@localhost:5432/streetsat_db")
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "5"))

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_CACHE_TTL = int(os.getenv("REDIS_CACHE_TTL", "3600"))

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:admin_dev@localhost:27017/")

AWS_ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "test")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "test")
S3_BUCKET = os.getenv("S3_BUCKET", "streetsat-models-dev")
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN", "")
SQS_INFERENCE_QUEUE_URL = os.getenv("SQS_INFERENCE_QUEUE_URL", "")
SQS_ALERTS_QUEUE_URL = os.getenv("SQS_ALERTS_QUEUE_URL", "")

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
FIRMS_MAP_KEY = os.getenv("FIRMS_MAP_KEY", "")

COMPREHEND_ENABLED = os.getenv("COMPREHEND_ENABLED", "false").lower() == "true"
USE_LOCALSTACK = os.getenv("USE_LOCALSTACK", "true").lower() == "true"

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = os.getenv("LOG_FORMAT", "console")

DASH_PORT = int(os.getenv("DASH_PORT", "5000"))
DASH_HOST = os.getenv("DASH_HOST", "0.0.0.0")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

_IS_LAMBDA = Path("/var/task").exists() and not os.access("/var/task", os.W_OK)
_WRITABLE_BASE = Path("/tmp/streetsat") if _IS_LAMBDA else BASE_DIR

MODELS_DIR = _WRITABLE_BASE / "models" if _IS_LAMBDA else BASE_DIR / "models"
DATA_DIR = _WRITABLE_BASE / "data" if _IS_LAMBDA else BASE_DIR / "data"
DOCS_DIR = _WRITABLE_BASE / "docs" if _IS_LAMBDA else BASE_DIR / "docs"
PRF_DIR = DATA_DIR / "prf"

if not _IS_LAMBDA:
    MODELS_DIR.mkdir(exist_ok=True)
    PRF_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "raw" / "realtime").mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "processed").mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "eda").mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "figures").mkdir(parents=True, exist_ok=True)
