import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { Bell, MapPin, Users } from 'lucide-react'
import { useRealtime } from '@/hooks/useRealtime'
import { api, type AlertResponse } from '@/lib/api'
import { RISK_LABELS, RISK_COLORS, type Alert, formatDate } from '@/lib/utils'

function toAlert(r: AlertResponse): Alert {
  return {
    id: r.id,
    message: r.message,
    risk_score: r.risk_score as Alert['risk_score'],
    road: r.road,
    km: r.km,
    municipio: r.municipio,
    occurrence_type: r.occurrence_type,
    risk_label: r.risk_label,
    criticality: r.criticality,
    victims_total: r.victims_total,
    narrative: r.narrative,
    latitude: r.latitude,
    longitude: r.longitude,
    detected_at: r.detected_at,
    status: r.status,
  }
}

export default function AlertsPage() {
  const fetcher = useCallback(() => api.alerts(), [])
  const { data: items, refetch } = useRealtime({ fetcher, intervalMs: 30_000 })
  const alerts = (items ?? []).map(toAlert)
  const [filterScore, setFilterScore] = useState<number>(0)
  const [dateFilter, setDateFilter] = useState('')

  const filtered = alerts.filter(
    (a) => a.risk_score >= filterScore &&
      (!dateFilter || a.detected_at.slice(0, 10) === dateFilter)
  )

  return (
    <div>
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <motion.button
            onClick={() => refetch()}
            whileHover={{ scale: 1.02 }}
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
            Atualizar
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
            Nenhum alerta encontrado
          </div>
        )}
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
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: 1 }}>
                <Bell size={16} color={RISK_COLORS[alert.risk_score]} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#475569', marginBottom: '0.25rem' }}>{alert.id}</div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.5 }}>{alert.message}</p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                    {alert.km != null && (
                      <span>KM {alert.km}</span>
                    )}
                    {alert.municipio && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={10} /> {alert.municipio}
                      </span>
                    )}
                    {alert.occurrence_type && (
                      <span>{alert.occurrence_type}</span>
                    )}
                    {alert.victims_total != null && alert.victims_total > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: alert.victims_total > 2 ? '#ef4444' : '#f59e0b' }}>
                        <Users size={10} /> {alert.victims_total} vítimas
                      </span>
                    )}
                  </div>
                  {alert.narrative && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{alert.narrative.slice(0, 120)}..."
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', background: RISK_COLORS[alert.risk_score] + '22', color: RISK_COLORS[alert.risk_score], border: `1px solid ${RISK_COLORS[alert.risk_score]}44` }}>
                  {alert.risk_label ?? RISK_LABELS[alert.risk_score]}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                  {alert.status === 'active' ? '🟢 Ativo' : '◌ Inativo'}
                </span>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', paddingLeft: '1.75rem' }}>
              {alert.detected_at ? formatDate(alert.detected_at) : '—'} · {alert.road}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
