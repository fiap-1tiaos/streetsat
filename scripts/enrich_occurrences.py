import argparse
import csv
import json
import re
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils.logger import get_logger

log = get_logger("enrich")

COORDS_PATTERN = re.compile(r"/maps/place/(-?\d+\.\d+),(-?\d+\.\d+)")
CSV_PATH = Path("data/ccm-artesp/ccm-artesp.csv")
OUT_PATH = Path("data/ccm-artesp/ocorrencias_enriquecidas.csv")
PROGRESS_PATH = Path("data/ccm-artesp/.enrich_progress.json")
BASE_URL = "https://ccm.artesp.sp.gov.br"
DELAY = 0.5


def extract_coordinates(html: str) -> tuple[float | None, float | None]:
    m = COORDS_PATTERN.search(html)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None


def extract_narrative(html: str) -> str:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")
    for selector in ("narrativa", "descricao", "detail", "detalhe"):
        el = soup.find("div", class_=re.compile(selector, re.I))
        if el:
            return el.get_text(separator=" ", strip=True)
    paragraphs = soup.find_all("p")
    if paragraphs:
        return " ".join(p.get_text(strip=True) for p in paragraphs[:3])
    return ""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Máximo de ocorrências para processar")
    parser.add_argument("--resume", action="store_true", help="Continuar de onde parou")
    args = parser.parse_args()

    if not CSV_PATH.exists():
        log.error("CSV não encontrado: %s", CSV_PATH)
        sys.exit(1)

    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        rows = list(reader)

    log.info("CSV carregado: %d linhas", len(rows))

    progress: dict = {"processed": []}
    if args.resume and PROGRESS_PATH.exists():
        with open(PROGRESS_PATH) as f:
            progress = json.load(f)
        log.info("Progresso carregado: %d já processados", len(progress.get("processed", [])))

    processed_ids = set(progress.get("processed", []))
    session = requests.Session()
    enriched = []

    for i, row in enumerate(rows):
        if args.limit and i >= args.limit:
            break

        codigo = row.get("CÓDIGO", "").strip()
        if not codigo or codigo in processed_ids:
            continue

        url = f"{BASE_URL}/oc{codigo}"
        try:
            resp = session.get(url, timeout=10)
            if resp.status_code != 200:
                log.warning("HTTP %d para %s", resp.status_code, url)
                continue
        except Exception as e:
            log.warning("Erro ao acessar %s: %s", url, e)
            continue

        html = resp.text
        lat, lng = extract_coordinates(html)
        narrative = extract_narrative(html)

        if lat is not None:
            row["LATITUDE"] = str(lat)
            row["LONGITUDE"] = str(lng)
        if narrative:
            row["OBS."] = narrative

        enriched.append(row)
        processed_ids.add(codigo)

        if (i + 1) % 100 == 0:
            log.info("Processadas %d/%d ocorrências", i + 1, len(rows))
            with open(PROGRESS_PATH, "w") as f:
                json.dump({"processed": list(processed_ids)}, f)

        time.sleep(DELAY)

    if enriched:
        fieldnames = list(rows[0].keys()) if rows else []
        with open(OUT_PATH, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";")
            writer.writeheader()
            writer.writerows(enriched)
        log.info("CSV enriquecido salvo: %s (%d linhas)", OUT_PATH, len(enriched))

        PROGRESS_PATH.unlink(missing_ok=True)
    else:
        log.info("Nenhuma ocorrência nova para processar.")


if __name__ == "__main__":
    main()
