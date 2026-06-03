import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { useOccurrencesStore } from '@/stores/occurrencesStore'
import type { Occurrence } from '@/lib/utils'

export function AlertBanner() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const { occurrences } = useOccurrencesStore()

  useEffect(() => {
    const critical = occurrences.find((o: Occurrence) => o.risk_score === 3)
    if (critical) {
      setMessage(`Alerta Crítico — BR-${critical.br} km ${critical.km} · ${critical.municipio}/${critical.uf}`)
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 10_000)
      return () => clearTimeout(t)
    }
  }, [occurrences])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            background: 'rgba(239,68,68,0.15)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(239,68,68,0.4)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="animate-pulse-ring-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: '#ef4444', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem' }}>
              {message}
            </span>
          </div>
          <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
