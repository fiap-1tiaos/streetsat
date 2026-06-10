import json
import re
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup


def _br_date_to_iso(br_date: str) -> str:
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})\s+(\d{2}:\d{2})", br_date)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}T{m.group(4)}:00"
    return br_date

from src.scrapers.base_scraper import BaseScraper
from src.utils.logger import get_logger

log = get_logger(__name__)

INTERDICTION_MAP = {
    "livre": 0,
    "bloqueio parcial": 1,
    "bloqueio total": 2,
}

CRITICALITY_LABEL_MAP = {
    "leve": 1,
    "moderada": 2,
    "alta": 3,
}


class ARTESPScraper(BaseScraper):
    BASE_URL = "https://ccm.artesp.sp.gov.br"

    def scrape(self) -> list[dict]:
        return self.scrape_all_pages()

    def scrape_occurrences(self, page: int = 1) -> tuple[list[dict], int]:
        try:
            resp = self._get("/rodovias/ocorrencias", params={"page": page})
        except Exception as e:
            log.error("Erro ao coletar página %d: %s", page, e)
            return [], 1

        soup = BeautifulSoup(resp.text, "html.parser")
        total_pages = self._detect_total_pages(soup)
        rows = self._parse_occurrences_table(soup)
        log.info("Página %d/%d: %d ocorrências", page, total_pages, len(rows))
        return rows, total_pages

    def scrape_occurrence_detail(self, occurrence_id: str) -> dict:
        detail: dict = {}
        try:
            resp = self._get(f"/rodovias/{occurrence_id.lower()}")
            soup = BeautifulSoup(resp.text, "html.parser")
            detail = self._parse_detail_page(soup)
        except Exception as e:
            log.warning("Detalhe %s falhou: %s", occurrence_id, e)
        return detail

    def scrape_occurrence_coordinates(self, occurrence_id: str) -> dict:
        coords: dict = {"latitude": None, "longitude": None}
        try:
            numeric_id = occurrence_id.lower().replace("oc", "")
            resp = self._get(f"/rodovias/mapa", params={"ocid": numeric_id})
            soup = BeautifulSoup(resp.text, "html.parser")
            for script in soup.find_all("script"):
                if script.string and "ocs_json" in script.string:
                    match = re.search(r"const ocs_json = '(.+?)';", script.string)
                    if match:
                        data = json.loads(match.group(1))
                        target_id = int(numeric_id)
                        for item in data:
                            if item.get("id") == target_id:
                                lat_str = item.get("lat", "")
                                lng_str = item.get("lng", "")
                                if lat_str and lng_str:
                                    try:
                                        coords["latitude"] = round(float(lat_str), 7)
                                        coords["longitude"] = round(float(lng_str), 7)
                                    except (ValueError, TypeError):
                                        log.warning(
                                            "Coordenadas inválidas para %s: lat=%s lng=%s",
                                            occurrence_id, lat_str, lng_str,
                                        )
                                break
        except Exception as e:
            log.warning("Coordenadas %s falhou: %s", occurrence_id, e)
        return coords

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

        # Enriquecer com dados de detalhes e coordenadas e re-normalizar
        enriched = []
        for occ in all_occurrences:
            oid = occ.get("occurrence_id", "")
            if oid:
                detail = self.scrape_occurrence_detail(oid)
                occ.update(detail)
                coords = self.scrape_occurrence_coordinates(oid)
                occ.update(coords)
            enriched.append(self._normalize_occurrence(occ))

        log.info("Total enriquecido: %d ocorrências", len(enriched))
        return enriched

    def scrape_travel_times(self) -> list[dict]:
        try:
            resp = self._get("/rodovias/tempos-percurso")
            soup = BeautifulSoup(resp.text, "html.parser")
            return self._parse_generic_table(soup, ["trecho", "tempo_real_min", "tempo_livre_min", "variacao_pct"])
        except Exception as e:
            log.error("Erro tempos-percurso: %s", e)
            return []

    def scrape_interventions(self) -> list[dict]:
        try:
            resp = self._get("/rodovias/intervencoes-viarias")
            soup = BeautifulSoup(resp.text, "html.parser")
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
            cells_td = tr.find_all("td")
            if not cells_td:
                continue

            detail_link = tr.find("a", href=re.compile(r"/rodovias/oc\d+", re.I))
            occurrence_id = ""
            if detail_link:
                m = re.search(r"(oc\d+)", detail_link["href"], re.I)
                if m:
                    occurrence_id = m.group(1).upper()

            row: dict = {"occurrence_id": occurrence_id, "scraped_at": datetime.now().isoformat()}

            for i, td in enumerate(cells_td):
                if i >= len(headers):
                    continue
                col_name = headers[i]

                if col_name == "tipo":
                    row["occurrence_types"] = self._parse_type_cell(td)
                elif col_name == "status":
                    parsed = self._parse_status_cell(td)
                    row.update(parsed)
                elif col_name == "vítimas":
                    row["victims"] = self._parse_victims_cell(td)
                    row["victims_total"] = sum(row["victims"].values())
                elif col_name == "interdição":
                    row["interdiction_raw"] = td.get_text(strip=True)
                elif col_name == "localização":
                    parsed = self._parse_location_cell(td)
                    row.update(parsed)
                elif col_name == "concessionária":
                    row["concessionaire_listing"] = td.get_text(strip=True)
                elif col_name == "atualização":
                    row["update_timestamp"] = td.get_text(strip=True)
                elif col_name == "código/data":
                    parsed = self._parse_code_date_cell(td)
                    row.update(parsed)
                elif col_name:
                    row[col_name] = td.get_text(strip=True)

            row = self._normalize_occurrence(row)
            results.append(row)
        return results

    def _parse_type_cell(self, td: BeautifulSoup) -> list[str]:
        types = []
        divs = td.find_all("div")
        for div in divs:
            txt = div.get_text(strip=True)
            if txt:
                types.append(txt)
        return types if types else [td.get_text(strip=True)]

    def _parse_status_cell(self, td: BeautifulSoup) -> dict:
        result: dict = {"status": td.get_text(strip=True), "status_timestamp": None}
        # The status badge is a span
        status_span = td.find("span")
        if status_span:
            result["status"] = status_span.get_text(strip=True)
        # The timestamp is in a separate div with text-xs text-gray-400
        ts_div = td.find("div", class_=re.compile(r"text-xs.*text-gray"))
        if ts_div:
            result["status_timestamp"] = ts_div.get_text(strip=True)
        # If status text contains both (fallback), try to split
        if not ts_div:
            full = td.get_text(strip=True)
            m = re.match(r"(Finalizada|Ativa)\s*(\d{2}/\d{2}\s+\d{2}:\d{2})?", full)
            if m:
                result["status"] = m.group(1)
                result["status_timestamp"] = m.group(2) if m.group(2) else result["status_timestamp"]
        return result

    def _parse_victims_cell(self, td: BeautifulSoup) -> dict:
        victims: dict = {}
        # Parse <br/>-separated lines: "Categoria: N"
        html = str(td)
        parts = re.split(r"<br\s*/?>", html, flags=re.IGNORECASE)
        for part in parts:
            clean = re.sub(r"<[^>]+>", "", part).strip()
            if not clean:
                continue
            m = re.match(r"([A-Za-zÀ-ÿ\s]+):\s*(\d+)", clean)
            if m:
                category = m.group(1).strip().lower()
                try:
                    victims[category] = int(m.group(2))
                except ValueError:
                    victims[category] = 0
        return victims

    def _parse_location_cell(self, td: BeautifulSoup) -> dict:
        result: dict = {}
        # Location has road name + km (possibly also city)
        divs = td.find_all("div")
        texts = [d.get_text(strip=True) for d in divs if d.get_text(strip=True)]
        if len(texts) >= 1:
            result["road"] = texts[0]
        if len(texts) >= 2:
            km_str = texts[1].replace("KM", "").replace("km", "").strip()
            try:
                result["km"] = float(km_str.replace(",", "."))
            except (ValueError, TypeError):
                result["km"] = None
        return result

    def _parse_code_date_cell(self, td: BeautifulSoup) -> dict:
        result: dict = {}
        # Check all text elements (spans, divs) for date or MITS
        all_texts = [t.get_text(strip=True) for t in td.find_all(["span", "div"])]
        for txt in all_texts:
            if re.match(r"\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}", txt):
                result["detected_at"] = _br_date_to_iso(txt)
            elif "MITS" in txt:
                m = re.search(r"MITS:\s*(\d+)", txt, re.IGNORECASE)
                if m:
                    result["mits_id"] = int(m.group(1))
        # Also check the text content of <a> or <td> itself
        full = td.get_text(strip=True)
        m = re.search(r"(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})", full)
        if m and "detected_at" not in result:
            result["detected_at"] = _br_date_to_iso(m.group(1))
        return result

    def _parse_detail_page(self, soup: BeautifulSoup) -> dict:
        detail: dict = {}

        # --- Informações Gerais grid ---
        info_grid = soup.find("div", class_="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6")
        if info_grid:
            items = info_grid.find_all("div", recursive=False)
            for item in items:
                label_el = item.find("span", class_=re.compile(r"text-xs.*uppercase"))
                value_el = item.find("span", class_="font-medium")
                if label_el and value_el:
                    label = label_el.get_text(strip=True).lower().replace(" ", "_")
                    value = value_el.get_text(strip=True)
                    if label == "criticidade":
                        base = value.split("(")[0].strip()
                        detail["criticality_label"] = base
                        detail["criticality"] = CRITICALITY_LABEL_MAP.get(base.lower(), 1)
                    elif label == "concessionária":
                        detail["concessionaire"] = value
                    elif label == "sentido":
                        detail["direction"] = value
                    elif label == "pista":
                        detail["roadway"] = value
                    elif label == "faixas_no_local":
                        detail["lanes"] = value
                    elif label == "condição_climática":
                        detail["weather_condition"] = value
                    elif label == "sinalização":
                        detail["signaling"] = value

        # --- Header area: occurrence ID, status, type, road, km, city ---
        header = soup.find("div", class_="bg-gray-50 border-b border-gray-100 p-6")
        if header:
            # Extract road/km/city from the specific flex-wrap div with text-gray-600
            info_div = header.find("div", class_="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1")
            if info_div:
                for span in info_div.find_all("span"):
                    txt = span.get_text(strip=True)
                    if txt.startswith("Rodovia:"):
                        detail["road"] = txt.replace("Rodovia:", "").strip()
                    elif txt.startswith("KM:") or txt.startswith("Km:"):
                        km_str = txt.split(":")[1].strip()
                        try:
                            detail["km"] = float(km_str.replace(",", "."))
                        except (ValueError, TypeError):
                            detail["km"] = None
                    elif txt.startswith("Município:"):
                        city_state = txt.replace("Município:", "").strip()
                        detail["city"], detail["state"] = self._parse_city_state(city_state)
                        detail["municipio"] = city_state

            # Also get the header status and type
            header_spans = header.find_all("span")
            for span in header_spans:
                txt = span.get_text(strip=True)
                cls = span.get("class", [])
                if "bg-green" in str(cls) or "bg-gray" in str(cls) or "bg-red" in str(cls) or "bg-yellow" in str(cls):
                    if txt in ("Ativa", "Finalizada"):
                        detail["status_detail"] = txt
                # date/time in header
                if re.match(r"\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}", txt):
                    detail["detected_at_detail"] = _br_date_to_iso(txt)
                # subtype after dash
                if txt.startswith("- "):
                    detail["occurrence_subtype"] = txt[2:]

        # --- H1 for occurrence type ---
        h1 = soup.find("h1")
        if h1:
            h1_text = h1.get_text(strip=True)
            if " - " in h1_text or "—" in h1_text:
                parts = re.split(r"\s*[—\-]\s*", h1_text)
                if len(parts) >= 2:
                    detail["occurrence_type_h1"] = parts[0].strip()
                    detail["occurrence_subtype_h1"] = parts[1].strip()

        # --- Narrative / Dynamics ---
        bg_section = soup.find("div", class_="bg-gray-50/50")
        if bg_section:
            for p in bg_section.find_all(["p", "div"]):
                txt = p.get_text(strip=True)
                if len(txt) > 50 and "Dinâmica" not in txt and "Complemento" not in txt and txt != bg_section.get_text(strip=True):
                    detail["narrative"] = txt
                    break

        # Fallback: look for divs with "Dinâmica" content
        if "narrative" not in detail:
            for div in soup.find_all("div", class_=True):
                txt = div.get_text(strip=True)
                if len(txt) > 80 and ("dinâmica" in txt[:30].lower() or "conforme alegação" in txt[:50].lower()):
                    # extract the narrative, removing "Dinâmica" prefix
                    clean = re.sub(r"^.*?Dinâmica\s*", "", txt, flags=re.IGNORECASE)
                    if len(clean) > 30:
                        detail["narrative"] = clean
                        break

        return detail

    def _parse_city_state(self, raw: str) -> tuple[Optional[str], Optional[str]]:
        if not raw:
            return None, None
        m = re.match(r"(.+?)\s*-\s*([A-Z]{2})$", raw.strip())
        if m:
            return m.group(1).strip(), m.group(2)
        # fallback: return full string as city
        return raw.strip(), None

    VICTIMS_MAP = {
        "ilesa": "ilesos", "ilesos": "ilesos", "ileso": "ilesos",
        "ferida leve": "feridos_leves", "ferido leve": "feridos_leves",
        "feridos_leves": "feridos_leves", "leve": "feridos_leves",
        "ferida grave": "feridos_graves", "ferido grave": "feridos_graves",
        "feridos_graves": "feridos_graves", "grave": "feridos_graves",
        "ferida moderada": "feridos_graves",
        "morta": "mortos", "morto": "mortos", "mortos": "mortos", "fatal": "mortos",
        "em averiguação": "em_averiguacao", "em_averiguacao": "em_averiguacao",
        "evadiu-se": "evadiu_se", "evadiu": "evadiu_se",
        "ignorado": "ignorado", "ignore": "ignorado",
    }

    @staticmethod
    def _normalize_victims(raw: dict) -> dict:
        result: dict[str, int] = {}
        for cat, count in raw.items():
            canonical = ARTESPScraper.VICTIMS_MAP.get(cat.strip().lower(), cat.replace(" ", "_").lower())
            result[canonical] = result.get(canonical, 0) + int(count)
        return result

    def _normalize_occurrence(self, raw: dict) -> dict:
        occurrence_id = raw.get("occurrence_id", "")

        # Road: detail (from listing location cell) takes priority, else listing
        road = raw.get("road", "") or raw.get("road_detail", "") or ""

        km = raw.get("km")
        if km is None:
            km = 0.0
        else:
            try:
                km = float(km)
            except (ValueError, TypeError):
                km = 0.0

        # Occurrence types: always use the new structured format
        occurrence_types = raw.get("occurrence_types", [])
        occurrence_type = " | ".join(occurrence_types) if occurrence_types else raw.get("occurrence_type_h1", "")
        occurrence_subtype = ""
        if len(occurrence_types) >= 2:
            occurrence_subtype = occurrence_types[1]
        elif raw.get("occurrence_subtype"):
            occurrence_subtype = raw.get("occurrence_subtype", "")
        elif raw.get("occurrence_subtype_h1"):
            occurrence_subtype = raw.get("occurrence_subtype_h1", "")

        # Criticality
        criticality = raw.get("criticality", 1)
        criticality_label = raw.get("criticality_label", "")
        if not criticality_label and criticality:
            # reverse lookup
            for label, val in CRITICALITY_LABEL_MAP.items():
                if val == criticality:
                    criticality_label = label.capitalize()
                    break

        # Status
        status = raw.get("status", "Ativa")
        status_timestamp = raw.get("status_timestamp", "")

        # Victims — normalize to canonical keys
        victims = self._normalize_victims(raw.get("victims", {}))
        victims_total = raw.get("victims_total", 0)
        if not victims_total and victims:
            victims_total = sum(v for v in victims.values())

        # Interdiction
        interdiction_raw = raw.get("interdiction_raw", "")
        interdiction = 0
        if interdiction_raw:
            for key, val in INTERDICTION_MAP.items():
                if key in interdiction_raw.lower():
                    interdiction = val
                    break

        # Concessionaire
        concessionaire = raw.get("concessionaire", "") or raw.get("concessionaire_listing", "") or ""

        # Direction
        direction = raw.get("direction", "") or raw.get("sentido", "") or ""

        # City / State
        city = raw.get("city", "")
        state = raw.get("state", "")
        municipio = raw.get("municipio", "")
        if not city and municipio:
            city, state = self._parse_city_state(municipio)

        # Narrative
        narrative = raw.get("narrative", "")

        # Coordinates
        latitude = raw.get("latitude")
        longitude = raw.get("longitude")

        # Extra detail fields preserved for ML
        detected_at = raw.get("detected_at", "") or raw.get("detected_at_detail", "") or ""
        update_timestamp = raw.get("update_timestamp", "")
        mits_id = raw.get("mits_id")
        weather_condition = raw.get("weather_condition", "")
        roadway = raw.get("roadway", "")
        lanes = raw.get("lanes", "")
        signaling = raw.get("signaling", "")
        occurrence_type_h1 = raw.get("occurrence_type_h1", "")
        occurrence_subtype_h1 = raw.get("occurrence_subtype_h1", "")

        return {
            "occurrence_id": occurrence_id,
            "road": road,
            "km": km,
            "municipio": municipio,
            "city": city,
            "state": state,
            "occurrence_type": occurrence_type,
            "occurrence_subtype": occurrence_subtype,
            "occurrence_types": occurrence_types,
            "concessionaire": concessionaire,
            "direction": direction,
            "interdiction_level": interdiction,
            "interdiction_label": interdiction_raw,
            "criticality": criticality,
            "criticality_label": criticality_label,
            "status": status,
            "status_timestamp": status_timestamp,
            "victims": victims,
            "victims_total": victims_total,
            "narrative": narrative,
            "latitude": latitude,
            "longitude": longitude,
            "detected_at": detected_at,
            "update_timestamp": update_timestamp,
            "mits_id": mits_id,
            "weather_condition": weather_condition,
            "roadway": roadway,
            "lanes": lanes,
            "signaling": signaling,
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
