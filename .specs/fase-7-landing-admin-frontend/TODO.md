# Fase 7 — Landing Page + Admin Dashboard (React 19 + Node 24)

**Objetivo**: Criar uma aplicação React 19 com landing page cinematográfica (tema astronômico + vias terrestres, dark theme, particles.js, scroll motion) e uma área administrativa profissional com monitoramento em tempo real das rodovias.

**Estimativa**: 4–5 dias  
**Stack**: React 19, Node 24, Vite 6, Motion, particles.js, Tailwind CSS v4, shadcn/ui, Recharts, React Router v7, Socket.IO  
**Output principal**: `web/` — aplicação React rodando em `http://localhost:5174`

---

## Estrutura de Pastas

```
web/
├── public/
│   └── particles-config.json        ← configuração do particles.js
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                       ← router root
│   ├── router.tsx                    ← definição de rotas
│   │
│   ├── pages/
│   │   ├── landing/
│   │   │   ├── LandingPage.tsx       ← página principal (/)
│   │   │   ├── sections/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── StatsSection.tsx
│   │   │   │   ├── HowItWorksSection.tsx
│   │   │   │   ├── ArchitectureSection.tsx
│   │   │   │   ├── LiveFeedSection.tsx
│   │   │   │   └── CTASection.tsx
│   │   │   └── components/
│   │   │       ├── StarfieldCanvas.tsx
│   │   │       ├── ParticlesBackground.tsx
│   │   │       ├── RoadAnimation.tsx
│   │   │       └── AnimatedCounter.tsx
│   │   │
│   │   └── admin/
│   │       ├── AdminLayout.tsx       ← sidebar + topbar
│   │       ├── LoginPage.tsx         ← /admin/login
│   │       ├── DashboardPage.tsx     ← /admin/dashboard
│   │       ├── OccurrencesPage.tsx   ← /admin/occurrences
│   │       ├── AlertsPage.tsx        ← /admin/alerts
│   │       ├── ModelPage.tsx         ← /admin/model
│   │       └── MapPage.tsx           ← /admin/map
│   │
│   ├── components/
│   │   ├── ui/                       ← shadcn/ui components
│   │   ├── map/
│   │   │   ├── RiskMap.tsx           ← mapa interativo com Leaflet
│   │   │   └── RiskMarker.tsx
│   │   ├── charts/
│   │   │   ├── RiskDonutChart.tsx
│   │   │   ├── OccurrencesTimeline.tsx
│   │   │   ├── HeatmapChart.tsx
│   │   │   └── ModelMetricsChart.tsx
│   │   └── realtime/
│   │       ├── LiveOccurrencesFeed.tsx
│   │       └── AlertBanner.tsx
│   │
│   ├── hooks/
│   │   ├── useRealtime.ts            ← polling / WebSocket
│   │   ├── useScrollAnimation.ts     ← scroll-driven animation helpers
│   │   └── useCountUp.ts             ← contador animado
│   │
│   ├── lib/
│   │   ├── api.ts                    ← fetch wrapper para a FastAPI
│   │   └── utils.ts
│   │
│   ├── stores/
│   │   └── occurrencesStore.ts       ← Zustand store
│   │
│   └── styles/
│       ├── globals.css               ← Tailwind v4 + CSS vars dark theme
│       └── animations.css            ← keyframes customizados
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                        ← VITE_API_URL=http://localhost:8000
```

---

## Dependências

```bash
# Runtime
npm install react@19 react-dom@19 react-router@7
npm install motion                          # scroll + layout animations
npm install @tsparticles/react @tsparticles/engine  # particles.js moderno
npm install leaflet react-leaflet           # mapa
npm install recharts                        # gráficos admin
npm install zustand                         # state management
npm install socket.io-client               # real-time
npm install clsx tailwind-merge            # utilitários

# shadcn/ui (setup)
npx shadcn@latest init
npx shadcn@latest add card badge button table tabs

# Dev
npm install -D vite@6 @vitejs/plugin-react typescript @types/react @types/react-dom
npm install -D tailwindcss@4 @tailwindcss/vite
npm install -D @types/leaflet
```

---

## Tarefas

### 7.1 — Setup do Projeto

- [ ] `npm create vite@latest web -- --template react-ts` com Node 24
- [ ] Configurar `vite.config.ts`:
  - Plugin React com Fast Refresh
  - Proxy para `/api` → `http://localhost:8000` (evitar CORS em dev)
  - Alias `@` → `src/`
- [ ] Configurar Tailwind CSS v4 via `@tailwindcss/vite`
- [ ] Instalar e inicializar shadcn/ui (tema: slate dark)
- [ ] Configurar `tsconfig.json` com `strict: true` e paths
- [ ] Criar `.env.local` com `VITE_API_URL`

### 7.2 — Design System e Tema

**Paleta de cores** (CSS custom properties em `globals.css`):
```css
:root {
  --bg-void: #020408;           /* fundo quase preto — espaço */
  --bg-deep: #060d16;           /* cards e painéis */
  --bg-surface: #0d1f2d;        /* surfaces elevadas */
  --accent-cyan: #00d4ff;       /* destaques primários — satélite */
  --accent-amber: #f59e0b;      /* atenção / avisos */
  --accent-red: #ef4444;        /* crítico / alertas */
  --accent-green: #22c55e;      /* livre / ok */
  --text-primary: #e2e8f0;
  --text-muted: #64748b;
  --border-subtle: #1e3a5f20;
  --glow-cyan: 0 0 30px #00d4ff40;
  --glow-red: 0 0 30px #ef444440;
}
```

**Tipografia**:
- Headings: `Space Grotesk` (astronômico, tech)
- Body: `Inter`
- Monospace (scores/dados): `JetBrains Mono`

**Efeitos CSS reutilizáveis**:
```css
.glass-card   { backdrop-filter: blur(12px); background: #0d1f2d80; border: 1px solid #00d4ff15; }
.glow-border  { box-shadow: var(--glow-cyan); border-color: #00d4ff40; }
.text-glow    { text-shadow: 0 0 20px currentColor; }
.scanline     { background: repeating-linear-gradient(0deg, transparent, transparent 2px, #00d4ff03 2px, #00d4ff03 4px); }
```

### 7.3 — Landing Page: Starfield + Particles

**`StarfieldCanvas.tsx`** — canvas WebGL/2D puro:
- [ ] `useRef` em `<canvas>` fullscreen, `position: fixed`, `z-index: 0`
- [ ] Gerar 800 estrelas com posição, tamanho (0.5–2.5px), velocidade e opacidade aleatórias
- [ ] `requestAnimationFrame` loop: estrelas se movem lentamente da direita para a esquerda (parallax)
- [ ] Estrelas piscam com `Math.sin(time * speed)` → opacidade 0.3–1.0
- [ ] 15–20 estrelas "brilhantes" com halo cyan `ctx.shadowBlur = 8`
- [ ] `useEffect` com cleanup do `cancelAnimationFrame`

**`ParticlesBackground.tsx`** — tsParticles:
```json
// particles-config.json
{
  "particles": {
    "number": { "value": 60 },
    "color": { "value": ["#00d4ff", "#f59e0b", "#ffffff"] },
    "opacity": { "value": { "min": 0.1, "max": 0.5 } },
    "size": { "value": { "min": 1, "max": 3 } },
    "move": {
      "enable": true, "speed": 0.4, "direction": "none", "random": true,
      "out_mode": "out"
    },
    "links": {
      "enable": true, "distance": 120, "color": "#00d4ff",
      "opacity": 0.08, "width": 1
    }
  },
  "interactivity": {
    "events": {
      "onhover": { "enable": true, "mode": "grab" },
      "onclick": { "enable": true, "mode": "push" }
    }
  }
}
```

**`RoadAnimation.tsx`** — SVG animado:
- [ ] SVG fullwidth com perspectiva de estrada que converge ao horizonte
- [ ] Linhas tracejadas animadas com `stroke-dashoffset` + CSS animation (velocidade = velocidade do scroll)
- [ ] Sobreposição sutil sobre o starfield (opacity 0.15)
- [ ] Pontos de luz correndo pela estrada representando veículos

### 7.4 — Landing Page: Seções com Scroll Motion

Todas as seções usam `motion` (ex-Framer Motion) com `useInView` para disparar animações quando entram na viewport.

**Padrão de animação por seção**:
```tsx
// cada seção
const ref = useRef(null)
const isInView = useInView(ref, { once: true, margin: "-100px" })

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 60 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.7, ease: "easeOut" }}
>
```

**7.4.1 — HeroSection**
- [ ] Fundo: `StarfieldCanvas` + `ParticlesBackground` em camadas (`z-index` escalonado)
- [ ] `RoadAnimation` SVG na parte inferior do hero (rodovias convergindo ao horizonte)
- [ ] Tagline animada letra por letra com `motion` stagger:
  ```
  "Monitoramento Inteligente de Rodovias"  ← cada palavra entra com delay
  "via Satélite e Inteligência Artificial"
  ```
- [ ] Sub-tagline com fade-in delay 0.8s
- [ ] Dois botões CTA com hover glow:
  - "Ver Demo ao Vivo" → scroll suave até `#live-feed`
  - "Acesso Admin" → `/admin/login`
- [ ] Badge "FIAP Global Solution 2 · 2026" com borda pulsante cyan
- [ ] Scroll indicator animado (seta bounce infinita)

**7.4.2 — StatsSection**
- [ ] Fundo com grid CSS sutil (linhas de coordenadas geográficas)
- [ ] 4 cartões glassmorphism em grid 2×2 / row-4 mobile:

  | Stat | Valor | Ícone |
  |------|-------|-------|
  | Acidentes analisados | `96.000+` | 🛣️ |
  | Rodovias monitoradas | `847` BRs | 🗺️ |
  | Precisão do modelo | `52%` Acurácia | 🤖 |
  | Tempo de resposta | `< 2s` | ⚡ |

- [ ] `AnimatedCounter.tsx`: conta do zero até o valor final quando entra na view (`useCountUp` hook com `requestAnimationFrame`)
- [ ] Cada número tem glow cyan ao terminar de contar

**7.4.3 — HowItWorksSection**
- [ ] 3 etapas em linha horizontal (desktop) / vertical (mobile)
- [ ] Conectadas por linha animada que "preenche" da esquerda para direita conforme scroll (SVG `stroke-dashoffset`)
- [ ] Etapa 1: **Coleta** — ícone satélite orbitando (CSS animation rotate)
- [ ] Etapa 2: **IA** — ícone neural network pulsante
- [ ] Etapa 3: **Alerta** — ícone notificação com ping animation (Tailwind `animate-ping`)
- [ ] Cada etapa: título, descrição 2 linhas, badge de tecnologia (Random Forest / AWS / SNS)

**7.4.4 — ArchitectureSection**
- [ ] Diagrama das 3 camadas como cards empilhados com parallax (cada camada scroll a velocidade diferente via `motion` `useScroll` + `useTransform`)
- [ ] Camada 1 (ML): cor verde `#22c55e`
- [ ] Camada 2 (NLP): cor cyan `#00d4ff`
- [ ] Camada 3 (Routing): cor amber `#f59e0b`
- [ ] Setas entre camadas animadas com Motion

**7.4.5 — LiveFeedSection** (`id="live-feed"`)
- [ ] Ticker horizontal em loop com ocorrências reais da API `/occurrences` (polling 30s)
- [ ] Cada item do ticker: badge colorido por score + rodovia + km + município
- [ ] Mapa miniatura (Leaflet, sem interação) mostrando os últimos 10 pontos com marcadores coloridos
- [ ] Contador de "ocorrências ativas" que atualiza em tempo real (pulsa quando muda)

**7.4.6 — CTASection**
- [ ] Fundo: gradiente radial escuro com nebulosa em CSS (`background: radial-gradient(ellipse at 50% 0%, #00d4ff10 0%, transparent 70%)`)
- [ ] Headline animada com Motion
- [ ] Botão primário grande com efeito shimmer no hover (pseudo-element `::after` com gradiente deslizante)
- [ ] Footer com links ODS, GitHub, FIAP

### 7.5 — Área Administrativa: Layout e Autenticação

**`AdminLayout.tsx`**:
- [ ] Sidebar colapsável (220px expandida / 64px colapsada) com `motion` `width` animation
- [ ] Itens do menu com ícones (Lucide React):
  - Dashboard (LayoutDashboard)
  - Mapa ao Vivo (Map)
  - Ocorrências (AlertTriangle)
  - Alertas (Bell)
  - Modelo ML (Brain)
- [ ] Topbar: título da página atual + badge "🔴 Ao Vivo" pulsante + timestamp de última atualização
- [ ] Indicador de status da API (`/health`) no canto inferior da sidebar: verde se OK, vermelho se offline

**`LoginPage.tsx`** (`/admin/login`):
- [ ] Mesmo starfield do hero como fundo
- [ ] Card glassmorphism centralizado com:
  - Logo "🛰️ Streetsat"
  - Campo "API Key" (simples — validação local, sem backend de auth)
  - Botão com loading state
- [ ] Credencial hardcoded para demo: `streetsat-2026`
- [ ] Persiste em `localStorage`, redirect para `/admin/dashboard`

### 7.6 — Admin: Dashboard Principal (`/admin/dashboard`)

**KPI Cards** (topo, 4 colunas):
- [ ] Total de ocorrências ativas (com delta vs hora anterior)
- [ ] Ocorrências críticas (score 3) com badge vermelho pulsante
- [ ] Uptime da API (calculado desde `health.timestamp`)
- [ ] Última inferência realizada (timestamp relativo "há X minutos")

**Layout grid**:
```
[KPI] [KPI] [KPI] [KPI]
[Mapa ao Vivo - 8col] [Feed de Alertas - 4col]
[Timeline Ocorrências - 6col] [Distribuição Score - 3col] [Top BRs - 3col]
```

**`OccurrencesTimeline.tsx`** (Recharts `AreaChart`):
- [ ] Eixo X: últimas 24h em intervalos de 1h
- [ ] 4 áreas empilhadas, uma por score (verde/amarelo/laranja/vermelho)
- [ ] Tooltip customizado glassmorphism

**`RiskDonutChart.tsx`** (Recharts `PieChart`):
- [ ] Donut com cores por score, legenda lateral
- [ ] Label central: total de ocorrências

**`HeatmapChart.tsx`**:
- [ ] Grid hora × dia-da-semana (7×24) com intensidade de cor por volume de acidentes históricos
- [ ] Baseado nos dados PRF já carregados

### 7.7 — Admin: Mapa ao Vivo (`/admin/map`)

- [ ] Leaflet fullscreen (sem sidebar, topbar apenas)
- [ ] Tiles dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- [ ] `RiskMarker.tsx`: círculo colorido por score com popup:
  ```
  OC-19500 | SP-330 | KM 225
  Risco: CRÍTICO (Score 3)
  Município: Guarulhos
  Detectado há: 12 min
  Narrativa: "Tombamento de carreta..."
  ```
- [ ] Cluster de marcadores próximos (`react-leaflet-cluster`)
- [ ] Painel lateral deslizante ao clicar marcador com detalhe completo + resultado NLP
- [ ] Auto-refresh a cada 30s com animação de "atualização" nos marcadores novos (pulse ring)
- [ ] Controles de filtro flutuantes (score mínimo slider, rodovia input)

### 7.8 — Admin: Ocorrências (`/admin/occurrences`)

**Tabela** (`shadcn/ui` Table + TanStack Table):
- [ ] Colunas: OC-ID | Rodovia | KM | Município | Tipo | Interdição | Score | NLP Sentimento | Detectado
- [ ] Ordenação por qualquer coluna
- [ ] Paginação client-side (20/página)
- [ ] Filtros: score mínimo, rodovia, status (ativa/finalizada)
- [ ] Coloração condicional de linha por score
- [ ] Coluna Score com badge colorido + ícone
- [ ] Clique na linha → modal lateral com todos os detalhes + narrativa + entidades NLP extraídas

**Row Detail Modal**:
- [ ] Slider panel da direita com `motion` `x` animation
- [ ] Exibe narrative completa com highlight das palavras-chave do NLP
- [ ] Tags de entidades detectadas (LOCATION, EVENT, QUANTITY)
- [ ] Badge de sentimento AWS Comprehend
- [ ] Timeline da ocorrência (detectada → atualizada → resolvida)

### 7.9 — Admin: Alertas (`/admin/alerts`)

- [ ] Lista de alertas disparados com status (enviado via SNS / mock)
- [ ] Filtro por data, score, rodovia
- [ ] Card por alerta com mensagem completa, timestamp, badge de status
- [ ] Botão "Testar Alerta" → POST `/alerts/test` → mostra toast de confirmação
- [ ] `AlertBanner.tsx`: banner fixo no topo que aparece quando novo alerta crítico chega (auto-dismiss 10s)

### 7.10 — Admin: Modelo ML (`/admin/model`)

- [ ] Card com metadados do `model_metadata.json`:
  - Versão, data de treino, acurácia, F1-macro
  - Barras de progresso por métrica
- [ ] `ModelMetricsChart.tsx` (Recharts `RadarChart`): precisão/recall/F1 por classe
- [ ] Feature importance (top 10) como `BarChart` horizontal
- [ ] Matriz de confusão como grid colorido (heatmap CSS)
- [ ] Badge "Modelo Ativo" verde com pulse

### 7.11 — Real-time com Polling

**`useRealtime.ts`** hook:
```ts
// polling simples — não requer WebSocket no backend
function useRealtime(endpoint: string, intervalMs = 30_000) {
  const [data, setData] = useState(null)
  const [lastUpdated, setLastUpdated] = useState<Date>()

  useEffect(() => {
    const fetch = async () => { ... }
    fetch()
    const id = setInterval(fetch, intervalMs)
    return () => clearInterval(id)
  }, [endpoint, intervalMs])

  return { data, lastUpdated }
}
```

- [ ] Indicador visual de "buscando" (spinner sutil no topbar)
- [ ] Diff entre fetch anterior e atual → marcar ocorrências novas com highlight `motion` (glow e fade-in)
- [ ] Se API offline → banner "API indisponível — usando dados em cache"

### 7.12 — Configuração Final

**`vite.config.ts`**:
```ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { '/api': { target: 'http://localhost:8000', rewrite: p => p.replace(/^\/api/, '') } }
  },
  resolve: { alias: { '@': '/src' } }
})
```

**`package.json`** scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  }
}
```

---

## Fluxo de Navegação

```
/ (Landing)
│
├── Scroll → HeroSection → StatsSection → HowItWorks → Architecture → LiveFeed → CTA
│
└── /admin/login
        ↓ (auth OK)
    /admin/dashboard
    ├── /admin/map
    ├── /admin/occurrences
    ├── /admin/alerts
    └── /admin/model
```

---

## Animações Motion — Referência de Uso

```tsx
// 1. Entrada por scroll (todas as seções)
<motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }} />

// 2. Stagger de filhos (listas, cards)
<motion.ul variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show">
  <motion.li variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} />
</motion.ul>

// 3. Parallax por scroll
const { scrollYProgress } = useScroll({ target: ref })
const y = useTransform(scrollYProgress, [0, 1], [0, -100])
<motion.div style={{ y }} />

// 4. Layout animation (sidebar collapse)
<motion.aside animate={{ width: collapsed ? 64 : 220 }} transition={{ type: "spring", stiffness: 300 }} />

// 5. Hover glow em botões
<motion.button whileHover={{ scale: 1.03, boxShadow: "var(--glow-cyan)" }}
               whileTap={{ scale: 0.97 }} />
```

---

## Entregáveis da Fase 7

| Arquivo/Pasta | Descrição |
|---------------|-----------|
| `web/src/pages/landing/` | Landing page completa com todas as seções |
| `web/src/pages/admin/` | 5 páginas do painel administrativo |
| `web/src/components/map/` | Mapa Leaflet com dark tiles e marcadores |
| `web/src/components/charts/` | 4 gráficos Recharts customizados |
| `web/src/components/realtime/` | Feed e banner de alertas ao vivo |
| `web/public/particles-config.json` | Configuração tsParticles |
| `web/src/styles/globals.css` | Design system completo (vars, glass, glow) |

---

## Critérios de Aceite

- [ ] Landing page carrega em < 3s (Lighthouse Performance ≥ 80)
- [ ] Starfield canvas roda a 60fps sem jank (verificar com DevTools Performance)
- [ ] Todas as seções animam ao entrar na viewport
- [ ] Scroll da landing é suave (sem pulos ou CLS)
- [ ] Admin dashboard exibe dados reais da API FastAPI (Fase 4)
- [ ] Mapa ao vivo atualiza marcadores a cada 30s
- [ ] Sidebar colapsa/expande com animação fluida
- [ ] Responsivo: landing e admin funcionam em 375px (mobile) e 1440px (desktop)
- [ ] Sem erros no console em produção (`npm run build` limpo)
- [ ] `npm run lint` sem erros
