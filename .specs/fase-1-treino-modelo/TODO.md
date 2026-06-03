# Fase 1 — Treino do Modelo ML com Dados PRF

**Objetivo**: Treinar um classificador Random Forest com dados históricos da PRF para gerar scores de risco 0–3 por trecho de rodovia.

**Estimativa**: 3–4 dias  
**Output principal**: `models/modelo_rf.pkl` + relatório de performance

---

## Contexto dos Dados

- **Fonte**: PRF — Polícia Rodoviária Federal
- **Arquivos**: `docs/datatran/datatran2025.csv`, `docs/datatran/datatran2026.csv`
- **Encoding**: `latin-1` (ISO-8859-1)
- **Separador**: `;`
- **Volume**: ~96.000 linhas (2025–2026)
- **Coordenadas**: `latitude`/`longitude` com vírgula como separador decimal

---

## Tarefas

### 1.1 — Setup do Ambiente Python
- [ ] Criar `pyproject.toml` com dependências: `pandas`, `numpy`, `scikit-learn`, `xgboost`, `joblib`, `matplotlib`, `seaborn`, `geopandas`
- [ ] Criar `requirements.txt` e `requirements-dev.txt`
- [ ] Criar `Makefile` com alvos: `install`, `test`, `train`, `lint`
- [ ] Criar `.env.example` com variáveis de ambiente

### 1.2 — Estrutura de Pastas do Projeto
Criar a estrutura conforme o `STREETSAT_PROMPT_COMPLETO.md`:
- [ ] `src/` com subpastas: `core/`, `data/`, `models/`, `ml/`, `utils/`
- [ ] `data/raw/`, `data/processed/`, `data/schemas/`
- [ ] `models/` (modelos exportados)
- [ ] `tests/unit/`, `tests/fixtures/`
- [ ] `scripts/`

### 1.3 — Carregamento dos Dados (`src/data/prf_loader.py`)
- [ ] Função `load_prf_data(paths: list[str]) -> pd.DataFrame` que:
  - Lê CSVs com `sep=";"`, `encoding="latin-1"`
  - Converte `latitude`/`longitude` de vírgula para ponto e para `float`
  - Converte `data_inversa` para `datetime`
  - Converte `horario` para hora inteira (0–23)
  - Concatena múltiplos arquivos
  - Loga contagem de linhas e colunas

### 1.4 — Limpeza dos Dados (`src/data/data_cleaner.py`)
- [ ] Remover linhas com `latitude` ou `longitude` nulas
- [ ] Remover duplicatas por `id`
- [ ] Padronizar strings: remover espaços extras, lowercasing em categóricos
- [ ] Tratar valores ausentes em `causa_acidente`, `tipo_acidente` → categoria `"desconhecido"`
- [ ] Filtrar registros com `km <= 0` ou `br` nula
- [ ] Validar range de coordenadas (Brasil: lat -35 a 5, lon -75 a -34)

### 1.5 — Feature Engineering (`src/data/feature_engineering.py`)
- [ ] **Label de risco** (variável alvo `risk_label`):
  - `0` = Livre: sem mortos e sem feridos graves
  - `1` = Atenção: feridos leves apenas (`feridos_leves > 0`)
  - `2` = Alto: feridos graves (`feridos_graves > 0`)
  - `3` = Crítico: mortos (`mortos > 0`)
  - Prioridade: 3 > 2 > 1 > 0

- [ ] **Features temporais**:
  - `hour`: hora do acidente (0–23)
  - `day_of_week`: dia da semana numérico (0=segunda)
  - `is_weekend`: binário
  - `month`: mês (1–12)
  - `is_holiday`: flag de feriados nacionais (usar lista hardcoded ou `holidays` lib)

- [ ] **Features de local**:
  - `br_number`: número da BR como inteiro
  - `km_bucket`: KM agrupado em intervalos de 10km (para reduzir cardinalidade)
  - `uf_encoded`: encoding ordinal por UF

- [ ] **Features categóricas** (Label Encoding):
  - `causa_acidente` → `cause_encoded`
  - `tipo_acidente` → `type_encoded`
  - `condicao_metereologica` → `weather_encoded`
  - `fase_dia` → `day_phase_encoded`
  - `tipo_pista` → `road_type_encoded`
  - `tracado_via` → `road_layout_encoded`
  - `uso_solo` → `land_use_encoded`

- [ ] **Features geoespaciais**:
  - `lat_rounded`: latitude arredondada a 2 casas (células de ~1km)
  - `lon_rounded`: longitude arredondada a 2 casas

- [ ] Exportar `LabelEncoder`s serializados junto ao modelo (necessário para inferência)

### 1.6 — Validação de Schema (`src/data/data_validator.py`)
- [ ] Pydantic model `AccidentRecord` com tipos e constraints
- [ ] Função `validate_dataframe(df)` que loga warnings para cada violação sem parar execução

### 1.7 — EDA — Análise Exploratória (`scripts/eda.py` ou notebook)
- [ ] Distribuição de `risk_label` (verificar desbalanceamento de classes)
- [ ] Top 10 causas de acidente
- [ ] Acidentes por hora do dia (heatmap)
- [ ] Acidentes por UF (mapa de calor)
- [ ] Correlação entre features e label
- [ ] Mapa de pontos de acidente (Folium) com cluster por risk_label
- [ ] Salvar gráficos em `docs/eda/`

### 1.8 — Treino do Modelo (`scripts/train_model.py`)
- [ ] Separação treino/teste: 80/20 estratificado por `risk_label`
- [ ] Balanceamento de classes: `class_weight="balanced"` no RandomForest
- [ ] Pipeline scikit-learn:
  ```
  Pipeline([
      ("preprocessor", ColumnTransformer(...)),
      ("classifier", RandomForestClassifier(
          n_estimators=200,
          max_depth=15,
          min_samples_leaf=5,
          class_weight="balanced",
          random_state=42,
          n_jobs=-1
      ))
  ])
  ```
- [ ] Validação cruzada 5-fold com `StratifiedKFold`
- [ ] Tuning com `GridSearchCV` (parâmetros: `n_estimators`, `max_depth`, `min_samples_leaf`)

### 1.9 — Avaliação do Modelo (`src/models/ml_model.py`)
- [ ] Acurácia, Precisão, Recall, F1-Score por classe
- [ ] Macro e Weighted averages
- [ ] Matriz de confusão (heatmap)
- [ ] ROC-AUC (One-vs-Rest para multiclasse)
- [ ] Feature importance plot (top 20 features)
- [ ] Salvar relatório em `docs/model_report.md` e gráficos em `docs/figures/`

### 1.10 — Export do Modelo (`src/models/model_registry.py`)
- [ ] Serializar pipeline completo com `joblib.dump()` → `models/modelo_rf.pkl`
- [ ] Salvar metadados em `models/model_metadata.json`:
  ```json
  {
    "model_name": "random_forest_risk_scorer",
    "version": "1.0.0",
    "training_date": "2026-05-31",
    "accuracy": 0.85,
    "f1_score": 0.83,
    "features": [...],
    "label_encoders": "models/encoders.pkl",
    "hyperparameters": {...}
  }
  ```
- [ ] Serializar `LabelEncoder`s → `models/encoders.pkl`

### 1.11 — Testes Unitários (`tests/unit/test_ml_model.py`)
- [ ] Teste de carregamento de CSV
- [ ] Teste de feature engineering (input → output esperado)
- [ ] Teste de predição (modelo retorna valor 0–3)
- [ ] Teste de validação de schema (linhas inválidas rejeitadas)
- [ ] Fixtures com sample de 100 linhas dos CSVs reais

---

## Entregáveis da Fase 1

| Arquivo | Descrição |
|---------|-----------|
| `models/modelo_rf.pkl` | Pipeline scikit-learn serializado |
| `models/encoders.pkl` | LabelEncoders para categóricos |
| `models/model_metadata.json` | Metadados e métricas do modelo |
| `docs/model_report.md` | Relatório de performance com métricas |
| `docs/eda/` | Gráficos da análise exploratória |
| `docs/figures/` | Matriz de confusão, feature importance, ROC |

---

## Critérios de Aceite

- [ ] Modelo com F1-Score macro ≥ 0.70 no conjunto de teste
- [ ] Sem data leakage (encoders fitados apenas no treino)
- [ ] Pipeline reproduzível com `make train`
- [ ] Testes passando com `make test`
- [ ] `modelo_rf.pkl` carregável em inferência standalone
