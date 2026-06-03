# Streetsat — Especificações de Desenvolvimento

**Projeto**: Streetsat — Monitoramento inteligente de rotas via satélite e IA  
**Prazo**: 09/06/2026 | **Instituição**: FIAP GS2 | **Stack**: Python, AWS, scikit-learn, Plotly, React 19

---

## Fases

| Fase | Pasta | Estimativa | Status |
|------|-------|-----------|--------|
| 1 — Treino do Modelo ML (PRF) | `fase-1-treino-modelo/` | 3–4 dias | ✅ Concluído |
| 2 — Coleta em Tempo Real | `fase-2-coleta-tempo-real/` | 2–3 dias | ✅ Concluído |
| 3 — NLP com AWS Comprehend | `fase-3-nlp-comprehend/` | 2 dias | ✅ Concluído |
| 4 — Inferência e Roteamento | `fase-4-inferencia-roteamento/` | 2 dias | ✅ Concluído |
| 5 — Dashboard Plotly + Alertas | `fase-5-dashboard-alertas/` | 1–2 dias | ✅ Concluído |
| 6 — Lambda + Produção | `fase-6-lambda-producao/` | 1 dia | ✅ Concluído |
| 7 — Landing Page + Admin Frontend | `fase-7-landing-admin-frontend/` | 4–5 dias | ⬜ Pendente |

**Total estimado**: 15–19 dias | Fases 1–6 entregues | Fase 7 planejada

---

## Arquitetura em 3 Camadas

```
[Dados PRF CSV] ──────────────────────────────────────────┐
                                                            ↓
[ARTESP Scraper] ──→ [Feature Engineering] ──→ [Random Forest] ──→ Score 0–3
[NASA APIs]                                         ↑                    ↓
                                              [Fase 1]           [AWS Comprehend]
                                                                  (NLP boost)
                                                                        ↓
                                                               [Score Enriquecido]
                                                                        ↓
                                                          [NetworkX Grafo de Rotas]
                                                          (Dijkstra com pesos de risco)
                                                                        ↓
                                                              [Rota Otimizada]
                                                                        ↓
                                                         [Dashboard Plotly + SNS Alertas]
```

---

## Dados Disponíveis

- `docs/datatran/datatran2025.csv` — ~72.530 linhas, sep=`;`, encoding=`latin-1`
- `docs/datatran/datatran2026.csv` — ~23.476 linhas, sep=`;`, encoding=`latin-1`
- Coordenadas com vírgula como separador decimal (converter para ponto)

---

## Requisitos FIAP GS2

- ✅ ML: Random Forest (scikit-learn)
- ✅ Cloud AWS: S3, Lambda, SNS, CloudWatch
- ✅ APIs Cognitivas: AWS Comprehend (NLP)
- ✅ Pipeline de Dados: coleta → limpeza → features → ML → output
- ✅ Entrega: PDF + vídeo ≤ 5min + GitHub README + modelo_rf.pkl

---

## Ordem de Execução Recomendada

```
Fase 1 → [Fase 2 + Fase 3] → Fase 4 → Fase 5 → Fase 6 → Fase 7
  ✅            ✅   ✅          ✅         ✅        ✅       ⬜
```

**Fase 7** é independente do backend Python — pode rodar em paralelo com qualquer ajuste das fases anteriores. Consome a FastAPI (Fase 4) via proxy Vite.

Para começar a Fase 7: `cat fase-7-landing-admin-frontend/TODO.md`

---

## Fase 7 — Visão Geral da Frontend

**Stack**: React 19 + Node 24 + Vite 6 + Motion + tsParticles + Leaflet + Recharts + Tailwind CSS v4 + shadcn/ui  
**Porta**: `http://localhost:5174`  
**Pasta**: `web/` na raiz do projeto

### Páginas
| Rota | Descrição |
|------|-----------|
| `/` | Landing page cinematográfica (starfield, particles, scroll motion) |
| `/admin/login` | Autenticação simples com API key |
| `/admin/dashboard` | KPIs + mapa + gráficos em tempo real |
| `/admin/map` | Mapa Leaflet fullscreen com marcadores de risco |
| `/admin/occurrences` | Tabela filtrável com detalhe NLP por linha |
| `/admin/alerts` | Histórico de alertas SNS |
| `/admin/model` | Métricas e metadados do modelo Random Forest |

### Visual
- **Tema**: dark total (`#020408` fundo)
- **Paleta**: cyan `#00d4ff` (primário) · amber `#f59e0b` (atenção) · vermelho `#ef4444` (crítico)
- **Tipografia**: Space Grotesk (headings) · Inter (body) · JetBrains Mono (dados)
- **Efeitos**: glassmorphism · glow borders · scanlines · parallax · starfield canvas 60fps
