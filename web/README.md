# Streetsat — Frontend

Interface web do sistema Streetsat para monitoramento inteligente de rodovias brasileiras.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · React Leaflet

---

## Índice

- [Visão Geral](#visão-geral)
- [Páginas e Rotas](#páginas-e-rotas)
- [Arquitetura do Frontend](#arquitetura-do-frontend)
- [Design System](#design-system)
- [Integração com a API](#integração-com-a-api)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Início Rápido](#início-rápido)
- [Docker](#docker)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura de Pastas](#estrutura-de-pastas)

---

## Visão Geral

O frontend é dividido em duas áreas:

- **Landing Page** — página pública com apresentação do produto, animações de scroll e demo ao vivo das ocorrências em tempo real
- **Painel Admin** — dashboard protegido por API key com mapa de risco interativo, métricas do modelo ML, feed de ocorrências, alertas e análise de rotas

---

## Páginas e Rotas

| Rota | Componente | Acesso |
|---|---|---|
| `/` | `LandingPage` | Público |
| `/admin/login` | `LoginPage` | Público |
| `/admin/dashboard` | `DashboardPage` | Autenticado |
| `/admin/map` | `MapPage` | Autenticado |
| `/admin/occurrences` | `OccurrencesPage` | Autenticado |
| `/admin/model` | `ModelPage` | Autenticado |
| `/admin/alerts` | `AlertsPage` | Autenticado |

**Autenticação:** A API key é armazenada em `localStorage` sob a chave `streetsat-auth`. Rotas `/admin/*` verificam a presença dessa chave via guard no router; ausência redireciona para `/admin/login`.

**API key de demonstração:** `streetsat-2026`

---

## Arquitetura do Frontend

### Landing Page

Orquestrada por `LandingPage.tsx`, composta por seções independentes montadas em sequência:

```
LandingPage
├── NavbarSection        — Header fixo com blur on scroll e menu mobile
├── HeroSection          — Hero com parallax (starfield + road), status bar
├── ProblemSection       — Contadores animados de acidentes/vítimas
├── StatsSection         — 4 métricas do sistema com ícones Lucide
├── HowItWorksSection    — Timeline das 3 etapas do pipeline
├── ArchitectureSection  — Scroll horizontal sticky com os 3 cards do pipeline
├── LiveFeedSection      — Feed em tempo real de ocorrências (dados da API)
├── CTASection           — Call-to-action para acessar o painel
└── FooterSection        — Links e créditos
```

**ArchitectureSection — scroll horizontal:**
A seção tem `height: 300vh` com o conteúdo `sticky top-0`. Um `motion.div` de `width: 300vw` (3 painéis de `100vw` cada) é transladado horizontalmente via `useTransform(scrollYProgress, [0, 1], ['0vw', '-200vw'])`. Cada scroll de 100vh equivale a exatamente um painel, centralizando o card correspondente.

### Painel Admin

Envolvido por `AdminLayout.tsx` — sidebar colapsável com navegação e botão de logout. O conteúdo de cada página é renderizado no `<Outlet />` do React Router.

```
AdminLayout (sidebar + outlet)
├── DashboardPage   — Visão geral: cards de status, gráficos de risco e timeline
├── MapPage         — Mapa React Leaflet com marcadores coloridos por risco
├── OccurrencesPage — Tabela filtrada de ocorrências ARTESP
├── ModelPage       — Métricas do Random Forest + feature importances
└── AlertsPage      — Alertas ativos do SNS/sistema
```

### Atualização em tempo real

O hook `useRealtime<T>(fetcher, intervalMs)` abstrai polling periódico via `setInterval`. Retorna `{ data, loading, error, lastUpdated }`. Usado em `LiveFeedSection` (ocorrências) e no Dashboard.

### Dados reais vs. mock

`DashboardPage` e `LiveFeedSection` tentam dados reais (`api.occurrences()` a cada 30 s). O fallback para dados mock ativa apenas em dois casos:

| Situação | Comportamento |
|---|---|
| API offline / erro de rede | `MOCK_OCC` (20 ocorrências estáticas) |
| API retorna array vazio | `MOCK_OCC` |
| API retorna dados reais | dados exibidos diretamente |

Os dados mock usam coordenadas geográficas fixas. Para receber dados reais, o pipeline de lambdas precisa estar rodando (veja a seção **LocalStack** no README da API raiz).

---

## Design System

### Tokens de cor (Tailwind `@theme`)

```css
--color-brand-cyan:  #00d4ff   /* cor principal */
--color-brand-amber: #f59e0b   /* destaque secundário */
--color-brand-green: #22c55e   /* risco livre */
--color-brand-red:   #ef4444   /* risco crítico */
--color-bg-deep:     #020408   /* fundo hero */
--color-bg-base:     #060d16   /* fundo geral */
--color-bg-surface:  #0d1a2e   /* cards e painéis */
```

### Tokens de motion (`src/lib/motion-tokens.ts`)

```ts
fadeUp    // { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
fadeIn    // { hidden: { opacity: 0 }, show: { opacity: 1 } }
stagger   // transition com staggerChildren: 0.12
VIEWPORT  // { once: true, amount: 0.2 } — padrão para useInView
```

### Tipografia

| Família | Variável CSS | Uso |
|---|---|---|
| Space Grotesk | `--font-display` | Títulos, botões, navbar |
| JetBrains Mono | `--font-mono` | Badges técnicos, código |
| Inter | base | Corpo de texto |

### Utilitários CSS notáveis

```css
.text-gradient-animated   /* gradiente animado cyan→blue com @keyframes */
.btn-shimmer              /* efeito shimmer em botões CTA */
.animate-scroll-bounce    /* bounce no indicador de scroll */
```

---

## Integração com a API

### Cliente HTTP (`src/lib/api.ts`)

Todas as chamadas passam por `apiFetch<T>()` que centraliza base URL, headers e tratamento de erros.

```ts
import { api } from '@/lib/api'

// Status da API e modelo
const health = await api.health()

// Score de risco de um trecho
const risk = await api.risk(116, 225)
// → { br, km, risk_score: 0-3, risk_label, confidence }

// Ocorrências ativas — retorna Occurrence[] diretamente (desembrulha {total, items})
const occs = await api.occurrences()

// Rota mais segura
const route = await api.optimizeRoute({
  origin:      { br: 116, km: 200 },
  destination: { br: 116, km: 300 },
})

// Metadados do modelo ML
const meta = await api.modelMetadata()

// Alertas ativos
const alerts = await api.alerts()
```

> **Formato interno:** o endpoint `/occurrences` retorna `{ total: number, items: Occurrence[] }`.
> O método `api.occurrences()` desembrulha automaticamente e entrega apenas o array `items`,
> de forma transparente para os componentes consumidores.

### Proxy do Vite

Em desenvolvimento, o Vite proxeia `/api/*` para a API:

```ts
// vite.config.ts
proxy: {
  '/api': {
    target: process.env.API_TARGET ?? 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api/, ''),
  }
}
```

- **Local sem Docker:** `API_TARGET` não definido → proxy aponta para `http://localhost:8000`
- **Docker Compose:** `API_TARGET=http://api:8000` → proxy aponta para o container `api`

### Variável de ambiente

```env
VITE_API_URL=http://localhost:8000   # URL direta (sem proxy)
```

Se não definida, o cliente usa `http://localhost:8000` como padrão.

---

## Configuração do Ambiente

### Pré-requisitos

- Node.js 20+
- npm (ou pnpm/yarn)

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz de `web/`:

```env
VITE_API_URL=http://localhost:8000
```

Em produção, aponte para a URL pública da API.

---

## Início Rápido

### Modo local (sem Docker)

```bash
# Na pasta web/
cd web

# Instalar dependências
npm install

# Subir servidor de desenvolvimento
npm run dev
# → http://localhost:5174
```

A API precisa estar rodando em `http://localhost:8000` para os dados aparecerem. Veja o `README.md` na raiz do projeto para subir a API.

### Fluxo de acesso

1. Acesse `http://localhost:5174` — landing page pública
2. Clique em **Acesso Admin** ou navegue para `/admin/login`
3. Entre com a API key: `streetsat-2026`
4. Explore o dashboard, mapa, ocorrências e métricas do modelo

---

## Docker

O `docker-compose.yml` na raiz do projeto inclui o serviço `web`:

```bash
# Subir tudo (API + frontend + infraestrutura)
docker-compose up --build

# Frontend disponível em:
# http://localhost:5174
```

O container do frontend monta `src/` e `public/` como volumes para hot reload:

```yaml
volumes:
  - ./web/src:/app/src
  - ./web/public:/app/public
```

Alterações em arquivos `.tsx`, `.ts` e `.css` dentro de `src/` são refletidas imediatamente sem reiniciar o container.

---

## Scripts Disponíveis

```bash
# Servidor de desenvolvimento com HMR
npm run dev

# Build de produção (TypeScript + Vite)
npm run build

# Preview do build de produção
npm run preview

# Lint (ESLint)
npm run lint
```

### Verificação de tipos

```bash
npx tsc --noEmit
```

---

## Estrutura de Pastas

```
web/src/
├── lib/
│   ├── api.ts              # Cliente HTTP centralizado
│   ├── motion-tokens.ts    # Variantes e tokens Framer Motion
│   └── hooks/
│       └── useRealtime.ts  # Hook de polling para dados em tempo real
│
├── pages/
│   ├── landing/
│   │   ├── LandingPage.tsx             # Orquestrador da landing
│   │   ├── components/
│   │   │   ├── AnimatedCounter.tsx     # Contador numérico animado
│   │   │   ├── ParticlesBackground.tsx # Partículas flutuantes (canvas)
│   │   │   ├── RoadAnimation.tsx       # Animação de rodovia no hero
│   │   │   ├── ScrollProgressBar.tsx   # Barra de progresso de scroll
│   │   │   ├── SectionBadge.tsx        # Badge de seção (ex: "Arquitetura")
│   │   │   └── StarfieldCanvas.tsx     # Starfield parallax (canvas)
│   │   └── sections/
│   │       ├── NavbarSection.tsx       # Header fixo com blur transition
│   │       ├── HeroSection.tsx         # Hero com parallax multicamada
│   │       ├── ProblemSection.tsx      # Estatísticas de acidentes
│   │       ├── StatsSection.tsx        # 4 métricas do sistema
│   │       ├── HowItWorksSection.tsx   # Timeline do pipeline
│   │       ├── ArchitectureSection.tsx # Scroll horizontal (3 camadas)
│   │       ├── LiveFeedSection.tsx     # Feed ao vivo de ocorrências
│   │       ├── CTASection.tsx          # Call-to-action
│   │       └── FooterSection.tsx       # Rodapé
│   │
│   └── admin/
│       ├── AdminLayout.tsx     # Sidebar colapsável + outlet
│       ├── LoginPage.tsx       # Autenticação por API key
│       ├── DashboardPage.tsx   # Visão geral e gráficos
│       ├── MapPage.tsx         # Mapa interativo (React Leaflet)
│       ├── OccurrencesPage.tsx # Tabela de ocorrências ARTESP
│       ├── ModelPage.tsx       # Métricas e importâncias do Random Forest
│       └── AlertsPage.tsx      # Alertas ativos
│
├── components/
│   ├── charts/
│   │   ├── HeatmapChart.tsx         # Mapa de calor de risco por hora/dia
│   │   ├── ModelMetricsChart.tsx    # Gráfico de métricas do modelo
│   │   ├── OccurrencesTimeline.tsx  # Timeline de ocorrências
│   │   └── RiskDonutChart.tsx       # Donut chart de distribuição de risco
│   ├── map/
│   │   ├── RiskMap.tsx     # Container do mapa Leaflet
│   │   └── RiskMarker.tsx  # Marcador colorido por score de risco
│   └── realtime/
│       ├── AlertBanner.tsx          # Banner de alerta no topo
│       └── LiveOccurrencesFeed.tsx  # Feed com cards de ocorrências
│
├── router.tsx    # Definição de rotas (React Router v7)
├── main.tsx      # Entry point React
└── index.css     # Tokens CSS (@theme), utilitários, @keyframes
```

---

## Dependências Principais

| Pacote | Versão | Uso |
|---|---|---|
| `react` | 18 | UI framework |
| `react-router` | 7 | Roteamento |
| `motion` (Framer Motion) | latest | Animações e scroll effects |
| `@tailwindcss/vite` | v4 | Utility-first CSS com `@theme` tokens |
| `react-leaflet` | latest | Mapas interativos |
| `leaflet` | latest | Biblioteca de mapas base |
| `lucide-react` | latest | Ícones SVG |
| `vite` | 6 | Build tool e dev server |
| `typescript` | 5 | Tipagem estática |

---

*Streetsat Frontend — FIAP GS2 2026*
