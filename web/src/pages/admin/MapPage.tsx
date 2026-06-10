import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { RiskMapWrapper } from '@/components/RiskMapWrapper'
import { useOccurrencesStore } from '@/stores/occurrencesStore'
import { useHighwaySegments } from '@/hooks/useHighwaySegments'
import { RISK_LABELS, RISK_COLORS, type Occurrence, timeAgo, type RiskScore } from '@/lib/utils'

export default function MapPage() {
  const { occurrences } = useOccurrencesStore()
  const segments = useHighwaySegments(occurrences)
  const [selected, setSelected] = useState<Occurrence | null>(null)
  const [minScore, setMinScore] = useState<RiskScore>(0)
  const [roadFilter, setRoadFilter] = useState('')

  const filtered = occurrences.filter(
    (o: Occurrence) => o.risk_score >= minScore && (!roadFilter || o.road.includes(roadFilter))
  )

  const riskPoints = filtered
    .filter((o) => o.latitude && o.longitude)
    .map((o) => ({
      id: o.occurrence_id,
      lat: o.latitude!,
      lon: o.longitude!,
      road: o.road,
      km: o.km,
      risk_score: o.risk_score,
    }))

  return (
    <div style={{ position: 'relative', height: 'calc(100dvh - 64px - 3rem)', borderRadius: '12px', overflow: 'hidden' }}>
      <RiskMapWrapper segments={segments} riskPoints={riskPoints} height="100%" />

      {/* Floating filter */}
      <div
        className="glass-card-strong"
        style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, borderRadius: '10px', padding: '1rem', minWidth: '200px' }}
      >
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Score mínimo
          </label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {([0, 1, 2, 3] as RiskScore[]).map((s) => (
              <button
                key={s}
                onClick={() => setMinScore(s)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  border: `1px solid ${RISK_COLORS[s]}${minScore === s ? '88' : '33'}`,
                  background: minScore === s ? RISK_COLORS[s] + '22' : 'transparent',
                  color: RISK_COLORS[s],
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                }}
              >
                {s}+
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Rodovia
          </label>
          <input
            type="text"
            value={roadFilter}
            onChange={(e) => setRoadFilter(e.target.value)}
            placeholder="SP-..."
            style={{
              width: '100%',
              padding: '0.4rem 0.6rem',
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
          {filtered.length} marcadores
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="glass-card-strong"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '320px',
              zIndex: 20,
              padding: '1.5rem',
              overflowY: 'auto',
              borderLeft: '1px solid rgba(0,212,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>{selected.occurrence_id}</div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                  {selected.road} · km {selected.km}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <span
              style={{
                display: 'inline-block',
                padding: '0.3rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                background: RISK_COLORS[selected.risk_score] + '22',
                color: RISK_COLORS[selected.risk_score],
                border: `1px solid ${RISK_COLORS[selected.risk_score]}44`,
                marginBottom: '1rem',
              }}
            >
              {RISK_LABELS[selected.risk_score].toUpperCase()} (Score {selected.risk_score})
            </span>

            {[
              ['Município', `${selected.municipio}/${selected.state}`],
              ['Tipo', selected.occurrence_type],
              ['Interdição', ['Livre', 'Parcial', 'Total'][selected.interdiction_level] ?? 'Livre'],
              ['Detectado', timeAgo(selected.detected_at)],
              ...(selected.nlp_sentiment ? [['Sentimento NLP', selected.nlp_sentiment]] : []),
              ...(selected.nlp_boost !== undefined ? [['Boost NLP', `+${selected.nlp_boost}`]] : []),
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{value}</div>
              </div>
            ))}

            {selected.narrative && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.4rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>Narrativa</div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>{selected.narrative}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
