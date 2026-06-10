<div align= "center">
    <h1>FIAP - Faculdade de Informática e Administração Paulista</h1>
    <a href= "https://www.fiap.com.br/">
        <img src="assets/logo/logo_fiap.png" alt="Logo FIAP" width=40%>
    </a>
</div>

# Streetsat

Monitoramento inteligente de rotas brasileiras via satélite e IA.

## 👨‍🎓 Integrantes:

- <a href="https://www.linkedin.com/in/gabriel-oliveira-b6353a16b/">Gabriel Oliveira dos Santos</a>
- <a href="https://www.linkedin.com/in/roberson-pedrosa-304ab523a/">Roberson Pedrosa de Oliveira Junior</a>
- <a href="https://www.linkedin.com/in/arthur-bruttel-7171b8381">Arthur Bruttel Nascimento</a>
- <a href="https://www.linkedin.com/in/jonviotti/">Jonatan Viotti Rodrigues da Silva</a>
- <a href="https://www.linkedin.com/in/eusamuelrocha/">Samuel Nicolas Oliveira Rocha</a>

## 👩‍🏫 Professores:

### Tutora
- <a href="https://www.linkedin.com/in/sabrina-otoni-22525519b/">Sabrina Otoni</a>
### Coordenador
- <a href="https://www.linkedin.com/company/inova-fusca">André Godoi Chiovato</a>

## Links:

- <a href="https://youtu.be/hrgigyV0mVw">FIAP — Global Solution 2 (2026) | ODS 8, 9 e 11</a>

---

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Pipeline de Dados](#pipeline-de-dados)
- [Modelos e Algoritmos](#modelos-e-algoritmos)
- [API REST](#api-rest)
- [Banco de Dados](#banco-de-dados)
- [Infraestrutura AWS / LocalStack](#infraestrutura-aws--localstack)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Início Rápido](#início-rápido)
- [Docker](#docker)
- [Testes](#testes)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## Visão Geral

O Streetsat analisa trechos de rodovias brasileiras e calcula um score de risco em tempo real combinando três fontes:

1. **Ocorrências ARTESP** — scraping em tempo real do CCM-ARTESP + dataset histórico com 18.7k registros
2. **Eventos naturais NASA EONET** — enriquecimento geoespacial com wildfires, severeStorms, floods e landslides filtrados para SP
3. **Condições climáticas** — temperatura, precipitação, vento e umidade via Open-Meteo API em tempo real

O resultado final é exposto via API REST (FastAPI), visualizado em um dashboard (Plotly Dash) e notificado via AWS SNS.

---

## Arquitetura do Sistema

```
┌───────────────────────────────────────────────────────────────┐
│                        FONTES DE DADOS                        │
│  ARTESP CSV (18.7k)  │  ARTESP scraping  │  NASA EONET + Open-Meteo │
└────────┬─────────────────┬──────────────────────┬────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│  ARTESP Loader   │   │  Lambda Scraper │   │   NASA EONET +         │
│  + Cleaner   │   │  (a cada 5 min) │   │   clima (Open-Meteo)  │
│  Engineering │   └────────┬────────┘   └──────────┬──────────┘
└──────┬───────┘            │                        │
       │                    ▼                        │
       │           ┌─────────────────┐               │
       │           │  SQS Inference  │               │
       │           │      Queue      │               │
       │           └────────┬────────┘               │
       ▼                    ▼                        ▼
┌──────────────────────────────────────────────────────────────┐
│                   CAMADA 1: SCORING ML                        │
│   Random Forest (200 árvores, profundidade 15)                │
│   21 features → score 0–3 + probabilidades                    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   CAMADA 2: NLP SEMÂNTICO                      │
│   AWS Comprehend (prod) / LocalNLP PT-BR (dev)                │
│   Análise de sentimento + entidades → severity boost +1/+2    │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   CAMADA 3: ROTEAMENTO                       │
│       NetworkX — grafo de rodovias com pesos de risco        │
│      Dijkstra (menor peso) vs. direto (menor distância)      │
└─────────────────────────────┬────────────────────────────────┘
                              │
              ┌───────────────┴──────────────┐
              ▼                              ▼
     ┌─────────────────┐            ┌───────────────────┐
     │   FastAPI REST  │            │  Plotly Dash      │
     │   :8000         │            │  Dashboard :5000  │
     └────────┬────────┘            └───────────────────┘
              │
     ┌────────┴─────────┐
     │                  │
     ▼                  ▼
┌─────────┐    ┌────────────────┐
│  Redis  │    │  SNS Alerts    │
│  Cache  │    │  (e-mail/SMS)  │
└─────────┘    └────────────────┘
```

---

## Pipeline de Dados

### 1. Carga Histórica — CSV ARTESP (`src/data/artesp_loader.py`)

Lê `data/ccm-artesp/ccm-artesp.csv` (separador `;`, encoding `utf-8-sig`) com ~18.740 registros de ocorrências das rodovias concessionadas de SP. Normaliza colunas, extrai vítimas, bloqueios, coordenadas e features temporais.

### 2. Coleta em Tempo Real — Scraper ARTESP (`src/scrapers/artesp_scraper.py`)

Coleta ocorrências ativas do site da ARTESP a cada 5 min via Lambda. Cada ocorrência é enriquecida com:
- **Lista**: tipo (`occurrence_types` array), status, vítimas, localização, concessionária
- **Detalhe** (página individual): criticidade, concessionária, narrativa, município, sentido
- **Coordenadas** (página de mapa): latitude/longitude via parser de JSON embutido no JS

### 3. Feature Engineering (`src/data/feature_engineering.py`)

Transforma o DataFrame nas **21 features** consumidas pelo modelo:

### Features ARTESP (15)

| Feature | Origem | Descrição |
|---|---|---|
| `hour` | `data_hora_inicio` | Hora do dia (0–23) |
| `day_of_week` | `data_hora_inicio` | Dia da semana (0=seg, 6=dom) |
| `is_weekend` | calculado | 1 se sáb/dom |
| `month` | `data_hora_inicio` | Mês (1–12) |
| `road_id_encoded` | `rodovia` (normalizada) | LabelEncoder (347 rodovias) |
| `km_mid` | `km_inicial` + `km_final` | Ponto médio do trecho |
| `class_encoded` | `classe` | LabelEncoder: Acidente, Ocorrência, etc. |
| `subclass_encoded` | `subclasse_ac` | LabelEncoder: Colisão, Tombamento, etc. |
| `accident_type_encoded` | `tipo_ac` | LabelEncoder (60 tipos específicos) |
| `concessionaire_encoded` | `concessionaria` | LabelEncoder (37 concessionárias) |
| `municipio_encoded` | `município` | LabelEncoder (338 municípios) |
| `has_blockage` | `interdições` | 1 se houve bloqueio |
| `feridos_leves` | `vítimas` | Parse do texto de vítimas |
| `feridos_graves` | `vítimas` | Parse do texto de vítimas |
| `mortos` | `vítimas` | Parse do texto de vítimas |

### Features NASA EONET (2)

| Feature | Origem | Descrição |
|---|---|---|
| `nearest_eonet_distance_km` | EONET + Haversine | Distância ao evento natural mais próximo via API NASA |
| `has_nearby_eonet` | EONET | 1 se há evento EONET a ≤ 50km do trecho |

Filtrado para o estado de SP com categorias: wildfires, severeStorms, floods, landslides.

### Features Climáticas (4)

| Feature | Origem | Descrição |
|---|---|---|
| `precipitation_mm` | Open-Meteo | Precipitação horária no trecho |
| `wind_speed_ms` | Open-Meteo | Velocidade do vento a 10m |
| `temperature_c` | Open-Meteo | Temperatura do ar a 2m |
| `humidity` | Open-Meteo | Umidade relativa |

### 4. Label de Risco

```python
score = 0  # Livre       → sem vítimas ou classe != "Acidente"
score = 1  # Atenção     → acidente ou feridos leves > 0
score = 2  # Alto        → feridos graves > 0
score = 3  # Crítico     → mortos > 0
```

A regra é aplicada com prioridade crescente.

---

## Modelos e Algoritmos

### Camada 1 — Random Forest (`src/ml/`)

**Algoritmo:** Random Forest Classifier (scikit-learn)

O Random Forest constrói um ensemble de árvores de decisão treinadas em subconjuntos aleatórios dos dados, usando bagging. Na inferência, cada árvore vota e a classe com mais votos (ou maior probabilidade média) é a predição final.

**Hiperparâmetros do modelo treinado:**

| Parâmetro | Valor | Justificativa |
|---|---|---|
| `n_estimators` | 200 | Mais árvores = menor variância, sem custo de bias |
| `max_depth` | 15 | Evita overfitting em dataset desbalanceado |
| `min_samples_leaf` | 5 | Regularização: folha precisa de ao menos 5 amostras |
| `class_weight` | balanced | Corrige desbalanceamento |

**Performance atual (modelo treinado):**

```
Dataset: 18.740 registros ARTESP (80/20 train/test)
Acurácia: 1.0
F1-macro: 1.0
```

**Importância das features (top 5):**

| Feature | Importância |
|---|---|
| `mortos` | 35.0% |
| `feridos_graves` | 30.0% |
| `feridos_leves` | 20.0% |
| `has_blockage` | 8.0% |
| `accident_type_encoded` | 7.0% |

**Inferência em runtime** (`src/ml/inference.py`):

O preditor é um singleton (`get_predictor()`) carregado lazily na primeira requisição. As features contextuais (hora, dia) são extraídas do momento da requisição; features de vítimas ficam em 0 pois não são conhecidas a priori.

```python
from src.ml.inference import get_predictor

predictor = get_predictor()
result = predictor.predict_segment(road="SP-330", km=225)
# result.score → 0-3
# result.confidence → probabilidade da classe vencedora
# result.risk_label → "Livre" / "Atenção" / "Alto" / "Crítico"
```

**Treinar novo modelo:**

```bash
# Requer data/ccm-artesp/ccm-artesp.csv
make train
# ou
python scripts/train_model.py
```

---

### Camada 2 — NLP Semântico (`src/nlp/`)

Analisa a narrativa textual de ocorrências coletadas pelo scraper e aplica um boost de severidade ao score do Random Forest. A narrativa é obtida via scraper de detalhe (página individual de cada ocorrência).

**Dois modos de operação:**

| Modo | Condição | Implementação |
|---|---|---|
| AWS Comprehend | `COMPREHEND_ENABLED=true` | API gerenciada da AWS para sentimento e entidades |
| LocalNLP | padrão (dev) | Dicionário de palavras-chave PT-BR sem dependência externa |

**Lógica de boost:**

```
narrativa → análise NLP → severity_boost

se "morto" / "óbito" / "vítima fatal" → boost = +2
se "ferido grave" / "resgate" + sentimento NEGATIVE → boost = +1
se "bloqueio total" / "interditado" → boost = +1

score_final = min(3, score_rf + max_boost_das_ocorrências)
```

**Palavras-chave por categoria:**

| Categoria | Exemplos |
|---|---|
| Crítico (+2) | morto, óbito, vítima fatal, faleceu, morte, fatal |
| Alto (+1) | ferido grave, uti, internado, presos às ferragens, resgate |
| Médio (neutro) | ferido leve, socorrido, ambulância |
| Bloqueio (+1) | bloqueio total, interditado, fechado, sem passagem |
| Desvio (info) | desvio, alternativa, contorno, retorno |

**Ativar AWS Comprehend:**

```env
COMPREHEND_ENABLED=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_chave
AWS_SECRET_ACCESS_KEY=seu_secret
```

---

### Camada 3 — Roteamento (`src/routing/`)

**Algoritmo:** Dijkstra (via NetworkX `shortest_path`)

**Construção do grafo** (`graph_builder.py`):

Cada segmento de rodovia vira uma aresta no grafo. O peso da aresta combina distância geográfica (Haversine) e penalidade de risco:

```python
weight = distance_km * (1 + RISK_PENALTY[risk_score])

RISK_PENALTY = {
    0: 0.0,   # Livre    → peso = distância pura
    1: 0.5,   # Atenção  → +50% no peso
    2: 2.0,   # Alto     → +200% no peso
    3: 5.0,   # Crítico  → +500% no peso
}
```

Um trecho de 10km com risco Crítico vale 60km no grafo — o algoritmo naturalmente o evita.

**Comparação de rotas** (`path_optimizer.py`):

O endpoint `/route/optimize` retorna sempre dois caminhos:

- **Rota segura:** Dijkstra com pesos de risco → minimiza exposição ao perigo
- **Rota direta:** Dijkstra com peso = distância pura → caminho mais curto

A resposta inclui `km_overhead` (km a mais da rota segura) e `risk_reduction` (diferença de score médio), permitindo que o usuário decida o trade-off.

---

## API REST

A API é construída com FastAPI e serve em `http://localhost:8000`. Documentação interativa disponível em `/docs` (Swagger) e `/redoc`.

### Endpoints

#### `GET /health`

Verifica status da API e se o modelo foi carregado.

```bash
curl http://localhost:8000/health
```

```json
{
  "status": "ok",
  "model_loaded": true,
  "model_version": "1.0.0",
  "timestamp": "2026-05-31T20:00:00"
}
```

---

#### `GET /risk/{road}/km/{km}`

Retorna o score de risco de um trecho de rodovia.

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `road` | string | Nome da rodovia (ex: SP-330) |
| `km` | float | Quilômetro do trecho |
| `lat` | float (query, opcional) | Latitude para contexto |
| `lon` | float (query, opcional) | Longitude para contexto |

**Cache:** Redis TTL 1 hora por chave `prediction:{road}:km:{km}`

```bash
curl http://localhost:8000/risk/SP-330/km/150
```

```json
{
  "road": "SP-330",
  "km": 150.0,
  "risk_score": 2,
  "risk_label": "Alto",
  "confidence": 0.6714,
  "active_occurrences": 0,
  "timestamp": "2026-06-09T12:00:00"
}
```

---

#### `GET /occurrences`

Lista ocorrências ativas coletadas pelo scraper ARTESP.

**Query params:**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `road` | string | — | Filtro por nome de rodovia |
| `min_risk_score` | int | 0 | Score de risco mínimo (0–3) |
| `limit` | int | 50 | Máximo de resultados (até 200) |

```bash
curl "http://localhost:8000/occurrences?min_risk_score=2&limit=10"
```

```json
{
  "total": 3,
  "items": [
    {
      "road": "SP-070",
      "km": 45.2,
      "risk_score": 3,
      "risk_label": "Crítico",
      "occurrence_types": ["Acidente com vítimas", "Bloqueio"],
      "concessionaire": "Ecopistas",
      "municipio": "Guarulhos",
      "narrative": "Acidente com vítimas fatais...",
      "status": "Ativo",
      "collected_at": "2026-06-09T12:00:00"
    }
  ]
}
```

---

#### `POST /route/optimize`

Calcula e compara a rota mais segura com a rota direta.

```bash
curl -X POST http://localhost:8000/route/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "origin":      {"road": "SP-330", "km": 200},
    "destination": {"road": "SP-330", "km": 300}
  }'
```

```json
{
  "origin":      {"road": "SP-330", "km": 200},
  "destination": {"road": "SP-330", "km": 300},
  "safe_route": {
    "nodes": [{"road": "SP-330", "km": 200}, "..."],
    "total_distance_km": 108.5,
    "max_risk_score": 1,
    "avg_risk_score": 0.4,
    "estimated_time_min": 78.2,
    "risk_segments_count": 1
  },
  "direct_route": {
    "total_distance_km": 100.0,
    "max_risk_score": 3,
    "avg_risk_score": 1.8
  },
  "km_overhead": 8.5,
  "risk_reduction": 1.4
}
```

---

## Banco de Dados

O projeto usa três bancos com responsabilidades distintas:

### PostgreSQL (:5433 → 5432)

Armazena dados históricos, logs de inferência e configurações. Container: `streetsat-postgres`.

```env
DATABASE_URL=postgresql://streetsat:streetsat_dev@localhost:5433/streetsat_db
```

Acesso:
```bash
docker exec -it streetsat-postgres psql -U streetsat -d streetsat_db
```

### Redis (:6380 → 6379)

Cache de predições (`prediction:{road}:km:{km}`) com TTL configurável (padrão 1h). Container: `streetsat-redis`.

```env
REDIS_URL=redis://localhost:6380
REDIS_CACHE_TTL=3600
```

Inspecionar cache:
```bash
docker exec -it streetsat-redis redis-cli
> KEYS prediction:*
> GET prediction:SP-330:km:150
```

### MongoDB (:27017)

Armazena ocorrências brutas coletadas pelos scrapers e eventos NASA em formato flexível. Container: `streetsat-mongodb`.

```env
MONGODB_URL=mongodb://admin:admin_dev@localhost:27017/
```

---

## Infraestrutura AWS / LocalStack

Em ambiente de desenvolvimento, todos os serviços AWS são emulados pelo LocalStack.

### Serviços emulados

| Serviço | Uso no projeto |
|---|---|
| S3 | Armazena modelos treinados e dados coletados |
| Lambda | Scraper (a cada 5min), Inference worker, Alert sender |
| SQS | Fila de inferência e fila de alertas |
| SNS | Notificações para assinantes (e-mail/SMS) |
| CloudWatch | Logs e métricas das Lambdas |

### Instalar AWS CLI

O AWS CLI é necessário para criar e interagir com os recursos do LocalStack.

**Linux / WSL:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

**macOS (Homebrew):**
```bash
brew install awscli
aws --version
```

**Windows:**
```powershell
# Baixar o instalador em: https://awscli.amazonaws.com/AWSCLIV2.msi
# ou via winget:
winget install Amazon.AWSCLI
```

**Configurar credenciais fictícias para o LocalStack:**
```bash
aws configure
# AWS Access Key ID:     test
# AWS Secret Access Key: test
# Default region name:   us-east-1
# Default output format: json
```

> As credenciais `test/test` são aceitas pelo LocalStack — não são credenciais reais da AWS.

---

### Configurar LocalStack

O LocalStack sobe automaticamente via `docker-compose up`. Confirme que está healthy:

```bash
curl http://localhost:4566/_localstack/health
```

### Criar bancos de dados

Após os containers subirem (`docker-compose up -d`), inicialize os bancos:

**PostgreSQL — criar tabelas:**

As tabelas são definidas em `src/db/postgres.py` (SQLAlchemy ORM) e criadas automaticamente na inicialização da API via `create_tables()`. Para criá-las manualmente:

```bash
# Acessar o container
docker exec -it streetsat-postgres psql -U streetsat -d streetsat_db

# Criar tabelas (cole dentro do psql)
CREATE TABLE IF NOT EXISTS occurrences_realtime (
    occurrence_id      VARCHAR(20) PRIMARY KEY,
    road               VARCHAR(30),
    km                 FLOAT,
    municipio          VARCHAR(100),
    city               VARCHAR(100),
    state              VARCHAR(10),
    occurrence_type    VARCHAR(80),
    occurrence_subtype VARCHAR(80) DEFAULT '',
    occurrence_types   JSONB,
    concessionaire     VARCHAR(100),
    direction          VARCHAR(20),
    interdiction_level INTEGER DEFAULT 0,
    interdiction_label VARCHAR(100) DEFAULT '',
    criticality        INTEGER DEFAULT 1,
    criticality_label  VARCHAR(20) DEFAULT '',
    victims            JSONB,
    victims_total      INTEGER DEFAULT 0,
    narrative          TEXT,
    status             VARCHAR(50) DEFAULT 'Ativa',
    status_timestamp   VARCHAR(20) DEFAULT '',
    detected_at        TIMESTAMP DEFAULT NOW(),
    update_timestamp   VARCHAR(20) DEFAULT '',
    mits_id            INTEGER,
    weather_condition  VARCHAR(100) DEFAULT '',
    roadway            VARCHAR(50) DEFAULT '',
    lanes              VARCHAR(50) DEFAULT '',
    signaling          VARCHAR(100) DEFAULT '',
    latitude           FLOAT,
    longitude          FLOAT,
    nlp_entities       JSONB,
    nlp_sentiment      VARCHAR(20),
    risk_score         INTEGER,
    created_at         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_occurrences_risk_score ON occurrences_realtime (risk_score);
CREATE INDEX IF NOT EXISTS idx_occurrences_road ON occurrences_realtime (road);
CREATE INDEX IF NOT EXISTS idx_occurrences_criticality ON occurrences_realtime (criticality);
CREATE INDEX IF NOT EXISTS idx_occurrences_city ON occurrences_realtime (city);
CREATE INDEX IF NOT EXISTS idx_occurrences_detected_at ON occurrences_realtime (detected_at);

CREATE TABLE IF NOT EXISTS predictions_cache (
    id                   BIGSERIAL PRIMARY KEY,
    road                 VARCHAR(30),
    km                   FLOAT,
    predicted_risk_score INTEGER,
    confidence           FLOAT,
    model_version        VARCHAR(20),
    created_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id             BIGSERIAL PRIMARY KEY,
    alert_id       VARCHAR(50) UNIQUE,
    occurrence_id  VARCHAR(20),
    road           VARCHAR(30),
    km             FLOAT,
    municipio      VARCHAR(100),
    risk_score     INTEGER,
    message        TEXT,
    sent           BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heatmap_data (
    id             BIGSERIAL PRIMARY KEY,
    day_of_week    INTEGER NOT NULL,
    hour           INTEGER NOT NULL,
    count          INTEGER DEFAULT 0,
    avg_risk       FLOAT DEFAULT 0.0,
    updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_heatmap_day_hour ON heatmap_data (day_of_week, hour);

\q
```

Verificar que as tabelas foram criadas:
```bash
docker exec -it streetsat-postgres psql -U streetsat -d streetsat_db -c "\dt"
```

**MongoDB — criar coleções e índices:**
```bash
# Acessar o container
docker exec -it streetsat-mongodb mongosh \
  --username admin --password admin_dev \
  --authenticationDatabase admin

# Criar banco e coleções (cole dentro do mongosh)
use streetsat

db.createCollection("raw_occurrences")
db.createCollection("nasa_events")
db.createCollection("alert_history")

db.raw_occurrences.createIndex({ "collected_at": -1 })
db.raw_occurrences.createIndex({ "road": 1, "criticality": -1 })
db.nasa_events.createIndex({ "event_date": -1 })

exit
```

Verificar as coleções:
```bash
docker exec -it streetsat-mongodb mongosh \
  --username admin --password admin_dev \
  --authenticationDatabase admin \
  --eval "use streetsat; db.getCollectionNames()"
```

---

### Recursos AWS locais

O bucket S3, as filas SQS e o tópico SNS são criados automaticamente pelo `serverless deploy` via CloudFormation — não é necessário criá-los manualmente.

Após o deploy, faça o upload dos arquivos de modelo para o S3:

```bash
make sls-upload-models
```

Isso copia os três arquivos de `models/` para `s3://streetsat-models-dev/models/`:

| Arquivo | Tamanho | Uso |
|---|---|---|
| `modelo_rf.pkl` | 397 KB | Pipeline Random Forest serializado |
| `encoders.pkl` | 24 KB | LabelEncoders das features categóricas |
| `model_metadata.json` | 2 KB | Métricas, hiperparâmetros, feature importance |

> **DeletionPolicy: Retain** — o bucket sobrevive ao `sls-reset-local`, mas o conteúdo
> é apagado pelo LocalStack durante a deleção da stack. Execute `make sls-upload-models`
> novamente após cada reset.

### Serverless Framework

O `serverless.yml` define 4 Lambdas:

| Função | Handler | Trigger | Memória |
|---|---|---|---|
| `scraper` | `handler_scraper.lambda_handler` | cron a cada 5min | 512MB |
| `inference` | `handler_inference.lambda_handler` | SQS (batch 10) | 1024MB |
| `alerter` | `handler_alerts.lambda_handler` | SQS (batch 5) | 256MB |
| `api` | `fastapi_app.handler` | HTTP API Gateway | 512MB |

**Modelo ML no S3 (cold start automático):**

O `modelo_rf.pkl` tem 397 KB e cabe no ZIP de deploy. O Lambda `inference` carrega do S3 na primeira execução:

```
Cold start do Lambda inference:
  1. Detecta _IS_LAMBDA=True (/var/task read-only)
  2. Tenta carregar modelo_rf.pkl de /tmp/streetsat/models/
  3. Arquivo não existe → baixa de s3://streetsat-models-dev/models/
  4. Salva em /tmp/ e carrega no predictor singleton
  5. Execuções quentes reutilizam o predictor em memória
```

Se o download falhar (bucket vazio, sem conectividade), o preditor entra em **modo stub** — retorna `score=0` para todas as predições sem crashar o Lambda. Execute `make sls-upload-models` para popular o bucket.

**Pipeline automático local (modo listening):**

O comando `sls-start-local` sobe toda a infraestrutura e deploya as Lambdas no LocalStack. A partir daí o pipeline roda sozinho — sem intervenção manual:

```bash
# Sobe LocalStack + deploya lambdas + ativa triggers automáticos
make sls-start-local
```

O que acontece por baixo:
1. `docker-compose up -d` — sobe Postgres, Redis, MongoDB e LocalStack
2. Aguarda LocalStack ficar healthy via `/_localstack/health`
3. `serverless deploy --stage dev` — cria bucket S3, filas SQS, tópico SNS e deploya as 4 funções
4. `make sls-upload-models` — copia `modelo_rf.pkl`, `encoders.pkl` e `model_metadata.json` para o S3
5. **EventBridge** agenda o scraper para disparar a cada 5 minutos
6. **SQS** dispara inference automaticamente quando scraper enfileira
7. **SQS** dispara alerter automaticamente quando inference enfileira

```
LocalStack EventBridge (cron */5min)
    └─▶ scraper  → coleta ARTESP + NASA → salva S3 → enfileira SQS
           └─▶ inference  → lê S3 → prediz risco → enfileira SQS
                  └─▶ alerter  → publica SNS para alertas críticos
```

**Pré-requisitos:**

```bash
# 1. Serverless CLI global
npm install -g serverless

# 2. Plugin serverless-localstack (já no package.json do projeto raiz)
npm install
```

**Deploy isolado (LocalStack já rodando):**

```bash
make sls-deploy-local
```

> **Primeira execução:** o Serverless empacota as dependências de `requirements-lambda.txt`
> no ZIP da Lambda (~2 min). O `requirements-lambda.txt`
> contém apenas os pacotes necessários pelos handlers — sem visualização, BD ou infraestrutura.
> Com `useStaticCache: true`, redeployos subsequentes são instantâneos; o rebuild só ocorre
> quando `requirements-lambda.txt` mudar.

**Invocar manualmente (para testes pontuais):**

```bash
# Scraper manual
make sls-invoke-scraper

# Inference com payload SQS simulado
make sls-invoke-inference

# Via AWS CLI apontando para LocalStack
aws --endpoint-url=http://localhost:4566 lambda list-functions
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name streetsat-dev-scraper \
  --payload '{}' \
  output.json && cat output.json
```

> **Serverless v4 — dependências Python:** O `serverless-python-requirements` é embutido no
> Serverless v4 e **não precisa** ser listado em `plugins` nem instalado via npm. Basta manter
> o bloco `custom.pythonRequirements` no `serverless.yml` para ativá-lo. O plugin empacota
> automaticamente tudo de `requirements.txt` no artefato de deploy, incluindo `numpy`, `bs4`,
> `sklearn` e demais pacotes necessários pelos handlers.

**Variáveis de ambiente para LocalStack:**

```env
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
USE_LOCALSTACK=true
```

### Troubleshooting de deploy

O LocalStack pode deixar recursos órfãos entre tentativas de deploy. Use `make sls-reset-local` para limpar antes de redesployar:

| Erro | Causa | Fix |
|---|---|---|
| `Failed to delete resource... AWS::Lambda::Version` | Stack antiga com versioning; LocalStack não consegue deletar versões Lambda | `make sls-reset-local && make sls-deploy-local` |
| `ResourceConflictException: event source mapping... already exists` | ESM órfão de deploy anterior | `make sls-reset-local && make sls-deploy-local` |
| `Unzipped size must be smaller than 262144000 bytes` | ZIP Lambda > 250MB descomprimido | Adicionar pacotes ao `noDeploy` em `serverless.yml` ou remover de `requirements-lambda.txt` |
| `No module named 'numpy'` | Pacote não incluído no ZIP de deploy | Verificar se `custom.pythonRequirements` está configurado e `requirements-lambda.txt` inclui o pacote |
| `PermissionError: '/var/task/models'` | `config.py` tentava criar diretórios em `/var/task` (read-only em Lambda) | Já corrigido — `_IS_LAMBDA` detecta o ambiente e redireciona para `/tmp/streetsat` |
| `Could not connect to endpoint URL: http://localhost:4566/...` no inference | `AWS_ENDPOINT_URL` foi sobrescrito manualmente via `update-function-configuration` | `make sls-reset-local && make sls-deploy-local` para restaurar env padrão do Serverless |
| Inference em modo stub (`score=0` para tudo) | Modelo não encontrado no S3 após reset | `make sls-upload-models` para popular o bucket com os arquivos de modelo |

```bash
# Reset completo + redeploy
make sls-reset-local
make sls-deploy-local
```

> **Tamanho do ZIP:** o `requirements-lambda.txt` lista apenas os pacotes necessários
> pelos handlers Lambda (sem pacotes de visualização, BD, ou infraestrutura).

### Monitoramento do pipeline local

Após `make sls-start-local`, use os targets abaixo para acompanhar se os lambdas estão sendo trigados e executando corretamente:

| Comando | O que mostra |
|---|---|
| `make sls-monitor` | Painel consolidado: filas + S3 + logs das 3 funções |
| `make sls-logs-live` | Stream em tempo real dos logs do LocalStack (ctrl+c para sair) |
| `make sls-queue-status` | Mensagens pendentes e em processamento nas filas SQS |
| `make sls-s3-status` | Arquivos salvos pelo scraper no bucket S3 |
| `make sls-logs-scraper` | Saída da última execução do scraper |
| `make sls-logs-inference` | Saída da última execução do inference |
| `make sls-logs-alerter` | Saída da última execução do alerter |

**Fluxo de verificação recomendado:**

```bash
# Terminal 1 — logs ao vivo enquanto o pipeline roda
make sls-logs-live

# Terminal 2 — após ~5 min, verificar cada camada
make sls-monitor
```

**Sinais de funcionamento correto:**

- `sls-s3-status` mostra arquivos com timestamp do dia em `raw/occurrences/YYYY/MM/DD/`
- `sls-queue-status` mostra `ApproximateNumberOfMessages: 0` (filas sendo consumidas rapidamente)
- `sls-logs-scraper` exibe `"occurrences_count": N` e `"eonet_events_count": N`
- `sls-logs-inference` exibe `"alerts_generated": N`

**Sinais de problema:**

- `sls-queue-status` mostra `ApproximateNumberOfMessagesNotVisible > 0` por tempo prolongado → inference travada
- `sls-s3-status` vazio após 10 min → scraper não disparou (verificar EventBridge no LocalStack)
- `sls-logs-scraper` com `"occurrences_count": 0` → ARTESP scraper falhou (checar conectividade)

### Troubleshooting

#### `ServerlessError2: Failed to delete resource with id ScraperLambdaFunction of type AWS::Lambda::Function`

**Causa:** O CloudFormation ficou em `UPDATE_FAILED` durante `make sls-deploy-local` porque um update anterior tentou recriar a `ScraperLambdaFunction` (geralmente pela schedule rule do EventBridge) e o LocalStack não conseguiu deletar o recurso antigo — o stack fica travado e impede novos deploys.

**Solução:**

```bash
# 1. Deletar o stack manualmente
make sls-remove

# 2. Verificar que as funções foram removidas
aws --endpoint-url=http://localhost:4566 lambda list-functions \
  --query 'Functions[?starts_with(FunctionName, `streetsat`)].FunctionName'

# 3. Redeploy
make sls-deploy-local
```

#### `ServerlessError2: Unzipped size must be smaller than 262144000 bytes`

**Causa:** O pacote de deploy excede o limite de 250 MB descompactado do Lambda. Isso acontece porque `serverless-python-requirements` inclui TODAS as dependências do `requirements.txt`, incluindo pacotes pesados que nenhuma Lambda usa (ex: `geopandas`, `matplotlib`, `seaborn`, `plotly`, `dash`, `xgboost`, etc).

**Solução:** O projeto usa `requirements-lambda.txt` com apenas os pacotes necessários em runtime. Se precisar adicionar uma nova dependência, adicione apenas em `requirements-lambda.txt` se ela for necessária nas Lambdas, ou apenas em `requirements.txt` se for apenas para uso local.

```bash
# Limpar cache e redeploy
rm -f .requirements.zip
make sls-deploy-local
```

> Se o erro persistir, verifique se há dependências não utilizadas sendo puxadas por transitividade. Use `pip list` no ambiente da Lambda para auditar o tamanho.

---

### Troubleshooting (recursos órfãos)

> Se o stack não for deletado pelo `make sls-remove`, force a remoção dos recursos manualmente:
> ```bash
> aws --endpoint-url=http://localhost:4566 lambda delete-function --function-name streetsat-dev-scraper
> aws --endpoint-url=http://localhost:4566 lambda delete-function --function-name streetsat-dev-inference
> aws --endpoint-url=http://localhost:4566 lambda delete-function --function-name streetsat-dev-alerter
> aws --endpoint-url=http://localhost:4566 lambda delete-function --function-name streetsat-dev-api
> aws --endpoint-url=http://localhost:4566 cloudformation delete-stack --stack-name streetsat-dev
> ```

---

## Configuração do Ambiente

### Pré-requisitos

- Python 3.13+
- Docker + Docker Compose
- Node.js 20+ (apenas para o frontend em `web/`)
- AWS CLI (para comandos LocalStack)
- Serverless Framework (opcional, para deploy de Lambdas)

### Variáveis de ambiente

Copie o arquivo de exemplo e edite conforme necessário:

```bash
cp .env.example .env.local
```

**Variáveis disponíveis:**

```env
# Ambiente
ENV=development
DEBUG=false
LOG_LEVEL=INFO

# Bancos de dados
DATABASE_URL=postgresql://streetsat:streetsat_dev@localhost:5433/streetsat_db
REDIS_URL=redis://localhost:6380
REDIS_CACHE_TTL=3600
MONGODB_URL=mongodb://admin:admin_dev@localhost:27017/

# AWS / LocalStack
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=streetsat-models-dev
SNS_TOPIC_ARN=
SQS_INFERENCE_QUEUE_URL=
SQS_ALERTS_QUEUE_URL=
USE_LOCALSTACK=true

# APIs externas
NASA_API_KEY=DEMO_KEY        # https://api.nasa.gov (necessária para EONET)

# NLP
COMPREHEND_ENABLED=false     # true para usar AWS Comprehend real

# Dashboard
DASH_PORT=5000
API_BASE_URL=http://localhost:8000
```

---

## Início Rápido

### Modo local — Linux | Mac

```bash
# 1. Criar ambiente virtual
python -m venv venv && source venv/bin/activate   # Linux/Mac
# ou: venv\Scripts\activate                       # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 4. Subir bancos via Docker (apenas infraestrutura)
docker-compose up -d postgres redis mongodb localstack

# 5. Treinar o modelo (requer data/ccm-artesp/ccm-artesp.csv)
make train

# 6. Subir a API
make api

# API disponível em:
http://localhost:8000/docs

# 7. Subir o dashboard (abra outro terminal com (.venv) ativo, sem fechar o anterior)
make dashboard

# Dashboard disponível em: 
http://localhost:5000
```

### Modo local — Windows

```bash
# 1. Criar e ativar o ambiente virtual
python -m venv .venv
# Aperte CTRL + SHIFT + P
# Procure por > Python: Select Interpreter
# Selecione o que tem (.venv)
# Ative com o comando abaixo (se no terminal não aparecer (.venv), feche-o e abra outro)
.venv\Scripts\activate    

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
copy .env.example .env.local
# Editar .env.local com suas credenciais

# 4. Subir bancos via Docker (apenas infraestrutura)
docker-compose up -d postgres redis mongodb localstack
# Requer Docker Desktop em execução

# 5. Treinar modelo
python scripts\train_model.py

# 6. Subir a API
uvicorn src.api.fastapi_app:app --host 0.0.0.0 --port 8000 --reload

# API disponível em:
http://localhost:8000/docs

# 7. Subir o dashboard (abra outro terminal com (.venv) ativo, sem fechar o anterior)
python dashboard\app.py

# Dashboard disponível em:
http://localhost:5000
```

### Demos disponíveis

```bash
# Demo NLP — analisa narrativas de ocorrências
make demo-nlp

# Demo de inferência + roteamento
make demo-inference

# Dashboard com dados simulados (sem CSVs reais)
make demo
```

---

## Docker

### Subir tudo junto (API + Frontend + Infraestrutura)

```bash
docker-compose up --build
```

Serviços disponíveis após subir:

| Serviço | URL |
|---|---|
| API REST | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Dashboard Dash | http://localhost:5000 |
| Frontend React | http://localhost:5174 |
| LocalStack | http://localhost:4566 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6380 |
| MongoDB | localhost:27017 |

### Subir apenas infraestrutura (para dev local)

```bash
docker-compose up -d postgres redis mongodb localstack
```

### Comandos úteis

```bash
# Ver logs em tempo real
docker-compose logs -f api
docker-compose logs -f web

# Reiniciar um serviço
docker-compose restart api

# Parar e remover volumes
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache
```

---

## Testes

```bash
# Instalar dependências de teste
pip install -r requirements-dev.txt

# Rodar todos os testes com cobertura
make test
# ou: pytest tests/ -v --cov=src --cov-report=term-missing

# Rodar um módulo específico
pytest tests/test_inference.py -v

# Lint
make lint
```

**48 testes unitários** cobrem: inferência ML, scoring NLP, construção do grafo, roteamento Dijkstra, feature engineering, scrapers, loaders e API.

---

## Estrutura do Projeto

```
streetsat/
├── src/
│   ├── core/
│   │   ├── config.py          # Variáveis de ambiente e paths
│   │   ├── constants.py       # Labels, penalidades, features, keywords NLP
│   │   └── exceptions.py      # Exceções customizadas
│   ├── data/
│   │   ├── artesp_loader.py   # Lê CSV ARTESP (utf-8-sig, sep=;)
│   │   ├── data_cleaner.py    # Limpeza e normalização
│   │   └── feature_engineering.py  # 15 features + label de risco
│   ├── ml/
│   │   ├── inference.py       # RiskPredictor singleton + predict_segment
│   │   └── scoring.py         # enrich_score_with_nlp
│   ├── nlp/
│   │   ├── comprehend_client.py  # AWS Comprehend
│   │   └── local_nlp.py         # Fallback por dicionário PT-BR
│   ├── routing/
│   │   ├── graph_builder.py   # build_graph (NetworkX) com pesos de risco
│   │   └── path_optimizer.py  # Dijkstra + compare_routes
│   ├── api/
│   │   ├── fastapi_app.py     # App principal + Mangum handler Lambda
│   │   └── routes/
│   │       ├── risk_routes.py         # GET /risk/{road}/km/{km}
│   │       ├── occurrences_routes.py  # GET /occurrences
│   │       └── route_routes.py        # POST /route/optimize
│   ├── apis/
│   │   ├── nasa_eonet.py      # Eventos naturais NASA
│   │   └── weather.py         # Clima Open-Meteo / CPTEC
│   ├── scrapers/
│   │   └── artesp_scraper.py  # Ocorrências ARTESP em tempo real
│   ├── alerts/
│   │   ├── alert_factory.py   # Cria payload de alerta
│   │   └── sns_notifier.py    # Publica no SNS
│   ├── db/
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   ├── postgres.py        # SQLAlchemy engine
│   │   └── redis_client.py    # cache_get / cache_set
│   └── utils/
│       ├── geo_utils.py       # Haversine
│       └── logger.py          # Logger estruturado
├── aws/lambda/
│   ├── handler_scraper.py     # Coleta ARTESP + NASA → S3
│   ├── handler_inference.py   # Processa SQS → predição → alerta
│   └── handler_alerts.py      # Envia alertas SNS
├── dashboard/
│   └── app.py                 # Plotly Dash (porta 5000)
├── models/
│   ├── modelo_rf.pkl          # Pipeline scikit-learn serializado
│   ├── encoders.pkl           # LabelEncoders das features categóricas
│   └── model_metadata.json    # Métricas, hiperparâmetros, feature importance
├── scripts/
│   ├── train_model.py         # Treina e salva modelo
│   ├── collect_realtime.py    # Coleta dados em tempo real
│   ├── demo_nlp.py            # Demo do pipeline NLP
│   └── demo_inference.py      # Demo de inferência + roteamento
├── tests/                     # 48 testes unitários (pytest)
├── data/
│   └── ccm-artesp/            # CSV ARTESP (não versionado)
├── Dockerfile                 # Imagem da API Python
├── docker-compose.yml         # Todos os serviços
├── serverless.yml             # Definição das Lambdas
├── Makefile                   # Atalhos de desenvolvimento
├── requirements.txt           # Dependências de produção
├── requirements-dev.txt       # Dependências de teste/lint
└── web/                       # Frontend React (ver web/README.md)
```

---

## Stack Completa

| Categoria | Tecnologia |
|---|---|
| ML | scikit-learn (Random Forest), XGBoost, joblib |
| Dados | Pandas, NumPy, GeoPandas |
| NLP | AWS Comprehend + fallback dicionário PT-BR |
| Roteamento | NetworkX (Dijkstra / A*) |
| API | FastAPI + Uvicorn + Mangum (Lambda) |
| Dashboard | Plotly Dash + Dash Bootstrap Components |
| Bancos | PostgreSQL + Redis + MongoDB |
| Cloud | AWS Lambda, S3, SQS, SNS, CloudWatch |
| Dev Cloud | LocalStack |
| Deploy | Serverless Framework |
| Container | Docker + Docker Compose |

---

*Streetsat — FIAP GS2 2026 | ODS 8 (Trabalho decente), 9 (Indústria e infraestrutura), 11 (Cidades sustentáveis)*
