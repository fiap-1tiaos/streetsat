"""Coleta ARTESP + NASA e salva JSON local. Uso: python scripts/collect_realtime.py"""
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.apis.nasa_eonet import NASAEONETClient
from src.apis.nasa_power import NASAPowerClient
from src.core.config import DATA_DIR
from src.scrapers.artesp_scraper import ARTESPScraper
from src.utils.logger import get_logger

log = get_logger("collect")


def main():
    log.info("=== Streetsat: Coleta em Tempo Real ===")
    t0 = datetime.now()

    occurrences = []
    try:
        scraper = ARTESPScraper()
        occurrences = scraper.scrape_all_pages()
        log.info("ARTESP: %d ocorrências", len(occurrences))
    except Exception as e:
        log.error("ARTESP falhou: %s", e)

    eonet_events = []
    try:
        eonet = NASAEONETClient()
        eonet_events = eonet.get_active_events()
        log.info("EONET: %d eventos naturais ativos", len(eonet_events))
    except Exception as e:
        log.error("EONET falhou: %s", e)

    payload = {
        "collected_at": t0.isoformat(),
        "occurrences": occurrences,
        "eonet_events": eonet_events,
        "duration_seconds": round((datetime.now() - t0).total_seconds(), 1),
    }

    out_dir = DATA_DIR / "raw" / "realtime"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{t0.strftime('%Y%m%d_%H%M%S')}.json"
    out_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2, default=str))

    log.info("Salvo em %s", out_file)
    log.info("Total: %d ocorrências | %d eventos | %.1fs",
             len(occurrences), len(eonet_events), payload["duration_seconds"])


if __name__ == "__main__":
    main()
