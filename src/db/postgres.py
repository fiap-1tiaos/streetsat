from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float, Integer,
    JSON, String, Text, UniqueConstraint, create_engine, text,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from src.core.config import DATABASE_URL, DATABASE_POOL_SIZE
from src.utils.logger import get_logger

log = get_logger(__name__)

_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        try:
            _engine = create_engine(
                DATABASE_URL,
                pool_size=DATABASE_POOL_SIZE,
                pool_pre_ping=True,
                echo=False,
            )
            log.info("Engine PostgreSQL criada: %s", DATABASE_URL.split("@")[-1])
        except Exception as e:
            log.warning("PostgreSQL indisponível (%s) — usando modo offline", e)
            _engine = None
    return _engine


def get_session() -> Session | None:
    global _SessionLocal
    engine = get_engine()
    if engine is None:
        return None
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=engine)
    return _SessionLocal()


class Base(DeclarativeBase):
    pass


class OccurrenceModel(Base):
    __tablename__ = "occurrences_realtime"

    occurrence_id = Column(String(20), primary_key=True)
    road = Column(String(20))
    km = Column(Float)
    municipio = Column(String(100))
    occurrence_type = Column(String(50))
    interdiction_level = Column(Integer, default=0)
    criticality = Column(Integer, default=1)
    narrative = Column(Text)
    status = Column(String(20), default="ativa")
    detected_at = Column(DateTime, default=datetime.now)
    latitude = Column(Float)
    longitude = Column(Float)
    nlp_entities = Column(JSON)
    nlp_sentiment = Column(String(20))
    risk_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)


class PredictionModel(Base):
    __tablename__ = "predictions_cache"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    br_number = Column(Integer)
    km = Column(Float)
    predicted_risk_score = Column(Integer)
    confidence = Column(Float)
    model_version = Column(String(20))
    created_at = Column(DateTime, default=datetime.now)


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    alert_id = Column(String(50), unique=True)
    occurrence_id = Column(String(20))
    br = Column(Integer)
    km = Column(Float)
    municipio = Column(String(100))
    risk_score = Column(Integer)
    message = Column(Text)
    sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)


def create_tables():
    engine = get_engine()
    if engine:
        Base.metadata.create_all(engine)
        log.info("Tabelas criadas/verificadas no PostgreSQL")


def upsert_occurrence(session: Session, data: dict) -> None:
    existing = session.get(OccurrenceModel, data.get("occurrence_id", ""))
    if existing:
        for k, v in data.items():
            if hasattr(existing, k):
                setattr(existing, k, v)
    else:
        obj = OccurrenceModel(**{k: v for k, v in data.items() if hasattr(OccurrenceModel, k)})
        session.add(obj)
    session.commit()
