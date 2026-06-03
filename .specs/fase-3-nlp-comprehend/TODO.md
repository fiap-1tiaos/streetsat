# Fase 3 — NLP com AWS Comprehend

**Objetivo**: Processar as narrativas textuais das ocorrências ARTESP com AWS Comprehend para extrair entidades, sentimento e palavras-chave que enriquecem o score de risco do modelo ML.

**Estimativa**: 2 dias  
**Output principal**: Módulo `src/nlp/` integrado ao pipeline de scoring

---

## Contexto

As ocorrências da ARTESP possuem narrativas como:
> "Tombamento de carreta com vítimas presas às ferragens. Bloqueio total da faixa da direita. Bombeiros no local."

Essas narrativas contêm informações semânticas que os dados estruturados não capturam. O AWS Comprehend extrai:
- **Entidades**: tipo de veículo, localidade, tipo de evento
- **Sentimento**: NEGATIVE/POSITIVE/NEUTRAL/MIXED + score de confiança
- **Key Phrases**: termos relevantes (vítimas, bloqueio, desvio)

O resultado enriquece o score do modelo: uma ocorrência com sentimento NEGATIVE e entidade "vítimas" pode elevar o score de 2 → 3.

**Feature flag**: `COMPREHEND_ENABLED` no `.env`. Quando `false`, usar `src/nlp/local_nlp.py` como fallback (mock determinístico).

---

## Tarefas

### 3.1 — Configuração AWS (`src/core/config.py`)
- [ ] Carregar `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` do `.env`
- [ ] Flag `COMPREHEND_ENABLED: bool = os.getenv("COMPREHEND_ENABLED", "false") == "true"`
- [ ] Validar que credenciais estão presentes quando `COMPREHEND_ENABLED=true`

### 3.2 — Cliente AWS Comprehend (`src/nlp/comprehend_client.py`)
- [ ] Classe `ComprehendClient`:

  **`detect_entities(text: str, language="pt") -> list[dict]`**
  - Chamar `comprehend.detect_entities(Text=text, LanguageCode="pt")`
  - Retornar lista: `[{"type": "LOCATION", "text": "Guarulhos", "score": 0.99}]`
  - Tipos relevantes: `LOCATION`, `ORGANIZATION`, `PERSON`, `EVENT`, `QUANTITY`

  **`detect_sentiment(text: str, language="pt") -> dict`**
  - Chamar `comprehend.detect_sentiment(Text=text, LanguageCode="pt")`
  - Retornar: `{"sentiment": "NEGATIVE", "scores": {"Negative": 0.95, "Positive": 0.02, ...}}`

  **`detect_key_phrases(text: str, language="pt") -> list[str]`**
  - Chamar `comprehend.detect_key_phrases(Text=text, LanguageCode="pt")`
  - Retornar lista de strings das frases-chave

  **`analyze_occurrence(text: str) -> dict`**
  - Combina os 3 métodos acima em uma única chamada encadeada
  - Retornar dict consolidado:
    ```python
    {
        "entities": [...],
        "sentiment": "NEGATIVE",
        "sentiment_score": 0.95,
        "key_phrases": [...],
        "has_victims": bool,  # "vítima", "ferido", "morto" nas frases-chave
        "has_blockage": bool,  # "bloqueio", "interditado" nas frases-chave
        "has_diversion": bool, # "desvio", "alternativa"
        "severity_boost": int  # +0, +1, ou +2 ao score ML
    }
    ```

- [ ] Tratar `ClientError` (cota excedida, texto muito longo > 5000 chars)
- [ ] Truncar texto para 4900 chars antes de enviar
- [ ] Logging de custo estimado (número de caracteres processados)

### 3.3 — Fallback Local (`src/nlp/local_nlp.py`)
- [ ] Classe `LocalNLPClient` com a mesma interface de `ComprehendClient`
- [ ] Implementação baseada em dicionário de palavras-chave PT-BR:
  ```python
  CRITICAL_KEYWORDS = ["morto", "óbito", "vítima fatal", "faleceu"]
  HIGH_KEYWORDS = ["ferido grave", "UTI", "internado", "presos às ferragens"]
  MEDIUM_KEYWORDS = ["ferido leve", "socorrido", "atendimento"]
  BLOCKAGE_KEYWORDS = ["bloqueio total", "interditado", "fechado"]
  ```
- [ ] Lógica de severity_boost baseada na contagem de keywords por categoria
- [ ] Resultado idêntico ao formato do ComprehendClient

### 3.4 — Factory de NLP (`src/nlp/__init__.py`)
- [ ] Função `get_nlp_client() -> ComprehendClient | LocalNLPClient`
  - Retorna `ComprehendClient` se `COMPREHEND_ENABLED=true`
  - Retorna `LocalNLPClient` caso contrário
  - Singleton (instancia uma vez, reutiliza)

### 3.5 — Integração com Pipeline de Scoring (`src/ml/scoring.py`)
- [ ] Função `enrich_score_with_nlp(base_score: int, occurrence: dict) -> int`:
  - Chama `nlp_client.analyze_occurrence(occurrence["narrative"])`
  - Aplica `severity_boost` ao `base_score`
  - Score máximo: 3 (não ultrapassa)
  - Log: `score: {base_score} → {enriched_score} (NLP boost: {boost})`
  - Se `narrative` for None/vazio, retorna `base_score` sem alteração

### 3.6 — Persistência dos Resultados NLP
- [ ] Salvar resultado NLP em `occurrences_realtime.nlp_entities` (jsonb no PostgreSQL)
- [ ] Salvar `nlp_sentiment` em coluna própria para análise posterior
- [ ] Coleção `nlp_results` no MongoDB (histórico de análises para auditoria)

### 3.7 — Testes (`tests/unit/test_nlp.py`)
- [ ] Teste `test_local_nlp_critical()`: texto com "morto" retorna `severity_boost=2`
- [ ] Teste `test_local_nlp_blockage()`: texto com "bloqueio total" seta `has_blockage=True`
- [ ] Teste `test_enrich_score()`: score 1 + boost 2 = 3 (não excede máximo)
- [ ] Mock do boto3 Comprehend para teste do `ComprehendClient`
- [ ] Teste `test_factory_local()`: com `COMPREHEND_ENABLED=false`, retorna `LocalNLPClient`

### 3.8 — Script de Demonstração (`scripts/demo_nlp.py`)
- [ ] Processar as 10 ocorrências mais críticas coletadas pela Fase 2
- [ ] Imprimir tabela: OC-ID | Narrativa (50 chars) | Sentimento | Boost | Score Final
- [ ] Usado no vídeo de demonstração e no PDF de entrega

---

## Mapeamento de Entidades → Features

| Entidade Comprehend | Campo no modelo | Uso |
|--------------------|-----------------|-----|
| `LOCATION` | `detected_location` | Verificar se é uma BR conhecida |
| `QUANTITY` com "vítima" | `has_victims` | Elevar score +1 |
| Sentiment `NEGATIVE` > 0.8 | `high_severity_sentiment` | Elevar score +1 |
| Key phrase "bloqueio total" | `has_blockage` | Elevar score +1 |
| Key phrase "morto" / "óbito" | `critical_flag` | Forçar score = 3 |

---

## Entregáveis da Fase 3

| Arquivo | Descrição |
|---------|-----------|
| `src/nlp/comprehend_client.py` | Wrapper AWS Comprehend |
| `src/nlp/local_nlp.py` | Fallback por dicionário |
| `src/nlp/__init__.py` | Factory de NLP |
| `src/ml/scoring.py` | Enriquecimento do score |
| `scripts/demo_nlp.py` | Demo para apresentação |

---

## Critérios de Aceite

- [ ] `COMPREHEND_ENABLED=false`: LocalNLPClient funciona sem credenciais AWS
- [ ] `COMPREHEND_ENABLED=true`: ComprehendClient envia ao AWS real sem erros
- [ ] Score nunca ultrapassa 3 após boost
- [ ] Narrativa vazia não causa exceção
- [ ] Todos os testes passando
- [ ] Demo script executa e imprime tabela formatada
