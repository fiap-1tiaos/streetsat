import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useNavigate } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { StarfieldCanvas } from '../components/StarfieldCanvas'
import { ParticlesBackground } from '../components/ParticlesBackground'
import { RoadAnimation } from '../components/RoadAnimation'
import { SectionBadge } from '../components/SectionBadge'

export function HeroSection() {
  const navigate   = useNavigate()
  const heroRef    = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const starfieldY = useTransform(scrollYProgress, [0, 1], [0, -80])
  const roadY      = useTransform(scrollYProgress, [0, 1], [0, 50])
  const contentY   = useTransform(scrollYProgress, [0, 1], [0, 60])
  const contentOp  = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  function scrollToDemo() {
    document.getElementById('live-feed')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={heroRef}
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#020408' }}
    >
      {/* Background layer — starfield */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: starfieldY }}
      >
        <StarfieldCanvas />
      </motion.div>

      {/* Particles layer */}
      <div className="absolute inset-0 z-[1]">
        <ParticlesBackground />
      </div>

      {/* Road animation — bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-[2]"
        style={{ y: roadY }}
      >
        <RoadAnimation />
      </motion.div>

      {/* Radial glow overlay */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,212,255,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-[4] text-center px-6 max-w-4xl w-full"
        style={{ y: contentY, opacity: contentOp }}
      >
        {/* Badge */}
        <div className="flex justify-center">
          <SectionBadge label="FIAP Global Solution 2 · 2026" color="cyan" />
        </div>

        {/* Headline line 1 — clip reveal upward */}
        <div className="overflow-hidden mb-2 mt-4">
          <motion.h1
            className="font-display font-bold leading-[1.15]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            Monitoramento Inteligente de Rodovias
          </motion.h1>
        </div>

        {/* Headline line 2 — gradient animado */}
        <div className="overflow-hidden mb-6">
          <motion.h1
            className="font-display font-bold leading-[1.15] text-gradient-animated"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            via Satélite e Inteligência Artificial
          </motion.h1>
        </div>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-slate-400 max-w-[600px] mx-auto mb-6 leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)' }}
        >
           Sistema de análise de risco em rodovias paulistas com{' '}
          <span className="text-slate-200">Random Forest</span>,{' '}
          <span className="text-slate-200">AWS Comprehend</span> e roteamento{' '}
          <span className="text-slate-200">Dijkstra</span> para trajetos mais seguros.
        </motion.p>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.3 }}
          className="font-mono text-xs text-slate-600 mb-10 flex items-center justify-center gap-4 flex-wrap"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-500">sistema online</span>
          </span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-500">4 níveis de risco</span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <motion.button
            onClick={scrollToDemo}
            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="btn-shimmer px-7 py-3 rounded-xl font-display font-semibold text-sm
                       text-[#00d4ff] border border-[rgba(0,212,255,0.45)]
                       bg-[rgba(0,212,255,0.08)] hover:bg-[rgba(0,212,255,0.14)]
                       transition-colors duration-200 cursor-pointer"
          >
            Ver Demo ao Vivo
          </motion.button>

          <motion.button
            onClick={() => navigate('/admin/login')}
            whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}
            whileTap={{ scale: 0.97 }}
            className="px-7 py-3 rounded-xl font-display font-semibold text-sm
                       text-amber-400 border border-amber-400/35
                       bg-amber-400/[0.07] hover:bg-amber-400/[0.12]
                       transition-colors duration-200 cursor-pointer"
          >
            Acesso Admin
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
        className="animate-scroll-bounce absolute bottom-8 left-1/2 -translate-x-1/2 z-[5]
                   flex flex-col items-center gap-1.5"
      >
        <span className="text-[0.65rem] text-slate-600 tracking-widest uppercase font-mono">
          scroll
        </span>
        <ChevronDown size={16} className="text-slate-600" />
      </motion.div>
    </section>
  )
}

