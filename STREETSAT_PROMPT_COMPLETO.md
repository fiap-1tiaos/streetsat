# STREETSAT — Prompt Completo de Desenvolvimento

## 📍 CONTEXTO DO PROJETO

### Nome & Identidade
- **Nome**: Streetsat
- **Tagline**: Monitoramento inteligente de rotas via satélite e IA
- **Objetivo**: Detectar riscos em tempo real em rodovias brasileiras usando dados de satélite, histórico de acidentes e inteligência artificial — para alertar motoristas e logísticas de risco iminente antes de chegar no local.

### ODS Atendidos
- **ODS 9** (Indústria, Inovação e Infraestrutura) — infraestrutura logística resiliente
- **ODS 11** (Cidades e Comunidades Sustentáveis) — segurança nas vias urbanas e regionais
- **ODS 8** (Trabalho Decente e Crescimento Econômico) — proteção de vidas e produtividade

### Contexto Educacional
- **Instituição**: FIAP (Faculdade de Informática e Administração Paulista)
- **Disciplina**: Global Solution 2 (GS2) — 2º semestre, curso de IA
- **Prazo**: até 09/06/2026
- **Equipe**: 3 a 5 integrantes
- **Pontuação**: até 20 pontos por disciplina
- **Requisitos Obrigatórios**: ML, Cloud AWS, APIs cognitivas, Pipeline de dados

---

## 🏗️ ARQUITETURA TÉCNICA

### Camada 1: Scoring de Risco (ML Supervisionado)
**Propósito**: Recebe dados de eventos (satélite, acidentes históricos, clima) e retorna um score de risco 0–3 por trecho de rota.

**Modelo**: Random Forest ou Gradient Boosting (scikit-learn / XGBoost)

**Input Features**:
- Taxa histórica de acidentes graves por KM (PRF)
- Frequência de acidentes por horário
- Tipo de pista (simples/dupla) e traçado (reta/curva/aclive)
- Condição meteorológica atual (NASA POWER)
- Fase do dia, dia da semana, feriado
- Eventos naturais ativos próximos (NASA EONET — distância ao foco de incêndio, eventos de tempestade)
- Ocorrências ativas na rota (ARTESP — tipo de bloqueio, criticidade)
- Variação de tempo de percurso em tempo real (ARTESP)
- Intensidade de precipitação e velocidade do vento (NASA POWER)

**Output**: Score 0–3 (Livre / Atenção / Alto / Crítico)

### Camada 2: Enriquecimento com NLP (AWS Comprehend)
**Propósito**: Processar textos de ocorrências da ARTESP e boletins de defesa civil para extrair entidades, severidade e contexto semântico que complementa o score ML.

**Tarefas**:
- Detectar entidades (localidade, tipo de evento, tipos de veículo)
- Análise de sentimento / severidade (NEGATIVE = crítico)
- Extração de palavras-chave (vítimas, bloqueio, desvio)

**Output**: Enriquecimento do score com contexto textual

### Camada 3: Roteamento Adaptativo
**Propósito**: Usar os scores de risco como pesos dinâmicos em um grafo de rotas para sugerir alternativas seguras.

**Algoritmo**: Dijkstra / A* com pesos adaptativos
**Biblioteca**: NetworkX + OpenRouteService API

**Output**: Rota otimizada que minimiza exposição a risco

---

## 📊 DADOS — FONTES E CARACTERÍSTICAS

### 1. Dados Históricos — Treino do Modelo

#### PRF (Polícia Rodoviária Federal) — 2007 a 2026
- **Formato**: CSV
- **Localização**: dados.gov.br (acesso público) ou arquivo fornecido pelo grupo
- **Registros**: ~700.000+ acidentes georreferenciados
- **Colunas principais**:
  - `data_inversa`, `dia_semana`, `horario`
  - `br`, `km`, `municipio`, `uf`
  - `causa_acidente`, `tipo_acidente`, `classificacao_acidente`
  - `condicao_metereologica`, `fase_dia`, `sentido_via`, `tracado_via`, `tipo_pista`, `uso_solo`
  - `pessoas`, `mortos`, `feridos_leves`, `feridos_graves`, `ilesos`, `feridos`
  - `latitude`, `longitude`
- **Label para ML**: Derivado de `mortos` e `feridos_graves`
  - 0 = Livre (sem vítimas)
  - 1 = Atenção (feridos leves)
  - 2 = Alto (feridos graves)
  - 3 = Crítico (mortos)

Arquivos de exemplo para treinamento em: @docs/datatran/.*csv

### 2. Dados em Tempo Real — Inferência

#### ARTESP (Agência de Transporte do Estado de SP)
**URL**: https://ccm.artesp.sp.gov.br

**Fontes**:
1. **Ocorrências Ativas**: `/rodovias/ocorrencias`
   - Código único (OC-xxxxx)
   - Tipo (acidente, ocorrência, obra)
   - Concessíonária
   - Localização (rodovia, KM, município)
   - Sentido
   - Interdição (Bloqueio Total / Bloqueio Parcial / Livre)
   - Criticidade
   - Narrativa detalhada (texto livre)
   - Status (Ativa / Finalizada)
   - Timestamp
   - Detalhes da ocorrencia: `rodovias/oc19500` (oc19500 código da ocorrencia encontrado no link `Detalhes` da tabela)
   - Paginação: `rodovias/ocorrencias?page=2` (mudar `page=` com o número da página; Ele não dá página não encontrada e nem retorna para a inicial quando não tiver mais. Verificar nos botões de passagem de página a página atual, pois contém o texto. Ex: `Página 1 de 10`)

2. **Intervenções Viárias Relevantes**: `/rodovias/intervencoes-viarias`
   - Rodovia + KM inicial/final
   - Término previsto
   - Faixas bloqueadas
   - Recursos mobilizados
   - Observações

3. **Tempos de Percurso**: `/rodovias/tempos-percurso`
   - Trecho específico
   - Tempo real vs tempo livre
   - Variação percentual

**Método de Coleta**: Web scraping (BeautifulSoup + requests)
- A página carrega conteúdo completo (sem XHR/fetch)
- Estrutura HTML: tabelas com rows de ocorrências
- Frequência de coleta: a cada 5 minutos (cron AWS Lambda)

### 3. Dados Climáticos e Ambientais — NASA APIs

#### NASA POWER API
- **URL**: https://power.larc.nasa.gov/api/v1/
- **Docs**: https://power.larc.nasa.gov/api/pages/
- **Dados**: Precipitação, temperatura, velocidade do vento, radiação solar (histórico + atual)
- **Resolução**: Ponto (lat, lon)
- **Frequência**: Diária, acesso retroativo

#### NASA EONET (Earth Observatory Natural Event Tracker)
- **URL**: https://eonet.gsfc.nasa.gov/api/v3/
- **Docs**: https://eonet.gsfc.nasa.gov/docs/v3
- **Eventos**: Incêndios, tempestades severas, inundações, etc.
- **Informação**: Tipo, localização (lat/lon), área afetada, timestamp
- **Relevância**: Eventos naturais que podem fechar rodovias

#### NASA FIRMS (Fire Information for Resource Management System)
- **URL**: https://firms.modaps.eosdis.nasa.gov/api/area/
- **Dados**: Focos de incêndio ativos com FRP (Fire Radiative Power)
- **Informação**: Intensidade, localização, timestamp
- **Frequência**: Quase tempo real (< 3 horas após detecção)

**API Key NASA**: Gratuita via https://api.nasa.gov/

---

## 🛠️ STACK TÉCNICO — PROFISSIONAL & ROBUSTO

### Backend & ML
- **Linguagem**: Python 3.13+
- **ML**: scikit-learn (Random Forest), XGBoost, joblib (serialização)
- **Manipulação de dados**: Pandas, NumPy, Polars (performance)
- **Geoespacial**: Shapely, GeoPy, NetworkX, Geopandas
- **Web scraping**: BeautifulSoup4, requests, httpx (async)
- **NLP & AWS**: boto3 (AWS SDK), botocore
- **Logging & Monitoring**: structlog, python-json-logger, sentry-sdk

### Banco de Dados & Cache (Otimizados para IA)
- **PostgreSQL 15+** + **pgvector** (armazenar embeddings, features, modelos)
  - Tabelas: `accidents_historical`, `occurrences_realtime`, `model_metadata`, `predictions_cache`
  - Índices: HNSW/IVFFlat para busca rápida de similaridade
- **Redis 7+** (cache distribuído + fila)
  - Cache: Resultados de predição, dados de ARTESP/NASA
  - Sessões: Usuários do dashboard
  - Filas: Tarefas pendentes (scraping, inferência)
- **MongoDB 6+** (armazenamento flexível, time-series)
  - Coleção: `raw_events` (logs de ocorrências brutos)
  - Coleção: `predictions` (histórico de predições para análise)
  - TTL indexes: limpeza automática de dados antigos

### Sistema de Fila & Processamento Assíncrono
- **RabbitMQ / AWS SQS** (producer-consumer)
  - Queue: `scraping_tasks` (coleta ARTESP, NASA)
  - Queue: `inference_tasks` (predições em batch)
  - Queue: `alerts_notifications` (SNS/SMS)
- **Celery** (task queue distribuído com RabbitMQ backend)
  - Scheduler: Tarefas recorrentes (5 min, 1h, 1dia)
  - Retry logic: Falhas de coleta/API
- **Alternativa**: AWS SQS + Lambda para serverless puro

### Cloud & DevOps (Local + Produção)
- **Local Development**: LocalStack (simula AWS sem custo)
  - S3, Lambda, CloudWatch, SQS, DynamoDB, Logs
  - ❌ Comprehend: usar mock local com feature flag ou AWS real em dev
- **Produção**: AWS (Lambda, S3, SQS, CloudWatch, SNS, RDS)
- **Infrastructure as Code**: Serverless Framework
  - Arquivo: `serverless.yml`
  - Deploys automáticos, versionamento, rollback
- **Containerização**: Docker + Docker Compose
  - Serviços locais: PostgreSQL, Redis, RabbitMQ, LocalStack, Minio (S3 local)

### Frontend & Visualização
- **Dashboard**: Plotly Dash + Flask (async views)
- **Mapa interativo**: Folium + Leaflet.js (mapbox style)
- **Real-time updates**: WebSockets (Socket.IO / FastAPI)
- **Hospedagem local**: Flask dev server, em prod: Gunicorn + Nginx

### Versionamento & Estrutura (PROFISSIONAL)
- **Git**: GitHub com conventional commits, branch strategy (main/dev/feature/*)
- **CI/CD**: GitHub Actions (testes, linting, security scan, deploys)
- **Docker**: Compose para ambiente local completo
- **Code Quality**: Black, isort, flake8, mypy, pylint
- **Testing**: pytest + coverage + factories (factory-boy)

### Estrutura de Pastas (Pronta para Produção)
```
streetsat/
│
├── .github/
│   └── workflows/
│       ├── ci.yml (tests + linting)
│       ├── deploy-dev.yml
│       └── deploy-prod.yml
│
├── .docker/
│   ├── Dockerfile (app)
│   ├── Dockerfile.postgres (PostgreSQL + pgvector)
│   └── docker-compose.yml (dev stack completo)
│
├── .localstack/
│   ├── init-aws.sh (setup LocalStack)
│   └── docker-compose-localstack.yml
│
├── infrastructure/
│   ├── serverless.yml (Serverless Framework config)
│   ├── terraform/ (opcional, IaC alternativa)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── aws/
│       ├── iam-roles.json
│       └── lambda-policies.json
│
├── src/
│   ├── __init__.py
│   │
│   ├── core/
│   │   ├── config.py (environment, logging config)
│   │   ├── constants.py
│   │   └── exceptions.py (custom exceptions)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── ml_model.py (Random Forest training)
│   │   ├── model_registry.py (versionamento de modelos)
│   │   └── model_inference.py (predições)
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── postgres.py (SQLAlchemy models, pgvector)
│   │   ├── mongodb.py (Motor async driver)
│   │   ├── redis_client.py (conexão + cache utilities)
│   │   └── migrations/ (Alembic)
│   │       └── alembic.ini
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── prf_loader.py (carregar e processar CSV da PRF)
│   │   ├── data_cleaner.py (limpeza de dados)
│   │   ├── feature_engineering.py (transformações)
│   │   └── data_validator.py (schema validation com pydantic)
│   │
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── artesp_scraper.py (BeautifulSoup)
│   │   ├── base_scraper.py (classe base com retry logic)
│   │   └── scraper_tasks.py (Celery tasks)
│   │
│   ├── apis/
│   │   ├── __init__.py
│   │   ├── nasa_power.py (NASA POWER API)
│   │   ├── nasa_eonet.py (NASA EONET API)
│   │   ├── nasa_firms.py (NASA FIRMS API)
│   │   ├── api_client.py (base HTTP client com cache)
│   │   └── api_tasks.py (Celery tasks)
│   │
│   ├── nlp/
│   │   ├── __init__.py
│   │   ├── comprehend_client.py (AWS Comprehend wrapper)
│   │   ├── local_nlp.py (fallback/mock para comprehend)
│   │   └── nlp_tasks.py (Celery tasks)
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── scoring.py (scoring de risco 0–3)
│   │   ├── inference.py (predições em tempo real)
│   │   └── inference_tasks.py (Celery tasks)
│   │
│   ├── routing/
│   │   ├── __init__.py
│   │   ├── graph_builder.py (construir grafo de rotas)
│   │   ├── path_optimizer.py (Dijkstra/A*)
│   │   └── route_tasks.py (Celery tasks)
│   │
│   ├── cache/
│   │   ├── __init__.py
│   │   ├── redis_cache.py (wrapper Redis com TTL)
│   │   └── cache_keys.py (schema de chaves)
│   │
│   ├── queue/
│   │   ├── __init__.py
│   │   ├── producer.py (enviar tarefas para fila)
│   │   ├── consumer.py (processar tarefas)
│   │   └── tasks.py (definições de tasks Celery)
│   │
│   ├── alerts/
│   │   ├── __init__.py
│   │   ├── sns_notifier.py (AWS SNS)
│   │   ├── sqs_publisher.py (AWS SQS)
│   │   └── alert_factory.py (gerar alertas)
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── occurrences.py (Pydantic models)
│   │   ├── predictions.py
│   │   ├── routes.py
│   │   └── alerts.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logger.py (structured logging)
│   │   ├── geo_utils.py (lat/lon helpers)
│   │   ├── time_utils.py (timezone handling)
│   │   └── decorators.py (retry, cache, timing)
│   │
│   └── api/
│       ├── __init__.py
│       ├── fastapi_app.py (ou Flask)
│       ├── routes/
│       │   ├── __init__.py
│       │   ├── risk_routes.py (GET /risk/br/:br/km/:km)
│       │   ├── occurrences_routes.py (GET /occurrences)
│       │   └── route_routes.py (POST /route/optimize)
│       └── middleware/
│           ├── __init__.py
│           ├── auth.py (API key validation)
│           └── error_handler.py (global error handling)
│
├── dashboard/
│   ├── __init__.py
│   ├── app.py (Plotly Dash + Gunicorn)
│   ├── config.py (dash config)
│   ├── callbacks.py (dash callbacks)
│   ├── layouts/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── risk_map.py
│   │   ├── statistics.py
│   │   └── alerts.py
│   └── assets/
│       ├── style.css
│       └── logo.png
│
├── aws/
│   ├── lambda/
│   │   ├── handler_scraper.py (Lambda: scraping + coleta)
│   │   ├── handler_inference.py (Lambda: predições)
│   │   ├── handler_alerts.py (Lambda: processar alertas)
│   │   └── handler_sync_db.py (Lambda: sincronizar BD)
│   ├── layers/
│   │   └── requirements/ (Lambda layers: deps compartilhadas)
│   └── cloudwatch/
│       ├── event_rules.json (cron triggers)
│       └── log_groups.json
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py (pytest fixtures, mocks)
│   ├── unit/
│   │   ├── test_ml_model.py
│   │   ├── test_data_pipeline.py
│   │   ├── test_scrapers.py
│   │   ├── test_nlp.py
│   │   └── test_routing.py
│   ├── integration/
│   │   ├── test_db_postgres.py
│   │   ├── test_redis_cache.py
│   │   ├── test_api_endpoints.py
│   │   └── test_end_to_end.py
│   └── fixtures/
│       ├── sample_data.py
│       ├── mock_artesp.py
│       └── mock_nasa_api.py
│
├── data/
│   ├── raw/
│   │   ├── prf_acidentes_2007_2026.csv
│   │   └── nasa_historical/
│   ├── processed/
│   │   └── features_engineered.parquet
│   └── schemas/
│       └── table_schemas.json
│
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md (diagrama e explicação)
│   ├── API.md (OpenAPI spec)
│   ├── DEPLOYMENT.md (local + prod)
│   ├── DATABASE.md (schema, pgvector, índices)
│   ├── MODELS.md (ML models, versions)
│   ├── DEVELOPMENT.md (setup local, debugging)
│   └── CONTRIBUTING.md (código style, commits)
│
├── scripts/
│   ├── setup_localstack.sh (init LocalStack)
│   ├── setup_postgres.sh (init DB, migrations)
│   ├── seed_data.py (carregar PRF, histórico)
│   ├── train_model.py (treinar offline)
│   ├── deploy_local.sh (docker-compose up)
│   └── deploy_prod.sh (serverless deploy)
│
├── .env.example (variáveis de ambiente)
├── .env.local (dev — não commitar)
├── .dockerignore
├── .gitignore
├── docker-compose.yml (completo: postgres, redis, rabbitmq, localstack)
├── docker-compose.prod.yml (reduzido, AWS real)
├── Dockerfile
├── requirements.txt
├── requirements-dev.txt
├── setup.py
├── pyproject.toml (configuração moderna)
├── Makefile (comandos úteis: make test, make deploy, etc)
└── README.md
```

---

## 🏗️ AMBIENTE LOCAL COM LOCALSTACK + SERVERLESS

### O que é LocalStack?
LocalStack é um emulador local de AWS que permite desenvolver e testar contra serviços AWS **sem custos**. Para Streetsat, usaremos:
- ✅ S3 (armazenar modelos, dados)
- ✅ Lambda (funções serverless)
- ✅ SQS (filas de tarefas)
- ✅ CloudWatch (logs e métricas)
- ✅ DynamoDB (opcional, para cache distribuído)
- ❌ Comprehend (usar mock local ou AWS real em dev)

### Serverless Framework
Serverless Framework gerencia toda a infraestrutura como código. Arquivo `serverless.yml` define:
- Funções Lambda
- Variáveis de ambiente
- Triggers (SQS, CloudWatch Events)
- Permissões IAM
- Layers (dependências)

**Vantagem**: Um único `serverless deploy` coloca tudo em produção.

### Setup Inicial — Docker Compose

#### 1. Arquivo `docker-compose.yml` (Dev Stack Completo)
```yaml
version: '3.8'

services:
  # PostgreSQL 15 + pgvector para armazenar embeddings e features
  postgres:
    image: pgvector/pgvector:pg15-latest
    container_name: streetsat-postgres
    environment:
      POSTGRES_USER: streetsat
      POSTGRES_PASSWORD: streetsat_dev
      POSTGRES_DB: streetsat_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init_postgres.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U streetsat"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 7 para cache + fila de tarefas
  redis:
    image: redis:7-alpine
    container_name: streetsat-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ para fila distribuída + Celery
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: streetsat-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB para logs de eventos brutos e histórico de predições
  mongodb:
    image: mongo:7-alpine
    container_name: streetsat-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin_dev
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # LocalStack para simular AWS (S3, Lambda, SQS, CloudWatch)
  localstack:
    image: localstack/localstack:latest
    container_name: streetsat-localstack
    ports:
      - "4566:4566"   # Gateway
      - "4571:4571"   # Minio S3
    environment:
      SERVICES: s3,lambda,sqs,cloudwatch,logs,ec2,iam,events,secretsmanager
      DEBUG: 0
      DATA_DIR: /tmp/localstack/data
      LAMBDA_EXECUTOR: docker-reuse
      DOCKER_HOST: unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - localstack_data:/tmp/localstack
      - ./scripts/init_localstack.sh:/docker-entrypoint-initaws.d/init-aws.sh
    healthcheck:
      test: ["CMD", "awslocal", "s3", "ls"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Minio como alternativa S3 local (opcional)
  minio:
    image: minio/minio:latest
    container_name: streetsat-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/minio_data
    command: server /minio_data --console-address ":9001"

  # Streetsat App (será adicionado após construir a imagem)
  # app:
  #   build: .
  #   container_name: streetsat-app
  #   depends_on:
  #     postgres:
  #       condition: service_healthy
  #     redis:
  #       condition: service_healthy
  #     rabbitmq:
  #       condition: service_healthy
  #   environment:
  #     DATABASE_URL: postgresql://streetsat:streetsat_dev@postgres:5432/streetsat_db
  #     REDIS_URL: redis://redis:6379
  #     RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
  #     AWS_ENDPOINT_URL: http://localstack:4566
  #   ports:
  #     - "5000:5000"
  #   volumes:
  #     - .:/app

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  mongodb_data:
  localstack_data:
  minio_data:

networks:
  default:
    name: streetsat-network
```

#### 2. Iniciar Ambiente
```bash
# Criar e iniciar todos os containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar
docker-compose down -v
```

### Configuração Serverless Framework

#### 1. Instalar
```bash
npm install -g serverless
npm install serverless-python-requirements serverless-localstack --save-dev
```

#### 2. Arquivo `serverless.yml`
```yaml
service: streetsat

provider:
  name: aws
  runtime: python3.13
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  environment:
    DATABASE_URL: postgresql://streetsat:streetsat_dev@postgres:5432/streetsat_db
    REDIS_URL: redis://redis:6379
    RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
    S3_BUCKET: streetsat-models-${self:provider.stage}
    COMPREHEND_ENABLED: ${self:provider.stage != 'dev'}
  
  # LocalStack para dev
  httpApi:
    cors: true

functions:
  # Lambda: Coletar dados ARTESP + NASA
  scraper:
    handler: aws/lambda/handler_scraper.lambda_handler
    timeout: 300
    memory: 512
    environment:
      TASK_QUEUE: scraping_tasks
    events:
      - schedule:
          rate: cron(*/5 * * * ? *)  # A cada 5 minutos
          enabled: true
    layers:
      - !Ref PythonRequirementsLambdaLayer

  # Lambda: Executar inferência ML
  inference:
    handler: aws/lambda/handler_inference.lambda_handler
    timeout: 60
    memory: 1024
    environment:
      MODEL_BUCKET: streetsat-models-${self:provider.stage}
      PREDICTIONS_TABLE: streetsat-predictions-${self:provider.stage}
    events:
      - sqs:
          arn: !GetAtt InferenceQueue.Arn
          batchSize: 10
          batchWindow: 5
    layers:
      - !Ref PythonRequirementsLambdaLayer

  # Lambda: Gerar e enviar alertas
  alerter:
    handler: aws/lambda/handler_alerts.lambda_handler
    timeout: 30
    memory: 256
    events:
      - sqs:
          arn: !GetAtt AlertQueue.Arn
          batchSize: 5
    layers:
      - !Ref PythonRequirementsLambdaLayer

  # API REST: Endpoints
  api:
    handler: src/api/fastapi_app.handler
    timeout: 30
    memory: 512
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
      - httpApi:
          path: /
          method: ANY
    layers:
      - !Ref PythonRequirementsLambdaLayer

# Recursos AWS
resources:
  Resources:
    # SQS para tarefas de scraping
    ScrapingQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: streetsat-scraping-${self:provider.stage}
        VisibilityTimeout: 300
        MessageRetentionPeriod: 86400

    # SQS para tarefas de inferência
    InferenceQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: streetsat-inference-${self:provider.stage}
        VisibilityTimeout: 60

    # SQS para alertas
    AlertQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: streetsat-alerts-${self:provider.stage}
        VisibilityTimeout: 30

    # S3 bucket para modelos e dados
    ModelBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: streetsat-models-${self:provider.stage}
        VersioningConfiguration:
          Status: Enabled

    # DynamoDB para cache de predições (opcional)
    PredictionsCache:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: streetsat-predictions-${self:provider.stage}
        AttributeDefinitions:
          - AttributeName: prediction_id
            AttributeType: S
          - AttributeName: timestamp
            AttributeType: N
        KeySchema:
          - AttributeName: prediction_id
            KeyType: HASH
          - AttributeName: timestamp
            KeyType: RANGE
        BillingMode: PAY_PER_REQUEST
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true

# Plugins
plugins:
  - serverless-python-requirements
  - serverless-localstack

# LocalStack específico
localstack:
  debug: true
  stages:
    - dev
```

#### 3. Deploy Local (com LocalStack)
```bash
# Deploy em dev (LocalStack)
serverless deploy --stage dev

# Deploy em prod (AWS real)
serverless deploy --stage prod --aws-profile production

# Invocar função local
serverless invoke local -f scraper --stage dev
```

### Variáveis de Ambiente (`.env.local`)
```bash
# Desenvolvimento Local
ENV=development
DEBUG=true

# Banco de Dados
DATABASE_URL=postgresql://streetsat:streetsat_dev@localhost:5432/streetsat_db
DATABASE_POOL_SIZE=5
DATABASE_ECHO=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL=3600

# RabbitMQ / Celery
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
CELERY_BROKER_URL=${RABBITMQ_URL}
CELERY_RESULT_BACKEND=redis://localhost:6379

# MongoDB
MONGODB_URL=mongodb://admin:admin_dev@localhost:27017/

# AWS (LocalStack)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
S3_BUCKET=streetsat-models-dev

# APIs
NASA_API_KEY=<SEU_NASA_API_KEY>
COMPREHEND_ENABLED=false

# Logging
LOG_LEVEL=DEBUG
LOG_FORMAT=json

# Dashboard
DASH_PORT=5000
DASH_HOST=0.0.0.0
```

---

## 🗄️ BANCOS DE DADOS — OTIMIZADOS PARA IA

### 1. PostgreSQL 15 + pgvector (Banco Principal)

**Propósito**: Armazenar dados históricos, features de ML, embeddings, metadados de modelos.

**Extensões**:
- **pgvector**: Armazenar e buscar embeddings (vetores) em O(1) com índices HNSW/IVFFlat
- **timescaledb** (opcional): Otimizar séries temporais (eventos por hora)

**Tabelas Principais**:

```sql
-- Tabela histórica de acidentes PRF
CREATE TABLE accidents_historical (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    day_of_week INT,
    hour INT,
    br_number INT,
    km DECIMAL(8, 3),
    municipio VARCHAR(100),
    uf CHAR(2),
    cause VARCHAR(200),
    type VARCHAR(100),
    weather_condition VARCHAR(50),
    deaths INT DEFAULT 0,
    severe_injuries INT DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    risk_label INT, -- (0=free, 1=attention, 2=high, 3=critical)
    features_vector vector(50), -- Embeddings para busca por similaridade
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_date (date),
    INDEX idx_br_km (br_number, km),
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_features USING ivfflat (features_vector vector_cosine_ops)
);

-- Tabela de ocorrências em tempo real (ARTESP)
CREATE TABLE occurrences_realtime (
    id VARCHAR(20) PRIMARY KEY, -- OC19499
    road VARCHAR(10),
    km DECIMAL(8, 3),
    municipio VARCHAR(100),
    occurrence_type VARCHAR(50),
    interdiction_level INT, -- (0=free, 1=partial, 2=total)
    criticality INT, -- (1=low, 2=medium, 3=high, 4=critical)
    narrative TEXT, -- para NLP
    status VARCHAR(20), -- active, resolved
    detected_at TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    nlp_entities jsonb,
    nlp_sentiment VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_detected (detected_at DESC),
    INDEX idx_road_km (road, km)
);

-- Tabela de predições
CREATE TABLE predictions_cache (
    id BIGSERIAL PRIMARY KEY,
    br_number INT,
    km DECIMAL(8, 3),
    predicted_risk_score INT,
    confidence DECIMAL(3, 2),
    model_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_br_km_time (br_number, km, created_at DESC)
);

-- Tabela de metadados de modelos ML
CREATE TABLE model_registry (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100),
    model_version VARCHAR(20),
    s3_path VARCHAR(255),
    training_date TIMESTAMP,
    accuracy DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    hyperparameters jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (model_name, model_version)
);
```

### 2. Redis 7 (Cache + Fila)

**Propósito**: Cache de predições, sessões, fila de tarefas Celery.

**Estrutura de Chaves**:

```
# Cache de predições (TTL 1 hora)
prediction:br116:km568 → {"score": 2, "confidence": 0.92}

# Cache climático NASA (TTL 12 horas)
weather:lat-23.5:lon-46.6 → {"temp": 28.5, "wind": 15.2}

# Fila de tarefas Celery
celery_queue → [task_1, task_2, ...]

# Lock distribuído
lock:scraper:artesp → "true" (TTL 5 min)
```

**Uso em Python**:
```python
import redis

r = redis.Redis(host='localhost', port=6379)

# SET com TTL
r.setex("prediction:br116:km568", 3600, '{"score": 2}')

# GET
pred = r.get("prediction:br116:km568")

# Fila
r.lpush("scraping_tasks", task_json)
```

### 3. MongoDB 6 (Histórico + Logs Flexíveis)

**Propósito**: Histórico completo de predições, logs brutos de eventos, análise exploratória.

**Coleções**:

```javascript
// Histórico de todas as predições
db.createCollection("predictions_history");
db.predictions_history.createIndex({ timestamp: -1 });
db.predictions_history.createIndex({ br_number: 1, km: 1 });

// Eventos brutos (com TTL de 90 dias)
db.createCollection("raw_events");
db.raw_events.createIndex({ ttl: 1 }, { expireAfterSeconds: 0 });

// Resultados NLP
db.createCollection("nlp_results");
db.nlp_results.createIndex({ occurrence_id: 1 });
```

### Seleção por Caso de Uso

| Caso | BD | Motivo |
|------|---|--------|
| Features + Embeddings ML | PostgreSQL + pgvector | Busca por similaridade, ACID |
| Cache predições (TTL) | Redis | O(1) em memória |
| Histórico exploratório | MongoDB | Schema flexível, TTL nativo |
| Alertas estruturados | PostgreSQL | Queries complexas |
| Fila de tarefas | Redis | Rápido, ordering |

---

## 📈 FASES DE DESENVOLVIMENTO

### Fase 1: Treino do Modelo (Offline) — 3-4 dias
**Objetivo**: Treinar Random Forest com dados históricos da PRF

**Tarefas**:
1. Carregar CSV PRF (dados.gov.br ou arquivo fornecido)
2. Exploração dos dados (EDA — estatísticas, distribuições, correlações)
3. Limpeza (valores nulos, outliers, normalização)
4. Feature engineering (taxa por KM, encoding categórico, agregações temporais)
5. Geração do label de risco (0–3)
6. Divisão treino/teste (80/20)
7. Treino Random Forest com validação cruzada (5-fold)
8. Avaliação (acurácia, precisão, recall, F1, matriz de confusão, ROC-AUC)
9. Feature importance analysis
10. Export do modelo em `modelo_rf.pkl`

**Output**: Modelo treinado + relatório de performance + gráficos de avaliação

---

### Fase 2: Pipeline de Coleta em Tempo Real — 2-3 dias
**Objetivo**: Construir scrapers e integrações com APIs para alimentar o modelo em produção

**Tarefas**:
1. **ARTESP Scraper**:
   - Desenvolver scraper BeautifulSoup para `/rodovias/ocorrencias`
   - Extrair: código, tipo, localização, interdição, criticidade, narrativa
   - Parser de texto (georreferenciação)
   - Salvar em formato estruturado (JSON/CSV)
   - Tratamento de erros e timeouts

2. **NASA APIs**:
   - Integração POWER API (precipitação, vento, temperatura)
   - Integração EONET API (eventos naturais)
   - Integração FIRMS API (focos de incêndio)
   - Cache local para histórico

3. **Orquestração**:
   - Scheduler (APScheduler ou cron)
   - Executar coleta a cada 5 minutos
   - Log estruturado

**Output**: Dados brutos coletados, armazenados em S3 ou banco de dados local

---

### Fase 3: Camada NLP & Enriquecimento — 2 dias
**Objetivo**: Processar textos de ocorrências com AWS Comprehend

**Tarefas**:
1. Configurar credenciais AWS (boto3)
2. Função para chamar AWS Comprehend:
   - Detect Entities (PT-BR)
   - Detect Sentiment
   - Key phrases
3. Mapping de entidades → features do modelo
4. Merge com scores ML
5. Ajuste dinâmico de score baseado em sentimento/severidade

**Output**: Função de enriquecimento integrada ao pipeline

---

### Fase 4: Inferência & Roteamento Adaptativo — 2 dias
**Objetivo**: Usar modelo treinado para gerar scores em tempo real e sugerir rotas seguras

**Tarefas**:
1. Carregar modelo `modelo_rf.pkl`
2. Função de preprocessing (aplicar transformações de treino)
3. Função de predição:
   - Input: features do evento/trecho
   - Output: score 0–3
4. Integração NetworkX:
   - Construir grafo de rodovias brasileiras (OpenRouteService ou dados DNIT)
   - Pesar arestas com scores de risco
   - Algoritmo Dijkstra/A* para encontrar rota segura
5. Comparação rota recomendada vs rota direta (distância vs segurança)

**Output**: Função de roteamento adaptativo

---

### Fase 5: Dashboard & Alertas — 1-2 dias
**Objetivo**: Visualizar dados em tempo real e gerar alertas

**Tarefas**:
1. Dashboard Plotly Dash:
   - Mapa interativo (Folium/Mapbox) com ocorrências e scores
   - Tabela de ocorrências ordenada por severidade
   - Gráficos de distribuição (horário, tipo, causa)
   - Filtros (estado, rodovia, data)
2. Sistema de alertas:
   - SNS para SMS/e-mail quando risco > 2
   - Webhook para integração com apps de motorista
3. Endpoints REST simples (Flask):
   - GET `/risk/br/:br_number/km/:km` → retorna score
   - POST `/route/optimize` → retorna rota segura

**Output**: Dashboard funcional + alertas ativos

---

### Fase 6: AWS Lambda & Produção — 1 dia
**Objetivo**: Deploy do pipeline em serverless

**Tarefas**:
1. Função Lambda para coleta (cron 5 min):
   - Chamar scrapers + APIs
   - Salvar em S3
   - Log em CloudWatch
2. Função Lambda para inferência:
   - Carregar modelo de S3
   - Processar dados coletados
   - Gerar scores e alertas
   - SNS notification
3. CloudWatch Events para agendamento
4. IAM roles & permissões

**Output**: Pipeline automatizado em produção

---

## 📋 REQUISITOS DO GS2 FIAP

- ✅ **ML**: Random Forest (regressão/classificação)
- ✅ **Cloud AWS**: S3, Lambda, SNS, CloudWatch
- ✅ **APIs Cognitivas**: AWS Comprehend (NLP)
- ✅ **Pipeline de Dados**: Coleta → Limpeza → Feature Eng. → ML → Output
- ✅ **Visão Computacional** (OPCIONAL): Poderia usar YOLO em imagens Sentinel-2 para confirmar obstrução visual
- ✅ **Interdisciplinaridade**: ML + Cloud + NLP + Geoespacial
- ✅ **Vídeo Demonstrativo**: ≤ 5 min, com "QUERO CONCORRER" no início (se optar pelo pódio)
- ✅ **PDF de Entrega**: Nomes completos na 1ª página, estrutura (Intro → Dev → Resultados → Conclusões), links do vídeo (YouTube não listado) e GitHub (README)

---

## 🎯 OBJETIVOS ESPECÍFICOS DO MVP

### Mínimo Viável (até 09/06)
1. Modelo ML treinado e testado com dados PRF
2. Scraper ARTESP funcional (coleta em tempo real)
3. Integração NASA APIs (POWER + EONET) 
4. Scoring de risco funcionando (0–3)
5. Dashboard básico com mapa e tabela
6. Alertas SNS em teste
7. Documentação e vídeo

### Diferencial (se tempo permitir)
- AWS Comprehend para NLP em textos de ocorrências
- Roteamento adaptativo com NetworkX
- YOLO para detecção de obstrução em imagens satélite
- Integração Waze API para anomalia detection

---

## 🚀 COMO COMEÇAR COM CLAUDE CODE CLI

### Pré-requisitos
```bash
# Instalar Claude Code CLI
curl -O https://claude.ai/code-install

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # ou `venv\Scripts\activate` no Windows

# Arquivo CSV da PRF (simulado ou real)
# Colocar em: data/raw/prf_acidentes.csv
```

### Comando para Claude Code
```bash
claude-code start \
  --project "Streetsat" \
  --description "Monitoramento de rotas via satélite + ML + AWS" \
  --stack "python,pandas,sklearn,aws,plotly" \
  --output "streetsat/"
```

### Prompt para Claude Code (copie e cole)
```
Você vai ajudar a desenvolver o Streetsat, um sistema de monitoramento inteligente de rotas brasileiras usando satélites e IA.

Utilize o @STREETSAT_PROMPT_COMPLETO.md para entender o projeto.

Antes de escrever qualquer código, vamos criar uma pasta `.specs` e separar por pastas cada fase (nome das pastas precisam ser em minusculo e separadas por hífen, se necessário), onde cada pasta, terá um TODO.md. Só após que criarmos todas as specs, é que vamos executar.

CONTEXTO:
- Nome: Streetsat
- ODS 9, 11, 8
- FIAP Global Solution 2 (GS2)
- Prazo: 09/06/2026
- Requisitos: ML, AWS, APIs Cognitivas, Pipeline de Dados

DADOS:
1. PRF (2007–2026): CSV com ~700k acidentes, arquivo em @docs/datatran/*.csv
   - Colunas: data, br, km, causa_acidente, tipo_acidente, mortos, feridos_graves, latitude, longitude, etc.
2. ARTESP: Web scraping de https://ccm.artesp.sp.gov.br/rodovias/ocorrencias (ocorrências em tempo real)
3. NASA APIs: POWER, EONET, FIRMS (clima e eventos naturais)

ARQUITETURA:
- Camada 1: Random Forest (scoring de risco 0–3) treinado com PRF
- Camada 2: AWS Comprehend (NLP em narrativas de ocorrências)
- Camada 3: NetworkX (roteamento adaptativo)

FASES:
1. Treino do modelo com PRF
2. Scraper ARTESP + NASA APIs
3. NLP com AWS Comprehend
4. Inferência e roteamento
5. Dashboard Plotly
6. Lambda + produção

STACK: Python, Pandas, Scikit-learn, Boto3 (AWS), Plotly, BeautifulSoup4, NetworkX

ENTREGA:
- PDF (intro, desenvolvimento, resultados, conclusões)
- Vídeo ≤ 5 min (YouTube não listado)
- GitHub com README
- Modelo treinado (modelo_rf.pkl)
- Dashboard funcionando

Comece pela FASE 1: Treino do modelo com PRF. Carregue o CSV, faça EDA, limpe dados, faça feature engineering, treine Random Forest, avalie e exporte o modelo.
```

---

## 📚 Referências & Links Úteis

- **PRF (Dados Abertos)**: https://www.gov.br/prf/pt-br
- **ARTESP**: https://ccm.artesp.sp.gov.br
- **NASA APIs**: https://api.nasa.gov/
- **NASA POWER**: https://power.larc.nasa.gov/
- **NASA EONET**: https://eonet.gsfc.nasa.gov/api/
- **NASA FIRMS**: https://firms.modaps.eosdis.nasa.gov/
- **Scikit-learn Docs**: https://scikit-learn.org/
- **Plotly Dash**: https://dash.plotly.com/
- **AWS Comprehend**: https://docs.aws.amazon.com/comprehend/

---

**Pronto para começar? Vamos de Streetsat!** 🚀
