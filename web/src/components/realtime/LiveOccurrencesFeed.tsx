import { motion, AnimatePresence } from 'motion/react'
import { RISK_LABELS, RISK_COLORS, type Occurrence, timeAgo } from '@/lib/utils'

interface Props {
  occurrences: Occurrence[]
  maxItems?: number
}

export function LiveOccurrencesFeed({ occurrences, maxItems = 8 }: Props) {
  const items = occurrences.slice(0, maxItems)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <AnimatePresence initial={false}>
        {items.map((o) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
            style={{
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: RISK_COLORS[o.risk_score],
                flexShrink: 0,
                boxShadow: `0 0 6px ${RISK_COLORS[o.risk_score]}`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>
                BR-{o.br} · km {o.km}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {o.municipio}/{o.uf} · {o.tipo}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.7rem', color: RISK_COLORS[o.risk_score], fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                {RISK_LABELS[o.risk_score]}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#475569' }}>{timeAgo(o.detectado_em)}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
