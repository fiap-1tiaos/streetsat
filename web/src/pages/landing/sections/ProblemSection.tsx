import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { AlertTriangle, Clock, MapPin } from 'lucide-react'
import { SectionBadge } from '../components/SectionBadge'
import { AnimatedCounter } from '../components/AnimatedCounter'
import { fadeUp, stagger, VIEWPORT } from '@/lib/motion-tokens'

const facts = [
  {
    icon: Clock,
    value: 90,
    suffix: 'min',
    prefix: '1 morte /',
    label: 'mortalidade nas rodovias',
    sub: 'dados CCM-ARTESP 2026',
    color: '#ef4444',
  },
  {
    icon: MapPin,
    value: 160,
    suffix: '+',
    prefix: '',
    label: 'rodovias paulistas',
    sub: 'sem monitoramento contínuo',
    color: '#f59e0b',
  },
  {
    icon: AlertTriangle,
    value: 18000,
    suffix: '+',
    prefix: '',
    label: 'ocorrências registradas',
    sub: 'CCM-ARTESP 2026, base de treino',
    color: '#f97316',
  },
]

export function ProblemSection() {
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, VIEWPORT)

  return (
    <section
      ref={ref}
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: '#020408' }}
    >
      {/* Subtle red nebula */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(239,68,68,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Label */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="text-center mb-6"
        >
          <SectionBadge label="O Problema" color="red" />
        </motion.div>

        {/* Big stat */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          transition={{ delay: 0.1 }}
          className="text-center mb-16"
        >
          <h2
            className="font-display font-bold leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            Rodovias paulistas registram mais de{' '}
            <span className="text-red-400">
              {inView ? (
                <AnimatedCounter value={5500} suffix="" />
              ) : (
                '0'
              )}{' '}
              pessoas por ano
            </span>
          </h2>
          <p className="text-slate-500 mt-4 text-base max-w-lg mx-auto leading-relaxed">
            por falta de monitoramento em tempo real e roteamento de risco.
          </p>
        </motion.div>

        {/* Fact cards */}
        <motion.div
          variants={stagger(0.15)}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {facts.map(fact => (
            <motion.div
              key={fact.label}
              variants={fadeUp}
              className="glass-card rounded-2xl p-8 text-center"
              whileHover={{ scale: 1.02, boxShadow: `0 0 24px ${fact.color}22` }}
            >
              <fact.icon
                size={28}
                className="mx-auto mb-4"
                style={{ color: fact.color }}
              />
              <div
                className="font-mono font-bold leading-none mb-3"
                style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', color: fact.color }}
              >
                {fact.prefix && (
                  <span className="text-slate-400 text-base font-normal mr-1">
                    {fact.prefix}
                  </span>
                )}
                {inView ? (
                  <AnimatedCounter value={fact.value} suffix={fact.suffix} />
                ) : (
                  '0'
                )}
              </div>
              <div className="font-display font-semibold text-slate-200 text-sm mb-1">
                {fact.label}
              </div>
              <div className="text-[0.7rem] text-slate-600 font-mono">{fact.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Transition hint */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-500 mt-14 text-sm"
        >
          O{' '}
          <span className="text-[#00d4ff] font-semibold">Streetsat</span>{' '}
          resolve isso com IA e monitoramento contínuo.
        </motion.p>
      </div>
    </section>
  )
}
