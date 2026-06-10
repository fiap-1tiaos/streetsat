import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { Satellite, Brain, Bell } from 'lucide-react'
import { SectionBadge } from '../components/SectionBadge'
import { stagger, fadeUp, VIEWPORT } from '@/lib/motion-tokens'

const steps = [
  {
    num: '01',
    Icon: Satellite,
    title: 'Coleta',
    desc: 'Dados de ocorrências CCM-ARTESP combinados com eventos naturais (NASA EONET) e condições climáticas via API pública em tempo real.',
    techs: ['CCM-ARTESP', 'NASA EONET', 'Open-Meteo Weather'],
    color: '#00d4ff',
  },
  {
    num: '02',
    Icon: Brain,
    title: 'IA',
    desc: 'Random Forest classifica risco 0–3. AWS Comprehend analisa narrativas e eleva o score via NLP semântico.',
    techs: ['Random Forest', 'AWS Comprehend', 'NLP'],
    color: '#00d4ff',
  },
  {
    num: '03',
    Icon: Bell,
    title: 'Alerta',
    desc: 'Rota otimizada via Dijkstra com pesos de risco. Alertas críticos disparados via AWS SNS com deduplicação de 30 min.',
    techs: ['NetworkX', 'Dijkstra', 'AWS SNS'],
    color: '#f59e0b',
  },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView     = useInView(sectionRef, VIEWPORT)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.8', 'end 0.4'],
  })
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: '#020408' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="text-center mb-20"
        >
          <SectionBadge label="Como funciona" color="cyan" />
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
          >
            Pipeline de ponta a ponta
          </h2>
        </motion.div>

        {/* Steps + connector */}
        <div className="relative">
          {/* SVG connector line (desktop only) */}
          <div className="absolute top-[52px] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] hidden md:block pointer-events-none">
            <svg
              viewBox="0 0 100 4"
              preserveAspectRatio="none"
              className="w-full"
              height="4"
            >
              {/* Track */}
              <line x1="0" y1="2" x2="100" y2="2"
                stroke="rgba(0,212,255,0.1)" strokeWidth="1" />
              {/* Fill */}
              <motion.line
                x1="0" y1="2" x2="100" y2="2"
                stroke="#00d4ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ pathLength }}
                strokeDasharray="1"
                strokeDashoffset="0"
              />
            </svg>
          </div>

          {/* Cards */}
          <motion.div
            variants={stagger(0.2)}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="glass-card rounded-2xl p-8 text-center flex flex-col items-center gap-5"
                whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(0,212,255,0.12)' }}
              >
                {/* Icon circle */}
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `rgba(${step.color === '#f59e0b' ? '245,158,11' : '0,212,255'},0.07)`,
                    border: `1px solid ${step.color}30`,
                  }}
                >
                  <step.Icon
                    size={30}
                    style={{ color: step.color }}
                  />
                </div>

                {/* Step number */}
                <div
                  className="font-mono text-[0.65rem] tracking-widest uppercase"
                  style={{ color: step.color, opacity: 0.7 }}
                >
                  Etapa {i + 1}
                </div>

                <h3 className="font-display font-bold text-2xl -mt-2">
                  {step.title}
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed">
                  {step.desc}
                </p>

                <div className="flex gap-2 flex-wrap justify-center">
                  {step.techs.map(t => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full font-mono text-[0.65rem]"
                      style={{
                        border: `1px solid ${step.color}30`,
                        color: step.color,
                        background: `${step.color}08`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
