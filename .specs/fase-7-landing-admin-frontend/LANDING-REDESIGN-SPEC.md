# Spec — Landing Page Redesign Completo
## Streetsat · Fase 7 · Frontend Overhaul

**Versão:** 1.0  
**Data:** 2026-05-31  
**Autora:** Uma (UX Design Expert)  
**Status:** APROVADO PARA IMPLEMENTAÇÃO

---

## 1. Diagnóstico: Por que parece "feito por IA"

### Problemas identificados no código atual

| Problema | Arquivo(s) | Impacto Visual |
|---|---|---|
| **Inline styles em todo lugar** | Todas as sections | Inconsistência, impossível manter |
| **Emojis como ícones** | `StatsSection.tsx` (🛣️🗺️🤖⚡) | Imaturidade visual imediata |
| **Todas as seções têm a mesma estrutura** | Todas | Sem ritmo, sem surpresa |
| **Sem navbar/header** | `LandingPage.tsx` | Sem orientação, parece inacabado |
| **Animações básicas só por useInView** | Todas as sections | Sem profundidade de motion |
| **Sem seção de problema/contexto** | — | Narrativa vazia |
| **Cards idênticos em todo projeto** | `glass-card` everywhere | Sem hierarquia visual |
| **Tipografia plana** | Todas as sections | Sem contraste tipográfico |
| **Background sólido sem variação** | #020408 / #060d16 | Profundidade zero |
| **Sem "wow moments"** | — | Nada memorável |

### O que um site profissional tem e o atual não tem

- Scroll-driven animations com `useScroll` + `useTransform` (parallax real)
- Sticky header que muda de estado ao rolar
- Seções que "respiram" — espaçamento generoso e variado
- Ícones vetoriais profissionais (Lucide React) em vez de emojis
- Tipografia com variação de peso, tamanho e cor por nível hierárquico
- "Aha moment" visual — pelo menos 2 seções que surpreendem
- Motion com intenção — cada animação serve um propósito narrativo
- Rodapé real com conteúdo, não apenas texto monospace

---

## 2. Stack de Implementação

```
Já instalado e compatível (NENHUMA dependência nova necessária):
  motion@12.x      → scroll animations, layout, gestures
  lucide-react     → ícones vetoriais profissionais
  tailwindcss v4   → utility classes (substituir inline styles)
  
Padrões a adotar:
  CSS custom properties via @theme (globals.css já correto)
  Tailwind classes ao invés de style={{}}
  Componentes atômicos reutilizáveis
```

---

## 3. Nova Arquitetura de Componentes

### 3.1 Estrutura de Arquivos Nova

```
src/pages/landing/
├── LandingPage.tsx              ← orquestrador (sem mudança de responsabilidade)
├── sections/
│   ├── NavbarSection.tsx        ← NOVO — sticky header
│   ├── HeroSection.tsx          ← REESCREVER completamente
│   ├── ProblemSection.tsx       ← NOVO — "O problema" com dados reais
│   ├── StatsSection.tsx         ← REESCREVER — remover emojis, redesenhar
│   ├── HowItWorksSection.tsx    ← REESCREVER — pipeline visual
│   ├── ArchitectureSection.tsx  ← REESCREVER — horizontal scroll no desktop
│   ├── LiveFeedSection.tsx      ← MELHORAR — mantém lógica, redesenha visual
│   └── CTASection.tsx           ← REESCREVER — full-bleed, mais impactante
└── components/
    ├── StarfieldCanvas.tsx      ← MANTER (já funciona bem)
    ├── ParticlesBackground.tsx  ← MANTER
    ├── RoadAnimation.tsx        ← MANTER
    ├── AnimatedCounter.tsx      ← MANTER
    ├── SectionBadge.tsx         ← NOVO — label de seção padronizado
    └── ScrollProgressBar.tsx    ← NOVO — barra de progresso de leitura
```

---

## 4. Design System — Tokens de Motion

Todos os componentes devem seguir estes valores. Não hardcodar durações.

```tsx
// src/lib/motion-tokens.ts
export const motionTokens = {
  // Durações
  fast: 0.3,
  base: 0.5,
  slow: 0.8,
  crawl: 1.2,

  // Easings
  ease: [0.25, 0.1, 0.25, 1],
  easeOut: [0, 0, 0.2, 1],
  spring: { type: 'spring', stiffness: 280, damping: 30 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 20 },

  // Viewport margins para useInView
  sectionMargin: '-80px',
  cardMargin: '-40px',
}

// Variants reutilizáveis
export const fadeUpVariant = {
  hidden: { opacity: 0, y: 48 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0, 0, 0.2, 1] } },
}

export const staggerContainer = (stagger = 0.1) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
})

export const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] } },
}
```

---

## 5. Especificação por Seção

---

### 5.1 NavbarSection — NOVO

**Objetivo:** Orientar o usuário, comunicar profissionalismo desde o primeiro pixel.

**Comportamento:**
- `position: fixed`, `top: 0`, `width: 100%`, `z-index: 50`
- Estado inicial: transparente, sem blur
- Ao rolar > 80px: `backdrop-filter: blur(20px)`, `background: rgba(2,4,8,0.85)`, `border-bottom: 1px solid rgba(0,212,255,0.08)`
- Transição de estado via `motion.nav` com `animate` no blur/background

**Layout:**
```
[Logo]                    [nav links]          [CTA Button]
🛰️ Streetsat      Home · Como funciona · Arquitetura · Demo     [Acesso Admin →]
```

**Componente:**
```tsx
'use client' // ou não — é React puro

function NavbarSection() {
  const [scrolled, setScrolled] = useState(false)
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4"
      animate={{
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
        backgroundColor: scrolled ? 'rgba(2,4,8,0.85)' : 'rgba(2,4,8,0)',
        borderBottomColor: scrolled ? 'rgba(0,212,255,0.08)' : 'rgba(0,212,255,0)',
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2 font-display font-bold text-lg">
        <span className="text-cyan-400">🛰️</span>
        <span className="text-white">Street</span>
        <span className="text-cyan-400">sat</span>
      </a>

      {/* Nav Links (hidden mobile) */}
      <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
        {['Como funciona', 'Arquitetura', 'Demo ao vivo'].map(link => (
          <a key={link} href={`#${link}`}
             className="hover:text-white transition-colors duration-200">{link}</a>
        ))}
      </nav>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="px-4 py-2 rounded-lg border border-cyan-400/30 text-cyan-400 
                   text-sm font-semibold hover:border-cyan-400/60 hover:bg-cyan-400/5
                   transition-colors duration-200"
      >
        Acesso Admin →
      </motion.button>
    </motion.nav>
  )
}
```

**Tokens usados:** `--color-cyan`, `--font-display`, `--color-void`

---

### 5.2 HeroSection — REESCREVER

**Objetivo:** Primeiro impacto memorável. Deve fazer o usuário parar e prestar atenção.

**Mudanças críticas em relação ao atual:**
- Adicionar `paddingTop: 80px` para compensar o navbar fixed
- Substituir o scroll de palavras por um reveal de frase inteira com `clipPath`
- Adicionar `useScroll` + `useTransform` para parallax real nos backgrounds
- Adicionar uma visualização de dados abstrata (não apenas partículas)
- O tagline azul deve ter um efeito de gradiente animado, não apenas glow estático

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [badge: FIAP GS2 · 2026]                           │
│                                                     │
│  Monitoramento Inteligente                          │  ← text reveal clip
│  de Rodovias Brasileiras                            │
│  via IA + Satélite                                  │  ← gradient animado
│                                                     │
│  [subtítulo]                                        │
│                                                     │
│  [Ver Demo ▶]     [Acesso Admin]                    │
│                                                     │
│              ↓ scroll                               │
└─────────────────────────────────────────────────────┘
[StarfieldCanvas + Particles em z-layers atrás]
[RoadAnimation embaixo com opacidade 0.12]
```

**Motion spec:**
```tsx
// Reveal com clipPath — mais profissional que word-by-word
<motion.h1
  initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0.5 }}
  animate={{ clipPath: 'inset(0% 0 0 0)', opacity: 1 }}
  transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
>
  Monitoramento Inteligente de Rodovias
</motion.h1>

// Linha 2 — gradiente animado
<motion.span
  className="block bg-gradient-to-r from-cyan-400 via-cyan-200 to-cyan-400 
             bg-clip-text text-transparent bg-[size:200%]"
  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
>
  via Satélite e Inteligência Artificial
</motion.span>

// Parallax nos backgrounds via scroll
const { scrollYProgress } = useScroll()
const starfieldY = useTransform(scrollYProgress, [0, 1], [0, -120])
const roadY = useTransform(scrollYProgress, [0, 0.5], [0, 60])
```

**Micro-detalhe importante:** Adicionar uma linha de código de terminal animada abaixo do subtítulo:
```
> modelo carregado: random_forest_v3.pkl  [████████████] 100%  ✓ 52% acurácia
```
Isso vai de 0% a 100% quando o hero entra — detalhe que profissionais percebem.

---

### 5.3 ProblemSection — NOVO

**Objetivo:** Criar empatia e urgência antes de apresentar a solução.

**Conteúdo:**
```
"Acidentes em rodovias brasileiras custam R$ 40 bilhões por ano"

[Estatística impactante]    [Estatística impactante]    [Estatística impactante]
  1 morte a cada           Rodovias sem               48h de demora para
  90 minutos               monitoramento contínuo     dados chegarem ao público
```

**Layout no desktop:**
```
┌─── Fundo: #020408 com gradient radial vermelho muito sutil ───┐
│                                                               │
│  [Label: "O Problema"]                                        │
│                                                               │
│  "Rodovias brasileiras matam mais de"                         │
│  5.500 pessoas / ano                    ← número enorme       │
│  "por falta de monitoramento em tempo real"                   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │ 1 morte  │  │ 847 BRs  │  │ 96k     │                    │
│  │ /90min   │  │ sem RT   │  │ acidentes│                    │
│  │ (PRF)    │  │ monitor  │  │ analisados│                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
│                                                               │
│  "O Streetsat resolve isso"  ← transição para próxima seção   │
└───────────────────────────────────────────────────────────────┘
```

**Motion spec:**
- Número "5.500" entra com CountUp de 0 → 5500 enquanto está em view
- Os 3 cards entram com `staggerChildren: 0.15`
- Background gradient pulsa suavemente em vermelho → transparente (opacity 0.03 max)

---

### 5.4 StatsSection — REESCREVER

**O que mudar:**
1. Remover todos os emojis — substituir por ícones SVG Lucide React
2. Remover inline styles — usar Tailwind
3. Redesenhar layout para horizontal em desktop, com separadores verticais
4. Adicionar subtexto contextual abaixo de cada número

**Ícones Lucide para cada stat:**
```
Acidentes analisados  → <Activity /> (onda de sinal)
Rodovias monitoradas  → <Route />    (trajeto)
Acurácia do modelo    → <BrainCircuit /> (ML)
Tempo de resposta     → <Zap />      (raio)
```

**Layout redesenhado (horizontal em desktop):**
```
┌──────────────────────────────────────────────────────────────┐
│     96.000+          847            52%           < 2s        │
│   [Activity]       [Route]     [BrainCircuit]    [Zap]        │
│  acidentes PRF    rodovias BR  Random Forest    por query     │
│     ─────────────────┼───────────────┼──────────────          │
│                   separadores verticais sutis                  │
└──────────────────────────────────────────────────────────────┘
```

**Motion spec:**
```tsx
// Linha separadora que cresce da esquerda para direita conforme scroll
<motion.div
  className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
  initial={{ scaleX: 0 }}
  animate={isInView ? { scaleX: 1 } : {}}
  transition={{ duration: 1.2, ease: 'easeInOut' }}
/>
```

---

### 5.5 HowItWorksSection — REESCREVER

**O que mudar:**
1. Substituir os SVGs inline por ícones Lucide
2. Criar uma linha conectora que se "preenche" conforme o scroll avança
3. Adicionar números grandes de etapa em background (decorativo)
4. Melhorar o espaçamento entre cards

**Novo visual:**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   [Label: "Como funciona"]                                       │
│                                                                  │
│   01          ────────────►  02         ────────────►  03       │
│                                                                  │
│  ┌─────────┐              ┌─────────┐              ┌─────────┐  │
│  │[Satellite]             │[BrainCir]              │[Bell]   │  │
│  │ Coleta  │              │   IA    │              │ Alerta  │  │
│  │         │              │         │              │         │  │
│  │ PRF CSV │              │ RF + NLP│              │Dijkstra │  │
│  │NASA PWR │              │ AWS Comp│              │ + SNS   │  │
│  └─────────┘              └─────────┘              └─────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**A linha conectora que preenche:**
```tsx
// SVG com stroke-dashoffset animado pelo scroll
const { scrollYProgress } = useScroll({ target: sectionRef })
const pathLength = useTransform(scrollYProgress, [0.1, 0.6], [0, 1])

<svg className="absolute top-[60px] left-[20%] right-[20%]">
  <motion.path
    d="M0,0 L100%,0"
    stroke="rgba(0,212,255,0.4)"
    strokeWidth="1"
    fill="none"
    style={{ pathLength }}
  />
</svg>
```

---

### 5.6 ArchitectureSection — REESCREVER

**Mudança fundamental:** Horizontal scroll no desktop (pinned scroll).

**Desktop:** A seção fica "grudada" na viewport enquanto o usuário rola verticalmente. Internamente, os 3 cards se movem da direita para a esquerda — criando um efeito de scroll horizontal controlado pelo scroll vertical.

**Mobile:** Stack vertical normal (fallback).

**Spec de implementação:**
```tsx
function ArchitectureSection() {
  const sectionRef = useRef<HTMLElement>(null)
  
  // Scroll progress da seção
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Cards se movem de x=100vw até x=0 conforme scroll
  const x = useTransform(scrollYProgress, [0, 1], ['66vw', '0vw'])

  return (
    // section tem height: 300vh para criar "espaço" de scroll
    <section ref={sectionRef} className="relative h-[300vh]">
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-8 px-24">
          {layers.map(layer => (
            <ArchLayer key={layer.num} {...layer} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

**Visual de cada card de layer:**
```
┌──────────────────────────────────┐
│  01                 [cor: verde] │  ← número grande, opacity 0.1
│                                  │
│  ┌───────────────────────────┐   │
│  │  Scoring ML               │   │
│  │  Random Forest · scikit   │   │
│  │                           │   │
│  │  14 features →            │   │
│  │  [████] 52% accuracy      │   │
│  │                           │   │
│  │  Classifica em 4 níveis:  │   │
│  │  ● Livre  ● Atenção       │   │
│  │  ● Alto   ● Crítico       │   │
│  └───────────────────────────┘   │
└──────────────────────────────────┘
```

---

### 5.7 LiveFeedSection — MELHORAR

**O que mantém:** Lógica de polling, ticker horizontal, mapa miniatura.

**O que muda:**
1. Adicionar cabeçalho da seção com label e status indicator "AO VIVO"
2. Redesenhar o ticker com visual mais refinado (sem emojis, com badges de score)
3. Mapa com border radius e glassmorphism no container

**Badge de status "AO VIVO":**
```tsx
<span className="flex items-center gap-2 px-3 py-1 rounded-full 
                 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
  AO VIVO
</span>
```

---

### 5.8 CTASection — REESCREVER

**Mudança:** Full-bleed com gradiente dramático, não mais um card centralizado pequeno.

**Visual:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         [gradiente radial cyan muito sutil no centro]           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │   Rodovias mais seguras                                  │   │
│  │   começam com dados em                                   │   │
│  │   tempo real.                                            │   │
│  │                                                          │   │
│  │   [  Acessar Painel Admin  →  ]                          │   │
│  │                                                          │   │
│  │   "96.000 acidentes analisados. 847 rodovias."           │   │
│  │   Dados PRF 2025–2026 · FIAP Global Solution 2           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**O botão CTA principal:**
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="relative px-8 py-4 rounded-xl font-display font-bold text-lg
             bg-gradient-to-r from-cyan-500/20 to-cyan-400/10
             border border-cyan-400/40 text-cyan-300
             hover:border-cyan-400/70 hover:bg-cyan-400/15
             transition-all duration-300 overflow-hidden group"
>
  {/* Shimmer interno */}
  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%]
                   bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent
                   transition-transform duration-700" />
  <span className="relative">Acessar Painel Admin →</span>
</motion.button>
```

---

### 5.9 FooterSection — NOVO

**O atual:** Apenas links de texto no final do CTASection.
**O novo:** Um rodapé real, separado e completo.

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] Streetsat                                    [2026]     │
│                                                                 │
│  Monitoramento inteligente de rodovias via satélite e IA.       │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│                                                                 │
│  ODS 8 · Trabalho Decente    ODS 9 · Infraestrutura             │
│  ODS 11 · Cidades Sustentáveis    ODS 13 · Ação Climática       │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│                                                                 │
│  FIAP Global Solution 2 · 2026     GitHub     Acesso Admin      │
│                            Streetsat © 2026                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Componentes Novos Reutilizáveis

### 6.1 SectionBadge

Padroniza os labels de seção em todo o site. Atualmente cada seção tem implementação diferente ou nenhuma.

```tsx
// src/pages/landing/components/SectionBadge.tsx
interface SectionBadgeProps {
  label: string
  color?: 'cyan' | 'amber' | 'green' | 'red'
}

export function SectionBadge({ label, color = 'cyan' }: SectionBadgeProps) {
  const colorMap = {
    cyan:  'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
    amber: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    green: 'text-green-400 border-green-400/30 bg-green-400/5',
    red:   'text-red-400 border-red-400/30 bg-red-400/5',
  }
  
  return (
    <motion.span
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`inline-flex items-center px-3 py-1 rounded-full border
                  text-xs font-mono tracking-widest uppercase
                  ${colorMap[color]}`}
    >
      {label}
    </motion.span>
  )
}
```

**Uso em cada seção:**
```tsx
<SectionBadge label="O Problema" color="red" />
<SectionBadge label="Métricas" color="cyan" />
<SectionBadge label="Como funciona" color="cyan" />
<SectionBadge label="Arquitetura" color="amber" />
```

### 6.2 ScrollProgressBar

Barra sutil no topo da página que mostra progresso de leitura.

```tsx
// src/pages/landing/components/ScrollProgressBar.tsx
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 50 })
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r 
                 from-cyan-500 to-cyan-300 origin-left z-[100]"
      style={{ scaleX }}
    />
  )
}
```

---

## 7. Regras de Estilo — O Que Proibir

Para que o redesign não regrida para o aspecto "feito por IA":

| Proibido | Substituir por |
|---|---|
| `style={{ ... }}` inline | Classes Tailwind ou variáveis CSS |
| Emojis como ícones | `lucide-react` ou SVG próprio |
| `animation: neural-pulse 2s ...` inline em style= | Classe CSS em `animations.css` |
| Cores hardcoded `#00d4ff` | `text-cyan-400` ou `var(--color-cyan)` |
| `fontFamily: 'Space Grotesk'` inline | `font-display` (classe Tailwind via @theme) |
| Cards com padding hardcoded `padding: '2rem'` | `p-8` Tailwind |
| `motion.div` sem `variants` em listas | Sempre usar `variants` + `staggerChildren` |

---

## 8. Ordem de Implementação (Prioridade)

### Fase 1 — Fundação (implementar primeiro)
1. `src/lib/motion-tokens.ts` — criar os tokens
2. `SectionBadge.tsx` — componente utilitário
3. `ScrollProgressBar.tsx` — componente utilitário
4. Refatorar `globals.css` — adicionar classes Tailwind para `font-display`, `font-mono`

### Fase 2 — Estrutura (alto impacto)
5. `NavbarSection.tsx` — NOVO
6. `LandingPage.tsx` — adicionar Navbar + ScrollProgressBar + FooterSection
7. `HeroSection.tsx` — REESCREVER (maior impacto visual)

### Fase 3 — Seções (uma por vez)
8. `ProblemSection.tsx` — NOVO
9. `StatsSection.tsx` — REESCREVER (remover emojis é urgente)
10. `HowItWorksSection.tsx` — REESCREVER (conectar linha scroll-driven)
11. `ArchitectureSection.tsx` — REESCREVER (horizontal scroll)
12. `CTASection.tsx` — REESCREVER
13. Extrair `FooterSection.tsx` do CTASection

### Fase 4 — Polish
14. `LiveFeedSection.tsx` — MELHORAR visual
15. Revisar motion em mobile (reduzir `prefers-reduced-motion`)
16. Audit de inline styles residuais

---

## 9. Critérios de Aceitação do Redesign

- [ ] Nenhum emoji usado como ícone (substituídos por Lucide React)
- [ ] Nenhum `style={{}}` inline com cor ou fonte hardcoded
- [ ] Navbar fixo com transição de blur ao rolar
- [ ] Barra de progresso de scroll visível
- [ ] `HeroSection` com reveal por `clipPath` (não stagger de palavras)
- [ ] `StatsSection` com ícones Lucide (não emojis)
- [ ] `HowItWorksSection` com linha conectora scroll-driven (SVG `pathLength`)
- [ ] `ArchitectureSection` com sticky + horizontal scroll no desktop
- [ ] `ProblemSection` nova com dados de contexto
- [ ] `CTASection` full-bleed com gradiente dramático
- [ ] `FooterSection` separada e completa
- [ ] Motion tokens centralizados em `motion-tokens.ts`
- [ ] `SectionBadge` componente usado em todas as seções
- [ ] `ScrollProgressBar` ativa na landing page
- [ ] Mobile responsivo (breakpoint `md:` para layouts de grid)
- [ ] `npm run lint` sem erros após rewrite
- [ ] Lighthouse Performance ≥ 80 (verificar com DevTools)

---

## 10. Referências Visuais de Estilo

O redesign deve ter a mesma qualidade visual de:
- **Vercel.com** — limpeza, tipografia forte, animações sutis e intencionais
- **Linear.app** — dark mode profissional, micro-interações polidas
- **Stripe.com** — narrativa visual que educa enquanto impressiona

**NÃO se inspirar em:**
- Templates de portfólio de Framer/Webflow com efeitos excessivos
- Sites com muitos efeitos neon sobrepostos sem propósito
- Anything that looks like it was generated by v0 in 30 seconds

---

*— Uma, desenhando com empatia 💝*  
*Streetsat · FIAP GS2 2026*
