import re
from datetime import datetime

from bs4 import BeautifulSoup

from src.scrapers.base_scraper import BaseScraper
from src.utils.logger import get_logger

log = get_logger(__name__)

INTERDICTION_MAP = {
    "livre": 0,
    "bloqueio parcial": 1,
    "bloqueio total": 2,
}


class ARTESPScraper(BaseScraper):
    BASE_URL = "https://ccm.artesp.sp.gov.br"

    def scrape(self) -> list[dict]:
        return self.scrape_all_pages()

    def scrape_occurrences(self, page: int = 1) -> tuple[list[dict], int]:
        try:
            resp = self._get(f"/rodovias/ocorrencias", params={"page": page})
        except Exception as e:
            log.error("Erro ao coletar página %d: %s", page, e)
            return [], 1

        soup = BeautifulSoup(resp.text, "lxml")
        total_pages = self._detect_total_pages(soup)
        rows = self._parse_occurrences_table(soup)
        log.info("Página %d/%d: %d ocorrências", page, total_pages, len(rows))
        return rows, total_pages

    def scrape_occurrence_detail(self, occurrence_id: str) -> str:
        try:
            resp = self._get(f"/rodovias/{occurrence_id.lower()}")
            soup = BeautifulSoup(resp.text, "lxml")
            narrative_el = soup.find("div", class_=re.compile(r"narrativa|descricao|detail", re.I))
            if narrative_el:
                return narrative_el.get_text(separator=" ", strip=True)
            p_tags = soup.find_all("p")
            if p_tags:
                return " ".join(p.get_text(strip=True) for p in p_tags[:3])
        except Exception as e:
            log.warning("Detalhe %s falhou: %s", occurrence_id, e)
        return ""

    def scrape_all_pages(self) -> list[dict]:
        all_occurrences: list[dict] = []
        page = 1
        while True:
            rows, total_pages = self.scrape_occurrences(page)
            all_occurrences.extend(rows)
            if page >= total_pages or not rows:
                break
            page += 1
        log.info("Total coletado: %d ocorrências", len(all_occurrences))
        return all_occurrences

    def scrape_travel_times(self) -> list[dict]:
        try:
            resp = self._get("/rodovias/tempos-percurso")
            soup = BeautifulSoup(resp.text, "lxml")
            return self._parse_generic_table(soup, ["trecho", "tempo_real_min", "tempo_livre_min", "variacao_pct"])
        except Exception as e:
            log.error("Erro tempos-percurso: %s", e)
            return []

    def scrape_interventions(self) -> list[dict]:
        try:
            resp = self._get("/rodovias/intervencoes-viarias")
            soup = BeautifulSoup(resp.text, "lxml")
            return self._parse_generic_table(soup, ["rodovia", "km_inicial", "km_final", "termino_previsto", "faixas_bloqueadas"])
        except Exception as e:
            log.error("Erro intervencoes: %s", e)
            return []

    # ── parsers ───────────────────────────────────────────────────────────────

    def _detect_total_pages(self, soup: BeautifulSoup) -> int:
        text = soup.get_text()
        m = re.search(r"[Pp][áa]gina\s+\d+\s+de\s+(\d+)", text)
        if m:
            return int(m.group(1))
        nav = soup.find("nav", attrs={"aria-label": re.compile(r"pagina", re.I)})
        if nav:
            nums = re.findall(r"\d+", nav.get_text())
            if nums:
                return max(int(n) for n in nums)
        return 1

    def _parse_occurrences_table(self, soup: BeautifulSoup) -> list[dict]:
        table = soup.find("table")
        if not table:
            return []

        headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]

        results = []
        for tr in table.find("tbody", default=table).find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if not cells:
                continue

            detail_link = tr.find("a", href=re.compile(r"/rodovias/oc\d+", re.I))
            occurrence_id = ""
            if detail_link:
                m = re.search(r"(oc\d+)", detail_link["href"], re.I)
                if m:
                    occurrence_id = m.group(1).upper()

            row: dict = {"occurrence_id": occurrence_id, "scraped_at": datetime.now().isoformat()}
            for i, h in enumerate(headers):
                if i < len(cells):
                    row[h] = cells[i]

            row = self._normalize_occurrence(row)
            results.append(row)
        return results

    def _normalize_occurrence(self, raw: dict) -> dict:
        def _get(*keys) -> str:
            for k in keys:
                for rk, rv in raw.items():
                    if k in rk:
                        return str(rv).strip()
            return ""

        road = _get("rodov", "br", "via")
        km_str = _get("km")
        km = 0.0
        m = re.search(r"[\d,\.]+", km_str)
        if m:
            km = float(m.group().replace(",", "."))

        interdiction_raw = _get("interdição", "interdicao", "bloqueio").lower()
        interdiction = 0
        for key, val in INTERDICTION_MAP.items():
            if key in interdiction_raw:
                interdiction = val
                break

        criticality_raw = _get("criticidade", "critica")
        criticality = 1
        crit_nums = re.findall(r"\d+", criticality_raw)
        if crit_nums:
            criticality = min(int(crit_nums[0]), 4)

        return {
            "occurrence_id": raw.get("occurrence_id", ""),
            "road": road,
            "km": km,
            "municipio": _get("munic"),
            "occurrence_type": _get("tipo"),
            "concessionaire": _get("concess"),
            "direction": _get("sentido"),
            "interdiction_level": interdiction,
            "criticality": criticality,
            "status": _get("status", "situação"),
            "narrative": "",
            "latitude": None,
            "longitude": None,
            "scraped_at": raw.get("scraped_at", ""),
        }

    def _parse_generic_table(self, soup: BeautifulSoup, default_cols: list[str]) -> list[dict]:
        table = soup.find("table")
        if not table:
            return []
        headers = [th.get_text(strip=True).lower().replace(" ", "_") for th in table.find_all("th")] or default_cols
        results = []
        for tr in table.find_all("tr")[1:]:
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if cells:
                results.append(dict(zip(headers, cells)))
        return results
