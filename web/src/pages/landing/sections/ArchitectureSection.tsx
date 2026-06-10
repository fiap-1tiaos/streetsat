import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'motion/react'
import { SectionBadge } from '../components/SectionBadge'
import { fadeUp, VIEWPORT } from '@/lib/motion-tokens'

const layers = [
  {
    num: '01',
    title: 'Scoring ML',
    tech: 'Random Forest · scikit-learn · joblib',
    desc: 'Classifica cada trecho em 4 níveis de risco usando 21 features: dados de ocorrências ARTESP, eventos naturais EONET (NASA) e condições climáticas em tempo real.',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.06)',
    border: 'rgba(34,197,94,0.2)',
    features: ['18.000+ ocorrências de treino', '21 features (ARTESP + NASA + clima)', '4 classes de severidade'],
  },
  {
    num: '02',
    title: 'NLP Semântico',
    tech: 'AWS Comprehend · LocalNLP · PT-BR',
    desc: 'Analisa narrativas de ocorrências e aplica boost de severidade (+1 ou +2) baseado em entidades e sentimento detectado.',
    color: '#00d4ff',
    bg: 'rgba(0,212,255,0.06)',
    border: 'rgba(0,212,255,0.2)',
    features: ['Análise de sentimento', 'Extração de entidades', 'Boost de risco semântico'],
  },
  {
    num: '03',
    title: 'Roteamento',
    tech: 'NetworkX · Dijkstra · A*',
    desc: 'Constrói grafo de rodovias com pesos de risco e encontra a rota mais segura usando busca de caminho mínimo otimizado.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    features: ['Grafo de rodovias BR', 'Pesos de risco dinâmicos', 'AWS SNS para alertas'],
  },
]

export function ArchitectureSection() {
  const outerRef  = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const inView    = useInView(headerRef, VIEWPORT)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  })

  // Translates the 300vw container leftward as user scrolls the 300vh section
  const x = useTransform(scrollYProgress, [0, 1], ['0vw', '-200vw'])

  return (
    <section
      id="architecture"
      ref={outerRef}
      // 300vh gives enough scroll room for the 3-card horizontal travel
      className="relative"
      style={{ height: '300vh', background: '#060d16' }}
    >
      {/* Sticky wrapper */}
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
        {/* Section header */}
        <div ref={headerRef} className="flex-shrink-0 text-center pt-16 pb-8 px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
          >
            <SectionBadge label="Arquitetura" color="amber" />
            <h2
              className="font-display font-bold"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
            >
              Pipeline em 3 Camadas
            </h2>
            <p className="text-slate-500 mt-3 text-sm">
              Do dado bruto ao alerta final — role para explorar cada camada
            </p>
          </motion.div>
        </div>

        {/* Horizontal scroll container — 3 painéis fixos de 100vw */}
        <div className="flex-1 flex items-center overflow-hidden">
          <motion.div
            style={{ x, width: '300vw' }}
            className="flex"
          >
            {layers.map((layer, i) => (
              <div
                key={layer.num}
                className="w-screen flex-shrink-0 flex items-center justify-center px-[10vw]"
              >
                <div className="w-full max-w-[520px]">
                  <ArchCard layer={layer} index={i} scrollYProgress={scrollYProgress} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Progress dots */}
        <div className="flex-shrink-0 flex justify-center gap-3 pb-8">
          {layers.map((_, i) => (
            <ProgressDot key={i} index={i} total={layers.length} scrollYProgress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ArchCard({
  layer,
  index,
  scrollYProgress,
}: {
  layer: typeof layers[0]
  index: number
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const start   = index / 3
  const end     = (index + 1) / 3
  const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0.4, 1, 1, 0.4])
  const scale   = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0.94, 1, 1, 0.94])

  return (
    <motion.div
      style={{
        opacity,
        scale,
        background: layer.bg,
        border: `1px solid ${layer.border}`,
        borderRadius: '1rem',
        padding: '2.5rem',
      }}
      whileHover={{ boxShadow: `0 0 40px ${layer.color}18` }}
    >
      {/* Number */}
      <div
        className="font-mono font-bold text-7xl mb-6 select-none"
        style={{ color: layer.color, opacity: 0.12 }}
      >
        {layer.num}
      </div>

      {/* Title + tech */}
      <h3
        className="font-display font-bold text-2xl mb-1"
        style={{ color: layer.color }}
      >
        {layer.title}
      </h3>
      <div className="font-mono text-[0.65rem] text-slate-600 mb-5 tracking-wide">
        {layer.tech}
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed mb-8">
        {layer.desc}
      </p>

      {/* Feature list */}
      <ul className="flex flex-col gap-2.5">
        {layer.features.map(f => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: layer.color }}
            />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function ProgressDot({
  index,
  total,
  scrollYProgress,
}: {
  index: number
  total: number
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const start   = index / total
  const end     = (index + 1) / total
  const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.05, end], [0.3, 1, 1, 0.3])
  const scale   = useTransform(scrollYProgress, [start, start + 0.1, end - 0.05, end], [1, 1.4, 1.4, 1])

  return (
    <motion.div
      className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]"
      style={{ opacity, scale }}
    />
  )
}
