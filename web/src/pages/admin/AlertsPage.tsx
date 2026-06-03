import { useState } from 'react'
import { motion } from 'motion/react'
import { Bell, Send } from 'lucide-react'
import { RISK_LABELS, RISK_COLORS, type Alert, formatDate } from '@/lib/utils'

const MOCK_ALERTS: Alert[] = Array.from({ length: 12 }, (_, i) => ({
  id: `ALT-${String(i + 1).padStart(3, '0')}`,
  message: `Risco Crítico detectado na BR-${[101, 116, 381][i % 3]} km ${150 + i * 20} — ${['Tombamento de carreta', 'Colisão múltipla', 'Atropelamento'][i % 3]}`,
  risk_score: (i % 2 === 0 ? 3 : 2) as 2 | 3,
  br: [101, 116, 381][i % 3],
  municipio: ['São Paulo', 'Curitiba', 'Betim'][i % 3],
  timestamp: new Date(Date.now() - i * 3_600_000).toISOString(),
  status: (i % 3 === 0 ? 'mock' : 'sent') as 'mock' | 'sent',
}))

export default function AlertsPage() {
  const [alerts] = useState<Alert[]>(MOCK_ALERTS)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [filterScore, setFilterScore] = useState<number>(0)
  const [dateFilter, setDateFilter] = useState('')

  const filtered = alerts.filter(
    (a) => a.risk_score >= filterScore &&
      (!dateFilter || a.timestamp.slice(0, 10) === dateFilter)
  )

  const testAlert = () => {
    setToastMsg('Alerta de teste enviado via SNS (mock) — BR-116 km 225')
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4000)
  }

  return (
    <div>
      {/* Toast */}
      {toastVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed', top: '80px', right: '1.5rem', zIndex: 999,
            padding: '0.75rem 1.25rem',
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: '8px',
            color: '#22c55e',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: '0.85rem',
            backdropFilter: 'blur(12px)',
            maxWidth: '380px',
          }}
        >
          ✓ {toastMsg}
        </motion.div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748b', marginRight: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>Score:</label>
            {[2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setFilterScore(filterScore === s ? 0 : s)}
                style={{
                  marginRight: '0.3rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '5px',
                  border: `1px solid ${RISK_COLORS[s as 2 | 3]}${filterScore === s ? '88' : '33'}`,
                  background: filterScore === s ? RISK_COLORS[s as 2 | 3] + '22' : 'transparent',
                  color: RISK_COLORS[s as 2 | 3],
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                }}
              >
                {RISK_LABELS[s as 2 | 3]}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '0.3rem 0.6rem',
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </div>

        <motion.button
          onClick={testAlert}
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0,212,255,0.2)' }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: '8px',
            color: '#00d4ff',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <Send size={14} />
          Testar Alerta
        </motion.button>
      </div>

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card"
            style={{ borderRadius: '10px', padding: '1rem 1.25rem', borderLeft: `3px solid ${RISK_COLORS[alert.risk_score]}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Bell size={16} color={RISK_COLORS[alert.risk_score]} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#475569', marginBottom: '0.25rem' }}>{alert.id}</div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.5 }}>{alert.message}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', background: RISK_COLORS[alert.risk_score] + '22', color: RISK_COLORS[alert.risk_score], border: `1px solid ${RISK_COLORS[alert.risk_score]}44` }}>
                  {RISK_LABELS[alert.risk_score]}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                  {alert.status === 'sent' ? '✓ SNS' : '◌ Mock'}
                </span>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', paddingLeft: '1.75rem' }}>
              {formatDate(alert.timestamp)} · BR-{alert.br} · {alert.municipio}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
