# Fase 6 — AWS Lambda + Produção

**Objetivo**: Empacotar o pipeline em funções Lambda serverless, configurar infraestrutura como código com Serverless Framework, e garantir que o ambiente local (LocalStack) espelha a produção AWS.

**Estimativa**: 1 dia  
**Output principal**: Pipeline automatizado deployável com `serverless deploy`

---

## Contexto

Esta fase transforma o projeto local em um sistema serverless na AWS. Cada componente vira uma função Lambda disparada por eventos:
- **Scraper Lambda**: cron a cada 5 min → coleta ARTESP + NASA
- **Inference Lambda**: SQS trigger → processa dados coletados → gera scores
- **Alerter Lambda**: SQS trigger → envia alertas SNS para scores críticos
- **API Lambda**: HTTP → expõe endpoints REST (Fase 4)

Em desenvolvimento, LocalStack simula S3, SQS, SNS, CloudWatch e Lambda sem custo.

---

## Tarefas

### 6.1 — Handlers Lambda (`aws/lambda/`)

**`handler_scraper.py`**
- [ ] Função `lambda_handler(event, context)`:
  - Instanciar `ARTESPScraper` e coletar todas as ocorrências
  - Instanciar clientes NASA (POWER, EONET, FIRMS)
  - Consolidar dados em dict serializado
  - Salvar em S3: `s3://streetsat-models-{stage}/realtime/YYYY/MM/DD/HH/data.json`
  - Publicar mensagem na fila SQS `streetsat-inference-{stage}` com S3 key
  - Log no CloudWatch: contagem de ocorrências coletadas, duração total
  - Timeout: 300s, Memory: 512MB

**`handler_inference.py`**
- [ ] Função `lambda_handler(event, context)`:
  - Receber batch de mensagens SQS (até 10 por invocação)
  - Para cada mensagem: ler S3 key → baixar JSON → instanciar `RiskPredictor`
  - Carregar modelo de S3 (`models/modelo_rf.pkl`) se não em memória (warm start)
  - Gerar scores para cada ocorrência
  - Enriquecer com NLP (`LocalNLPClient` — Comprehend opcional em prod)
  - Salvar predições no PostgreSQL (RDS em prod, container local em dev)
  - Publicar ocorrências score=3 na fila `streetsat-alerts-{stage}`
  - Timeout: 60s, Memory: 1024MB

**`handler_alerts.py`**
- [ ] Função `lambda_handler(event, context)`:
  - Receber batch SQS de alertas pendentes
  - Para cada alerta: `SNSNotifier.publish_alert()`
  - Marcar como processado no banco
  - Log: alerta enviado, MessageId, destinatário
  - Timeout: 30s, Memory: 256MB

**`handler_sync_db.py`** (opcional)
- [ ] Função `lambda_handler(event, context)`:
  - Rodar via cron diário (00:00 UTC)
  - Mover ocorrências resolvidas de `occurrences_realtime` para MongoDB (arquivo)
  - Limpar registros com `detected_at` > 7 dias
  - Log de registros movidos/deletados

### 6.2 — Serverless Framework (`serverless.yml`)
- [ ] Usar o template do `STREETSAT_PROMPT_COMPLETO.md` como base
- [ ] Ajustar `runtime: python3.13`
- [ ] Plugin `serverless-python-requirements`: bundling de dependências
- [ ] Plugin `serverless-localstack`: redirect para LocalStack em stage `dev`
- [ ] Recursos:
  - SQS: `scraping-queue`, `inference-queue`, `alerts-queue`
  - S3: `streetsat-models-{stage}`
  - CloudWatch Events para cron do scraper
- [ ] IAM roles mínimos necessários por função (princípio do menor privilégio)

### 6.3 — Setup LocalStack (`scripts/init_localstack.sh`)
- [ ] Script executado automaticamente pelo Docker Compose (`docker-entrypoint-initaws.d`)
- [ ] Criar bucket S3: `awslocal s3 mb s3://streetsat-models-dev`
- [ ] Criar filas SQS: `awslocal sqs create-queue --queue-name streetsat-scraping-dev`
- [ ] Criar tópico SNS: `awslocal sns create-topic --name streetsat-alerts-dev`
- [ ] Upload do modelo para S3 local: `awslocal s3 cp models/modelo_rf.pkl s3://streetsat-models-dev/`

### 6.4 — Docker Compose Completo (`docker-compose.yml`)
- [ ] Usar o template do `STREETSAT_PROMPT_COMPLETO.md`
- [ ] Adicionar serviço `app` (descomentar e ajustar)
- [ ] Healthchecks em todos os serviços
- [ ] Volume compartilhado para modelo ML (evitar re-download a cada start)
- [ ] Network `streetsat-network` para comunicação entre containers

### 6.5 — Dockerfile (`Dockerfile`)
- [ ] Base: `python:3.13-slim`
- [ ] Instalar dependências do sistema: `libpq-dev`, `gcc`
- [ ] Copiar `requirements.txt` e instalar
- [ ] Copiar `src/`, `models/`, `dashboard/`
- [ ] CMD padrão: iniciar API FastAPI + Dashboard
- [ ] `.dockerignore`: excluir `venv/`, `*.pyc`, `data/raw/`, `.env*`, `docs/datatran/`

### 6.6 — Makefile
```makefile
install:        # pip install -r requirements.txt
train:          # python scripts/train_model.py
collect:        # python scripts/collect_realtime.py
demo:           # python scripts/demo_dashboard.py
api:            # uvicorn src.api.fastapi_app:app --reload
dashboard:      # python dashboard/app.py
docker-up:      # docker-compose up -d
docker-down:    # docker-compose down -v
deploy-dev:     # serverless deploy --stage dev
deploy-prod:    # serverless deploy --stage prod
test:           # pytest tests/ -v --cov=src
lint:           # black src/ && isort src/ && flake8 src/
```

### 6.7 — Configuração de Logging CloudWatch (`src/utils/logger.py`)
- [ ] `structlog` configurado para output JSON
- [ ] Campos padrão: `timestamp`, `level`, `service`, `function_name`, `request_id`
- [ ] Em Lambda: usar `aws_lambda_powertools.logging.Logger` (opcional)
- [ ] Em dev: output legível (colored console)

### 6.8 — Variáveis de Ambiente (`.env.example`)
- [ ] Todos os campos obrigatórios documentados com tipo e exemplo
- [ ] Seções: `Database`, `Redis`, `RabbitMQ`, `AWS`, `NASA APIs`, `Feature Flags`, `Logging`
- [ ] `.env.local` criado como cópia de `.env.example` com valores de dev

### 6.9 — CI/CD (`.github/workflows/ci.yml`)
- [ ] Trigger: push em `main`/`dev`, PR para `main`
- [ ] Jobs:
  - `lint`: black, isort, flake8
  - `test`: pytest com coverage ≥ 70%
  - `build`: docker build (verifica que Dockerfile compila)
- [ ] Usar `actions/cache` para cache de pip

### 6.10 — Documentação (`docs/`)
- [ ] `docs/README.md`: overview do projeto, badges CI, screenshot do dashboard
- [ ] `docs/ARCHITECTURE.md`: diagrama textual das camadas + fluxo de dados
- [ ] `docs/DEPLOYMENT.md`: passo-a-passo local (Docker) e produção (AWS)
- [ ] `docs/API.md`: endpoints, request/response com exemplos curl
- [ ] `docs/MODELS.md`: features usadas, métricas, versões do modelo

---

## Fluxo de Dados em Produção

```
CloudWatch Events (cron 5min)
        ↓
Lambda: handler_scraper
        ↓ (salva JSON no S3)
        ↓ (publica mensagem no SQS inference-queue)
Lambda: handler_inference (SQS trigger)
        ↓ (lê modelo do S3)
        ↓ (salva predições no RDS PostgreSQL)
        ↓ (publica score=3 no SQS alerts-queue)
Lambda: handler_alerts (SQS trigger)
        ↓
        SNS → SMS/Email para operadores
        
Dashboard Dash (Fargate ou EC2)
        ↓ (polling REST API a cada 5min)
        API Lambda (HTTP)
        ↓ (lê do PostgreSQL + Redis ElastiCache)
```

---

## Entregáveis da Fase 6

| Arquivo | Descrição |
|---------|-----------|
| `aws/lambda/handler_scraper.py` | Lambda de coleta |
| `aws/lambda/handler_inference.py` | Lambda de inferência |
| `aws/lambda/handler_alerts.py` | Lambda de alertas |
| `serverless.yml` | IaC Serverless Framework |
| `docker-compose.yml` | Stack local completa |
| `Dockerfile` | Imagem da aplicação |
| `Makefile` | Comandos utilitários |
| `.github/workflows/ci.yml` | Pipeline CI/CD |
| `docs/` | Documentação completa |

---

## Critérios de Aceite

- [ ] `make docker-up` sobe todos os containers sem erro
- [ ] `serverless deploy --stage dev` deploya em LocalStack sem erro
- [ ] `serverless invoke local -f scraper` executa e salva dados no S3 local
- [ ] `make test` passa com coverage ≥ 70%
- [ ] `make lint` passa sem erros
- [ ] `docker build .` compila sem erro
- [ ] Documentação suficiente para um novo desenvolvedor rodar o projeto em < 30 min
