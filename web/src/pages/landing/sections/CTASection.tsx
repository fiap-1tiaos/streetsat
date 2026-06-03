import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { useNavigate } from 'react-router'
import { SectionBadge } from '../components/SectionBadge'
import { fadeUp, stagger, VIEWPORT } from '@/lib/motion-tokens'

export function CTASection() {
  const ref      = useRef<HTMLElement>(null)
  const inView   = useInView(ref, VIEWPORT)
  const navigate = useNavigate()

  return (
    <section
      ref={ref}
      className="relative py-36 px-6 overflow-hidden text-center"
      style={{ background: '#020408' }}
    >
      {/* Dramatic radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,212,255,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="flex flex-col items-center gap-6"
        >
          <motion.div variants={fadeUp}>
            <SectionBadge label="Comece agora" color="cyan" />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="font-display font-bold leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
          >
            Rodovias mais seguras{' '}
            <br className="hidden md:block" />
            começam com dados em{' '}
            <span className="text-[#00d4ff]">tempo real.</span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-slate-500 text-lg leading-relaxed max-w-lg"
          >
            Acesse o painel para visualizar ocorrências, alertas e métricas do
            modelo Random Forest ao vivo.
          </motion.p>

          {/* Primary CTA */}
          <motion.div variants={fadeUp}>
            <motion.button
              onClick={() => navigate('/admin/login')}
              whileHover={{ scale: 1.03, boxShadow: '0 0 50px rgba(0,212,255,0.25)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-shimmer relative px-10 py-4 rounded-xl font-display font-bold text-lg
                         text-[#00d4ff] border border-[rgba(0,212,255,0.4)]
                         bg-[rgba(0,212,255,0.08)] hover:bg-[rgba(0,212,255,0.14)]
                         transition-colors duration-300 cursor-pointer overflow-hidden"
            >
              Acessar Painel Admin →
            </motion.button>
          </motion.div>

          {/* Social proof line */}
          <motion.p
            variants={fadeUp}
            className="text-slate-700 text-sm font-mono"
          >
            96.000 acidentes analisados · 847 rodovias · PRF 2025–2026
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
