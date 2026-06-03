# Fase 2 — Pipeline de Coleta em Tempo Real

**Objetivo**: Construir scrapers e integrações com APIs externas para alimentar o modelo com dados atualizados de ocorrências, clima e eventos naturais.

**Estimativa**: 2–3 dias  
**Output principal**: Dados brutos em `data/raw/realtime/` e banco de dados local

---

## Contexto

Esta fase implementa o pipeline de ingestão de dados em tempo real. Os dados coletados serão usados na Fase 4 (inferência) para enriquecer as features antes da predição.

**Fontes**:
1. **ARTESP** — Ocorrências em rodovias de SP (scraping HTML)
2. **NASA POWER** — Dados climáticos históricos e atuais (API REST)
3. **NASA EONET** — Eventos naturais ativos (API REST)
4. **NASA FIRMS** — Focos de incêndio em tempo real (API REST)

---

## Tarefas

### 2.1 — Cliente HTTP Base (`src/apis/api_client.py`)
- [ ] Classe `BaseAPIClient` com:
  - `session` com `requests.Session()` + headers padrão
  - `get(url, params, timeout=30)` com retry automático (3x, backoff exponencial)
  - Cache em disco com TTL configurável (usando `requests_cache` ou implementação própria)
  - Logging estruturado de cada request (URL, status, tempo de resposta)
  - Tratamento de `HTTPError`, `ConnectionError`, `Timeout`

### 2.2 — ARTESP Scraper (`src/scrapers/artesp_scraper.py`)

**URL base**: `https://ccm.artesp.sp.gov.br`

- [ ] Classe `ARTESPScraper(BaseScraper)` com métodos:

  **`scrape_occurrences(page=1) -> list[dict]`**
  - GET `/rodovias/ocorrencias?page={page}`
  - Parsear tabela HTML com BeautifulSoup
  - Extrair por linha: código OC, tipo, concessionária, rodovia, KM, município, sentido, interdição, criticidade, status, timestamp
  - Retornar lista de dicts normalizados

  **`scrape_occurrence_detail(occurrence_id: str) -> dict`**
  - GET `/rodovias/{occurrence_id}` (ex: `oc19500`)
  - Extrair narrativa completa do detalhe
  - Retornar dict com campo `narrative`

  **`scrape_all_pages() -> list[dict]`**
  - Iterar páginas até não encontrar mais resultados
  - Detectar fim: verificar texto "Página X de Y" nos botões de paginação
  - Coletar detalhes de ocorrências críticas (criticidade ≥ 3) via `scrape_occurrence_detail`

  **`scrape_travel_times() -> list[dict]`**
  - GET `/rodovias/tempos-percurso`
  - Extrair: trecho, tempo real, tempo livre, variação %

  **`scrape_interventions() -> list[dict]`**
  - GET `/rodovias/intervencoes-viarias`
  - Extrair: rodovia, KM inicial/final, término previsto, faixas bloqueadas

- [ ] Scraper base (`src/scrapers/base_scraper.py`):
  - Rate limiting (1 req/s por padrão)
  - Headers de browser para evitar bloqueio
  - Retry com backoff em erros 429/503

### 2.3 — NASA POWER API (`src/apis/nasa_power.py`)
- [ ] Classe `NASAPowerClient(BaseAPIClient)` com:

  **`get_weather(lat, lon, date=None) -> dict`**
  - Endpoint: `https://power.larc.nasa.gov/api/temporal/daily/point`
  - Parâmetros: `parameters=PRECTOTCORR,WS2M,T2M,RH2M`, `community=RE`, `format=JSON`
  - Retornar: `{"precipitation_mm": float, "wind_speed_ms": float, "temperature_c": float, "humidity": float, "date": str}`
  - Cache por `(lat_round2, lon_round2, date)` com TTL de 12h

  **`get_weather_batch(locations: list[tuple]) -> list[dict]`**
  - Parallelizar requests com `concurrent.futures.ThreadPoolExecutor(max_workers=5)`

### 2.4 — NASA EONET API (`src/apis/nasa_eonet.py`)
- [ ] Classe `NASAEONETClient(BaseAPIClient)` com:

  **`get_active_events(category=None, limit=50) -> list[dict]`**
  - Endpoint: `https://eonet.gsfc.nasa.gov/api/v3/events`
  - Parâmetros: `status=open`, `limit=limit`
  - Filtrar por categorias relevantes: `wildfires`, `severeStorms`, `floods`
  - Normalizar: `{"event_id", "title", "category", "lat", "lon", "magnitude", "date"}`
  - Cache TTL 30 min

  **`get_nearest_event(lat, lon, radius_km=100) -> dict | None`**
  - Filtrar eventos dentro do raio via distância Haversine
  - Retornar evento mais próximo com distância em km

### 2.5 — NASA FIRMS API (`src/apis/nasa_firms.py`)
- [ ] Classe `NASAFIRMSClient(BaseAPIClient)` com:

  **`get_fire_hotspots(lat, lon, radius_km=50, days=1) -> list[dict]`**
  - Endpoint: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/MODIS_NRT/{area}/{days}`
  - Área: bounding box calculado a partir de `lat`, `lon`, `radius_km`
  - Retornar: `{"lat", "lon", "frp", "brightness", "confidence", "acq_date"}`
  - Cache TTL 3h (dados quase real-time)

  **`get_max_frp_nearby(lat, lon) -> float`**
  - Retornar FRP (Fire Radiative Power) máximo em 50km ou 0.0

### 2.6 — Orquestração de Coleta (`scripts/collect_realtime.py`)
- [ ] Script standalone que:
  1. Coleta ocorrências ARTESP (todas as páginas)
  2. Para cada ocorrência, busca dados NASA POWER no ponto (lat, lon)
  3. Busca eventos EONET ativos
  4. Busca focos FIRMS nas proximidades
  5. Salva resultado consolidado em `data/raw/realtime/YYYYMMDD_HHMMSS.json`
  6. Persiste ocorrências no banco (PostgreSQL via SQLAlchemy)

### 2.7 — Agendamento Local (APScheduler)
- [ ] `src/queue/scheduler.py`:
  - Job `collect_artesp` a cada 5 minutos
  - Job `collect_nasa` a cada 1 hora
  - Logs de execução com duração e contagem de registros
  - Usar `APScheduler` com `BackgroundScheduler`

### 2.8 — Schemas de Dados (`src/schemas/`)
- [ ] `occurrences.py`: Pydantic model `OccurrenceSchema`
  ```python
  class OccurrenceSchema(BaseModel):
      occurrence_id: str  # OC-xxxxx
      road: str
      km: float
      municipio: str
      occurrence_type: str
      interdiction_level: int  # 0=livre, 1=parcial, 2=total
      criticality: int  # 1-4
      narrative: str | None
      status: str
      detected_at: datetime
      latitude: float | None
      longitude: float | None
  ```
- [ ] `weather.py`: Pydantic model `WeatherData`
- [ ] `natural_events.py`: Pydantic model `NaturalEvent`

### 2.9 — Persistência no Banco (`src/db/postgres.py`)
- [ ] SQLAlchemy models para:
  - `OccurrenceRealtimeModel` (tabela `occurrences_realtime`)
  - `WeatherSnapshotModel` (tabela `weather_snapshots`)
- [ ] Função `upsert_occurrence(session, occurrence)` com ON CONFLICT DO UPDATE
- [ ] Conexão via `DATABASE_URL` do `.env`

### 2.10 — Testes (`tests/unit/test_scrapers.py`, `tests/fixtures/mock_artesp.py`)
- [ ] Mock HTML da página ARTESP com 3 ocorrências de exemplo
- [ ] Teste `test_parse_occurrences()`: parser retorna lista correta
- [ ] Teste `test_pagination_detection()`: detecta última página
- [ ] Mock para NASA APIs (respostas JSON fixas)
- [ ] Teste `test_nasa_power_weather()`: retorna dict com campos esperados
- [ ] Teste `test_firms_hotspots()`: filtra por distância corretamente

---

## Entregáveis da Fase 2

| Arquivo | Descrição |
|---------|-----------|
| `src/scrapers/artesp_scraper.py` | Scraper ARTESP completo |
| `src/apis/nasa_power.py` | Integração NASA POWER |
| `src/apis/nasa_eonet.py` | Integração NASA EONET |
| `src/apis/nasa_firms.py` | Integração NASA FIRMS |
| `src/queue/scheduler.py` | Agendador de coleta |
| `scripts/collect_realtime.py` | Script de coleta manual |
| `data/raw/realtime/*.json` | Dados coletados (exemplo) |

---

## Critérios de Aceite

- [ ] `python scripts/collect_realtime.py` executa sem erros e salva JSON
- [ ] Scraper ARTESP parseia corretamente a tabela de ocorrências
- [ ] APIs NASA retornam dados válidos para coordenadas do Brasil
- [ ] Retries funcionam em caso de timeout (testável com mock)
- [ ] Cache evita re-requests dentro do TTL
- [ ] Todos os testes passando
