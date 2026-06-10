from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float, Integer,
    JSON, String, Text, create_engine, text, Index,
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
    road = Column(String(30), index=True)
    km = Column(Float)
    municipio = Column(String(100))
    city = Column(String(100))
    state = Column(String(10))
    occurrence_type = Column(String(80))
    occurrence_subtype = Column(String(80), default="")
    occurrence_types = Column(JSON)  # JSONB: ["Acidente", "Tombamento"]
    concessionaire = Column(String(100))
    direction = Column(String(20))
    interdiction_level = Column(Integer, default=0)
    interdiction_label = Column(String(100), default="")
    criticality = Column(Integer, default=1)
    criticality_label = Column(String(20), default="")
    victims = Column(JSON)  # JSONB: {"fatal": 0, "grave": 1, "leve": 2, ...}
    victims_total = Column(Integer, default=0)
    narrative = Column(Text)
    status = Column(String(50), default="Ativa")
    status_timestamp = Column(String(20), default="")
    detected_at = Column(DateTime, default=datetime.now)
    update_timestamp = Column(String(20), default="")
    mits_id = Column(Integer, nullable=True)
    weather_condition = Column(String(100), default="")
    roadway = Column(String(50), default="")
    lanes = Column(String(50), default="")
    signaling = Column(String(100), default="")
    latitude = Column(Float)
    longitude = Column(Float)
    nlp_entities = Column(JSON)
    nlp_sentiment = Column(String(20))
    risk_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_occurrences_risk_score", "risk_score"),
        Index("idx_occurrences_road", "road"),
        Index("idx_occurrences_criticality", "criticality"),
        Index("idx_occurrences_city", "city"),
        Index("idx_occurrences_detected_at", "detected_at"),
    )


class PredictionModel(Base):
    __tablename__ = "predictions_cache"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    road = Column(String(30))
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
    road = Column(String(30))
    km = Column(Float)
    municipio = Column(String(100))
    risk_score = Column(Integer)
    message = Column(Text)
    sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)


class HeatmapData(Base):
    __tablename__ = "heatmap_data"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    day_of_week = Column(Integer, nullable=False)
    hour = Column(Integer, nullable=False)
    count = Column(Integer, default=0)
    avg_risk = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        Index("idx_heatmap_day_hour", "day_of_week", "hour", unique=True),
    )


def create_tables():
    """
    Cria/verifica a existência das tabelas no PostgreSQL.

    Nota técnica:
    Esta função é segura para chamadas repetidas pois 'create_all' verifica
    internamente se cada tabela já existe antes de criá-la. O overhead em
    cold starts é mínimo (~50ms) comparado ao tempo total de scraping.

    Em produção, o ideal é usar migrations (Alembic) para gerenciar o schema.
    A decisão de manter create_tables() aqui foi tomada por:
    1. Simplicidade operacional em ambiente serverless
    2. Compatibilidade com deploys automatizados
    3. Ausência de migrations formais no estágio atual do projeto

    Para ambientes com concorrência elevada, recomenda-se:
    - Extrair create_tables() para um script de setup separado
    - Executar apenas uma vez no deploy via container init
    - Usar IF NOT EXISTS nas statements SQL
    """
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


def batch_upsert_occurrences(session: Session, occurrences: list[dict]) -> int:
    count = 0
    for data in occurrences:
        try:
            upsert_occurrence(session, data)
            count += 1
        except Exception as e:
            log.warning("Erro ao upsert occurrence %s: %s", data.get("occurrence_id", "?"), e)
            session.rollback()
    return count


RISK_LABEL_MAP = ["Livre", "Atenção", "Alto", "Crítico"]


def _risk_label(score: int | None) -> str:
    s = score or 0
    return RISK_LABEL_MAP[s] if 0 <= s <= 3 else "Livre"


def _occurrence_to_dict(r: OccurrenceModel) -> dict:
    score = r.risk_score or 0
    return {
        "occurrence_id": r.occurrence_id,
        "road": r.road,
        "km": r.km,
        "municipio": r.municipio,
        "city": r.city,
        "state": r.state,
        "occurrence_type": r.occurrence_type,
        "occurrence_subtype": r.occurrence_subtype,
        "occurrence_types": r.occurrence_types or [],
        "concessionaire": r.concessionaire,
        "direction": r.direction,
        "interdiction_level": r.interdiction_level or 0,
        "interdiction_label": r.interdiction_label or "",
        "criticality": r.criticality or 1,
        "criticality_label": r.criticality_label or "",
        "victims": r.victims or {},
        "victims_total": r.victims_total or 0,
        "risk_score": score,
        "risk_label": _risk_label(score),
        "narrative": r.narrative or "",
        "status": r.status or "Ativa",
        "status_timestamp": r.status_timestamp or "",
        "latitude": r.latitude,
        "longitude": r.longitude,
        "detected_at": r.detected_at.isoformat() if r.detected_at else "",
        "scraped_at": r.created_at.isoformat() if r.created_at else "",
        "nlp_sentiment": r.nlp_sentiment,
        "weather_condition": r.weather_condition or "",
        "roadway": r.roadway or "",
        "lanes": r.lanes or "",
        "signaling": r.signaling or "",
        "update_timestamp": r.update_timestamp or "",
    }


def query_occurrences(
    session: Session,
    road: Optional[str] = None,
    min_risk_score: int = 0,
    limit: int = 50,
) -> list[dict]:
    q = session.query(OccurrenceModel)
    if road:
        q = q.filter(OccurrenceModel.road.ilike(f"%{road}%"))
    if min_risk_score > 0:
        q = q.filter(OccurrenceModel.risk_score >= min_risk_score)
    q = q.order_by(OccurrenceModel.risk_score.desc().nullslast()).limit(limit)
    return [_occurrence_to_dict(r) for r in q]


def update_occurrence_risk(session: Session, occurrence_id: str, risk_score: int) -> None:
    occ = session.get(OccurrenceModel, occurrence_id)
    if occ:
        occ.risk_score = risk_score
        session.commit()


def query_alerts(
    session: Session,
    min_risk_score: int = 1,
    limit: int = 100,
) -> list[dict]:
    q = session.query(OccurrenceModel).filter(
        OccurrenceModel.risk_score >= min_risk_score
    )
    q = q.order_by(OccurrenceModel.risk_score.desc().nullslast(), OccurrenceModel.created_at.desc().nullslast())
    q = q.limit(limit)
    return [{
        "id": r.occurrence_id,
        "message": f"{r.occurrence_type or 'Ocorrência'} — {r.road} km {r.km}",
        "road": r.road or "",
        "municipio": r.municipio or "",
        "city": r.city or "",
        "state": r.state or "",
        "risk_score": r.risk_score or 0,
        "risk_label": _risk_label(score),
        "occurrence_type": r.occurrence_type or "",
        "occurrence_subtype": r.occurrence_subtype or "",
        "occurrence_types": r.occurrence_types or [],
        "concessionaire": r.concessionaire or "",
        "criticality": r.criticality or 1,
        "criticality_label": r.criticality_label or "",
        "victims": r.victims or {},
        "victims_total": r.victims_total or 0,
        "narrative": r.narrative or "",
        "latitude": r.latitude,
        "longitude": r.longitude,
        "detected_at": r.detected_at.isoformat() if r.detected_at else "",
        "status": "active",
    } for r in q]


DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]


def populate_heatmap(session: Session, df) -> None:
    session.query(HeatmapData).delete()
    session.commit()

    rows = []
    for d in range(7):
        for h in range(24):
            subset = df[(df["day_of_week"] == d) & (df["hour"] == h)]
            count = len(subset)
            avg_risk = 0.0
            if count > 0 and "risk_label" in subset.columns:
                avg_risk = float(subset["risk_label"].mean())
            elif count > 0:
                mortos = int(subset["mortos"].sum())
                graves = int(subset["feridos_graves"].sum())
                leves = int(subset["feridos_leves"].sum())
                if mortos > 0:
                    avg_risk = 3.0
                elif graves > 0:
                    avg_risk = 2.0
                elif leves > 0:
                    avg_risk = 1.0
            rows.append(HeatmapData(
                day_of_week=d, hour=h, count=count, avg_risk=avg_risk,
            ))

    session.add_all(rows)
    session.commit()
    log.info("Heatmap populado: %d células (%d registros)", len(rows), sum(r.count for r in rows))


def query_heatmap(session: Session) -> list[dict]:
    rows = session.query(HeatmapData).order_by(HeatmapData.day_of_week, HeatmapData.hour).all()
    if not rows:
        return []
    matrix = [[{"count": 0, "avg_risk": 0.0} for _ in range(24)] for _ in range(7)]
    for r in rows:
        matrix[r.day_of_week][r.hour] = {"count": r.count, "avg_risk": r.avg_risk}
    return [{
        "days": DAYS_OF_WEEK,
        "hours": [f"{h}h" for h in range(24)],
        "matrix": matrix,
    }]
