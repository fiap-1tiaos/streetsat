import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Activity, Map, Brain, Zap } from 'lucide-react'
import { AnimatedCounter } from '../components/AnimatedCounter'
import { SectionBadge } from '../components/SectionBadge'
import { stagger, fadeUp, VIEWPORT } from '@/lib/motion-tokens'

const stats = [
  {
    Icon:   Activity,
    value:  96000,
    suffix: '+',
    label:  'Acidentes analisados',
    sub:    'registros PRF',
    color:  '#00d4ff',
  },
  {
    Icon:   Map,
    value:  847,
    suffix: '',
    label:  'Rodovias monitoradas',
    sub:    'BRs federais',
    color:  '#00d4ff',
  },
  {
    Icon:   Brain,
    value:  52,
    suffix: '%',
    label:  'Acurácia do modelo',
    sub:    'Random Forest',
    color:  '#00d4ff',
  },
  {
    Icon:   Zap,
    value:  2,
    suffix: 's',
    prefix: '< ',
    label:  'Tempo de resposta',
    sub:    'por inferência',
    color:  '#00d4ff',
  },
]

export function StatsSection() {
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, VIEWPORT)

  return (
    <section
      ref={ref}
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: '#060d16' }}
    >
      {/* Coordinate grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated separator line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px origin-left"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.12), transparent)' }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="text-center mb-16"
        >
          <SectionBadge label="Métricas" color="cyan" />
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
          >
            Dados que fazem diferença
          </h2>
          <p className="text-slate-500 mt-3 max-w-md mx-auto leading-relaxed text-sm">
            Treinado com dados reais da Polícia Rodoviária Federal — 2025 e 2026.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(0,212,255,0.06)] rounded-2xl overflow-hidden"
        >
          {stats.map(({ Icon, value, suffix, prefix, label, sub }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              whileHover={{ backgroundColor: 'rgba(0,212,255,0.04)' }}
              className="glass-card p-10 text-center flex flex-col items-center gap-4
                         transition-colors duration-300"
              style={{ borderRadius: 0 }}
            >
              <Icon size={24} className="text-[#00d4ff] opacity-70" />

              <div
                className="font-mono font-bold leading-none text-[#00d4ff]"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
              >
                {prefix && (
                  <span className="text-slate-400 text-lg font-normal">{prefix}</span>
                )}
                {inView ? (
                  <AnimatedCounter value={value} suffix={suffix} />
                ) : (
                  `0${suffix}`
                )}
              </div>

              <div className="text-center">
                <div className="font-display font-semibold text-slate-200 text-sm">
                  {label}
                </div>
                <div className="text-[0.7rem] text-slate-600 font-mono mt-0.5">{sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
