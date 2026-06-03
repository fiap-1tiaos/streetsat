# Fase 5 — Dashboard Plotly + Sistema de Alertas

**Objetivo**: Construir um dashboard interativo em tempo real para visualização do mapa de risco, ocorrências ativas e estatísticas — além de um sistema de alertas via AWS SNS para scores críticos.

**Estimativa**: 1–2 dias  
**Output principal**: Dashboard Plotly Dash acessível em `http://localhost:5000` + alertas SNS

---

## Contexto

O dashboard é a interface principal do Streetsat para demonstração. Deve mostrar:
- Mapa interativo com marcadores coloridos por score de risco
- Tabela de ocorrências ativas ordenada por criticidade
- Gráficos de distribuição temporal e por tipo
- Painel de alertas recentes

O sistema de alertas dispara via AWS SNS (ou mock local) quando uma nova ocorrência com score ≥ 3 é detectada.

---

## Tarefas

### 5.1 — Estrutura do Dashboard (`dashboard/`)
- [ ] `dashboard/app.py`: ponto de entrada Dash + Gunicorn
- [ ] `dashboard/config.py`: `DEBUG`, `PORT`, `UPDATE_INTERVAL_MS`
- [ ] `dashboard/layouts/main.py`: layout principal (header + tabs)
- [ ] `dashboard/layouts/risk_map.py`: aba do mapa
- [ ] `dashboard/layouts/statistics.py`: aba de estatísticas
- [ ] `dashboard/layouts/alerts.py`: aba de alertas recentes
- [ ] `dashboard/callbacks.py`: todos os callbacks Dash
- [ ] `dashboard/assets/style.css`: customização visual

### 5.2 — Aba 1: Mapa de Risco (`dashboard/layouts/risk_map.py`)
- [ ] Componente `dcc.Graph` com Plotly `go.Scattermapbox`:
  - Marcadores coloridos por score:
    - Score 0 → verde (`#2ECC71`)
    - Score 1 → amarelo (`#F1C40F`)
    - Score 2 → laranja (`#E67E22`)
    - Score 3 → vermelho (`#E74C3C`)
  - Tamanho do marcador proporcional à criticidade
  - Hover: `"BR-{br} | KM {km} | {municipio} | Risco: {label}"`
  - Cluster de pontos próximos (Plotly cluster mode)
  - Zoom inicial centralizado no Brasil (-15, -50)
- [ ] Filtros (sidebar ou dropdowns):
  - UF (multiselect)
  - BR (multiselect)
  - Score mínimo (slider 0–3)
  - Período (últimas 1h / 6h / 24h)
- [ ] Botão "Atualizar" + auto-refresh a cada 5 min via `dcc.Interval`

### 5.3 — Aba 2: Tabela de Ocorrências
- [ ] Componente `dash_table.DataTable`:
  - Colunas: OC-ID | Rodovia | KM | Município | Tipo | Interdição | Score | Detectado Há
  - Ordenação por Score DESC (padrão)
  - Paginação (20 por página)
  - Coloração condicional por score (fundo da linha)
  - Clique na linha → modal com narrativa completa + resultado NLP

### 5.4 — Aba 3: Estatísticas (`dashboard/layouts/statistics.py`)
- [ ] **Gráfico 1**: Distribuição de scores por hora do dia (bar chart 0–23h)
- [ ] **Gráfico 2**: Top 10 BRs por número de ocorrências ativas (horizontal bar)
- [ ] **Gráfico 3**: Série temporal de ocorrências (line chart, últimas 24h em intervalos de 30min)
- [ ] **Gráfico 4**: Distribuição de tipos de interdição (pie chart)
- [ ] **KPIs no topo** (cartões):
  - Total de ocorrências ativas
  - Ocorrências críticas (score 3)
  - BRs monitoradas
  - Última atualização

### 5.5 — Aba 4: Alertas Recentes (`dashboard/layouts/alerts.py`)
- [ ] Lista dos últimos 20 alertas gerados:
  - Timestamp | BR | KM | Score | Tipo | Status (enviado/pendente/falhou)
- [ ] Badge de contagem de alertas críticos nas últimas 1h
- [ ] Botão "Testar Alerta" (envia alerta de teste via SNS/mock)

### 5.6 — Callbacks (`dashboard/callbacks.py`)
- [ ] `update_map(interval, filters)`: busca ocorrências da API + retorna figura atualizada
- [ ] `update_table(interval, filters)`: busca e formata tabela de ocorrências
- [ ] `update_statistics(interval)`: busca dados agregados para gráficos
- [ ] `show_occurrence_detail(row_click)`: abre modal com detalhe + NLP
- [ ] Padrão: callbacks leem da API REST (Fase 4) via `requests.get("http://localhost:8000/...")`

### 5.7 — Sistema de Alertas (`src/alerts/`)

**`src/alerts/alert_factory.py`**
- [ ] Função `create_alert(occurrence: dict, risk_score: int) -> Alert`
- [ ] Dataclass `Alert`:
  ```python
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
      created_at: datetime
  ```
- [ ] Mensagem template: `"⚠️ ALERTA STREETSAT | BR-{br} KM {km} ({municipio}) | Risco CRÍTICO | {type} | {narrative[:100]}"`

**`src/alerts/sns_notifier.py`**
- [ ] Classe `SNSNotifier`:

  **`publish_alert(alert: Alert, topic_arn: str) -> str`**
  - `sns.publish(TopicArn=topic_arn, Message=alert.message, Subject="Streetsat — Alerta de Risco")`
  - Retornar `MessageId`
  - Se `COMPREHEND_ENABLED=false` ou LocalStack: usar mock que loga mas não envia

  **`subscribe_email(email: str, topic_arn: str) -> None`**
  - Registrar email no tópico SNS

- [ ] Tópico SNS: `streetsat-alerts-{stage}` (criado via LocalStack em dev)

**`src/alerts/sqs_publisher.py`**
- [ ] Classe `SQSPublisher`:
  - `publish(queue_url, message_body: dict) -> str`
  - Usado para enviar alertas à fila de processamento assíncrono

### 5.8 — Integração Alertas + Pipeline
- [ ] Em `src/ml/scoring.py`: após scoring, verificar se `risk_score == 3`
- [ ] Se crítico: `alert_factory.create_alert()` → `sns_notifier.publish_alert()`
- [ ] Salvar alerta na tabela `alerts` (PostgreSQL) ou coleção MongoDB
- [ ] Deduplicação: não re-alertar mesma ocorrência dentro de 30 min

### 5.9 — Testes
- [ ] `tests/unit/test_alerts.py`:
  - Teste `create_alert()`: retorna Alert com campos corretos
  - Teste `publish_alert()` com mock boto3: chama `sns.publish()` uma vez
  - Teste deduplicação: segunda chamada para mesmo OC-ID não publica
- [ ] Teste de snapshot do dashboard: `dash.testing` (opcional, se tempo permitir)

### 5.10 — Script de Demo (`scripts/demo_dashboard.py`)
- [ ] Popular banco com 20 ocorrências simuladas de diferentes scores
- [ ] Iniciar dashboard em modo demo (dados estáticos, sem dependência de ARTESP)
- [ ] Imprimir URL de acesso

---

## Entregáveis da Fase 5

| Arquivo | Descrição |
|---------|-----------|
| `dashboard/app.py` | Aplicação Dash principal |
| `dashboard/layouts/` | Layouts das abas |
| `dashboard/callbacks.py` | Lógica interativa |
| `src/alerts/alert_factory.py` | Fábrica de alertas |
| `src/alerts/sns_notifier.py` | Integração AWS SNS |
| `scripts/demo_dashboard.py` | Script de demo |

---

## Critérios de Aceite

- [ ] Dashboard abre em `http://localhost:5000` sem erros
- [ ] Mapa exibe pelo menos 1 marcador com cor correta por score
- [ ] Tabela ordena por Score corretamente
- [ ] Auto-refresh não trava o browser
- [ ] Alerta é gerado e logado quando score = 3 (modo mock)
- [ ] `scripts/demo_dashboard.py` inicia o dashboard com dados de demonstração
