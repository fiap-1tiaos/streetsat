# Fase 4 — Inferência e Roteamento Adaptativo

**Objetivo**: Usar o modelo treinado (Fase 1) para gerar scores de risco em tempo real com dados da Fase 2+3, e implementar roteamento adaptativo que minimiza a exposição ao risco via algoritmo de caminho mínimo.

**Estimativa**: 2 dias  
**Output principal**: API REST `/risk` e `/route/optimize` + módulo de roteamento NetworkX

---

## Contexto

A inferência combina três fontes de dados:
1. **Modelo ML** (Random Forest): score base 0–3 a partir de features estruturadas
2. **NLP** (Comprehend/Local): boost no score a partir de narrativas de ocorrências
3. **Dados em tempo real**: ocorrências ARTESP + clima NASA no ponto consultado

O roteamento usa os scores como pesos em arestas de um grafo de rodovias para encontrar o caminho com menor exposição ao risco entre origem e destino.

---

## Tarefas

### 4.1 — Módulo de Inferência (`src/ml/inference.py`)
- [ ] Classe `RiskPredictor`:

  **`load_model(model_path="models/modelo_rf.pkl") -> None`**
  - `joblib.load()` do pipeline serializado
  - Verificar que arquivo existe, raise `ModelNotFoundError` caso contrário
  - Log versão do modelo (de `model_metadata.json`)

  **`predict(features: dict) -> PredictionResult`**
  - Converter dict → DataFrame com colunas na ordem correta do treino
  - Aplicar transformações (encoders carregados de `models/encoders.pkl`)
  - Retornar `PredictionResult(score=int, confidence=float, probabilities=list[float])`

  **`predict_segment(br: int, km: float, context: dict) -> PredictionResult`**
  - `context` contém dados de tempo real: `{"weather": {...}, "occurrences": [...], "events": [...]}`
  - Construir features completas combinando dados históricos do segmento + contexto atual
  - Chamar `enrich_score_with_nlp()` se houver ocorrências com narrativa no raio de 5km
  - Retornar score enriquecido

### 4.2 — Cache de Predições (`src/cache/redis_cache.py`)
- [ ] Wrapper Redis com TTL configurável:
  ```python
  class PredictionCache:
      def get(self, br, km) -> PredictionResult | None
      def set(self, br, km, result, ttl=3600) -> None
      def invalidate_segment(self, br, km) -> None
  ```
- [ ] Chave: `prediction:br{br}:km{int(km)}` (KM inteiro para agrupamento)
- [ ] Invalidar cache quando nova ocorrência for detectada no segmento

### 4.3 — Construção do Grafo de Rotas (`src/routing/graph_builder.py`)
- [ ] Classe `RoadGraphBuilder`:

  **`build_graph(segments: list[dict]) -> nx.Graph`**
  - Cada segmento: `{"br", "km_start", "km_end", "lat_start", "lon_start", "lat_end", "lon_end"}`
  - Nó: `(br, km_round)` — ex: `("BR-116", 225)`
  - Aresta: par de nós adjacentes com atributos:
    ```python
    {
        "distance_km": float,     # distância geográfica Haversine
        "risk_score": int,        # 0–3 (do modelo)
        "weight": float,          # função de peso = distance * (1 + risk_score * risk_penalty)
        "travel_time_min": float  # de ARTESP tempos-percurso se disponível
    }
    ```
  - Segmentos iniciais gerados a partir dos dados PRF (BRs únicas + KMs presentes)
  - Conexões entre BRs: via intersecções conhecidas (tabela de junctions hardcoded inicialmente)

  **`update_edge_weights(graph, risk_scores: dict) -> nx.Graph`**
  - Recalcular pesos de arestas com scores atualizados
  - Chamado a cada ciclo de inferência

### 4.4 — Otimização de Rota (`src/routing/path_optimizer.py`)
- [ ] Classe `RouteOptimizer`:

  **`find_safest_route(graph, origin: tuple, destination: tuple) -> RouteResult`**
  - `origin`/`destination`: `(br, km)` ou `(lat, lon)` (converter para nó mais próximo)
  - Algoritmo: `nx.shortest_path(graph, source, target, weight="weight")`
  - Retornar `RouteResult`:
    ```python
    @dataclass
    class RouteResult:
        nodes: list[tuple]           # sequência de (br, km)
        total_distance_km: float
        max_risk_score: int          # pior trecho
        avg_risk_score: float
        estimated_time_min: float
        risk_segments: list[dict]    # trechos com score > 1
        alternative_available: bool
    ```

  **`compare_routes(origin, destination) -> dict`**
  - Calcular rota direta (sem peso de risco) vs rota otimizada
  - Retornar: `{"direct": RouteResult, "safe": RouteResult, "km_overhead": float, "risk_reduction": float}`

### 4.5 — API REST (`src/api/fastapi_app.py`)
- [ ] Framework: **FastAPI** com `uvicorn`
- [ ] Endpoints:

  **`GET /health`**
  - Retornar `{"status": "ok", "model_version": str, "timestamp": str}`

  **`GET /risk/br/{br_number}/km/{km}`**
  - Path params: `br_number: int`, `km: float`
  - Query params: `lat: float | None`, `lon: float | None`
  - Lógica:
    1. Verificar cache Redis
    2. Se cache miss: coletar contexto (ARTESP + NASA) → inferir → salvar cache
    3. Retornar:
    ```json
    {
        "br": 116,
        "km": 225.0,
        "risk_score": 2,
        "risk_label": "Alto",
        "confidence": 0.87,
        "active_occurrences": 1,
        "weather_condition": "Chuva forte",
        "timestamp": "2026-05-31T14:30:00"
    }
    ```

  **`POST /route/optimize`**
  - Body:
    ```json
    {
        "origin": {"br": 116, "km": 200},
        "destination": {"br": 116, "km": 300},
        "risk_weight": 0.7
    }
    ```
  - Retornar comparação de rotas (direta vs segura)

  **`GET /occurrences`**
  - Query params: `uf: str | None`, `road: str | None`, `min_criticality: int = 1`
  - Retornar lista de ocorrências ativas do banco

- [ ] Middleware de logging de requests (tempo, endpoint, status)
- [ ] Global error handler (retornar JSON com `error`, `detail`, `timestamp`)
- [ ] CORS configurado para desenvolvimento

### 4.6 — Schema de Requests/Responses (`src/schemas/`)
- [ ] `predictions.py`: `PredictionResponse`, `PredictionResult`
- [ ] `routes.py`: `RouteRequest`, `RouteResponse`, `RouteComparison`
- [ ] Todos com `model_config = ConfigDict(from_attributes=True)` para SQLAlchemy compat

### 4.7 — Script de Demonstração (`scripts/demo_inference.py`)
- [ ] Carregar modelo
- [ ] Simular 5 segmentos com dados mockados
- [ ] Imprimir tabela: BR | KM | Score | Label | Confidence
- [ ] Simular rota BR-116 KM 200 → KM 300 e imprimir comparação

### 4.8 — Testes (`tests/unit/test_routing.py`, `tests/integration/test_api_endpoints.py`)
- [ ] Teste unitário: `predict()` com features válidas retorna score 0–3
- [ ] Teste unitário: grafo construído tem arestas com `weight > 0`
- [ ] Teste unitário: rota encontrada entre dois nós conectados
- [ ] Teste de integração: `GET /health` retorna 200
- [ ] Teste de integração: `GET /risk/br/116/km/225` retorna score válido (com modelo mockado)
- [ ] Teste de integração: `POST /route/optimize` retorna RouteComparison válida

---

## Modelo de Risco para Peso de Aresta

```
weight = distance_km * (1 + risk_score * risk_penalty)

risk_penalty por score:
  0 → 0.0  (sem penalidade)
  1 → 0.5  (peso 1.5x a distância)
  2 → 2.0  (peso 3x a distância)
  3 → 5.0  (peso 6x a distância — fortemente evitado)
```

---

## Entregáveis da Fase 4

| Arquivo | Descrição |
|---------|-----------|
| `src/ml/inference.py` | Classe RiskPredictor |
| `src/routing/graph_builder.py` | Construtor de grafo NetworkX |
| `src/routing/path_optimizer.py` | Otimizador Dijkstra |
| `src/api/fastapi_app.py` | API REST FastAPI |
| `src/api/routes/` | Blueprints de rotas |
| `scripts/demo_inference.py` | Demo para apresentação |

---

## Critérios de Aceite

- [ ] `uvicorn src.api.fastapi_app:app --reload` sobe sem erros
- [ ] `GET /risk/br/116/km/225` retorna JSON válido em < 2s
- [ ] `POST /route/optimize` retorna rota com `max_risk_score ≤ 3`
- [ ] Cache Redis reduz tempo de resposta na segunda chamada (testável com logs)
- [ ] Todos os testes passando
