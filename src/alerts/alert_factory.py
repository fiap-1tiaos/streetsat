import uuid
from dataclasses import dataclass, field
from datetime import datetime

from src.core.constants import RISK_LABELS
from src.utils.logger import get_logger

log = get_logger(__name__)

_sent_cache: dict[str, datetime] = {}
DEDUP_MINUTES = 30


@dataclass
class Alert:
    alert_id: str
    br: int
    km: float
    municipio: str
    risk_score: int
    risk_label: str
    message: str
    occurrence_id: str
    created_at: datetime = field(default_factory=datetime.now)


def create_alert(occurrence: dict, risk_score: int) -> Alert | None:
    occ_id = occurrence.get("occurrence_id", "unknown")

    if occ_id in _sent_cache:
        elapsed = (datetime.now() - _sent_cache[occ_id]).total_seconds() / 60
        if elapsed < DEDUP_MINUTES:
            log.debug("Alerta deduplicado para %s (enviado há %.1f min)", occ_id, elapsed)
            return None

    label = RISK_LABELS.get(risk_score, "")
    narrative = occurrence.get("narrative", "")[:100]
    occ_type = occurrence.get("occurrence_type", "ocorrência")
    road = occurrence.get("road", "")
    municipio = occurrence.get("municipio", "")
    km = float(occurrence.get("km", 0))

    message = (
        f"ALERTA STREETSAT | {road} KM {km:.1f} ({municipio}) "
        f"| Risco {label.upper()} | {occ_type}"
    )
    if narrative:
        message += f" | {narrative}"

    alert = Alert(
        alert_id=str(uuid.uuid4()),
        br=int("".join(filter(str.isdigit, road)) or "0"),
        km=km,
        municipio=municipio,
        risk_score=risk_score,
        risk_label=label,
        message=message,
        occurrence_id=occ_id,
    )

    _sent_cache[occ_id] = datetime.now()
    log.info("Alerta criado: %s [%s]", occ_id, label)
    return alert
