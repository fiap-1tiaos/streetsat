import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Activity, Clock, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { useRealtime } from '@/hooks/useRealtime'
import { useOccurrencesStore } from '@/stores/occurrencesStore'
import { type Occurrence, timeAgo } from '@/lib/utils'
import { RiskMap } from '@/components/map/RiskMap'
import { RiskDonutChart } from '@/components/charts/RiskDonutChart'
import { OccurrencesTimeline } from '@/components/charts/OccurrencesTimeline'
import { HeatmapChart } from '@/components/charts/HeatmapChart'
import { LiveOccurrencesFeed } from '@/components/realtime/LiveOccurrencesFeed'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

function isInRange(dateStr: string, start: string, end: string) {
  const d = dateStr.slice(0, 10)
  return d >= start && d <= end
}

export default function DashboardPage() {
  const { occurrences, setOccurrences, setApiOnline, setLastUpdated, lastUpdated } = useOccurrencesStore()
  const [dateStart, setDateStart] = useState(sevenDaysAgo())
  const [dateEnd, setDateEnd] = useState(todayStr())

  const fetcher = useCallback(() => api.occurrences(), [])
  const { data, error } = useRealtime({ fetcher, intervalMs: 30_000 })

  useEffect(() => {
    if (data) {
      const occ = data as Occurrence[]
      setOccurrences(occ)
      setApiOnline(true)
      setLastUpdated(new Date())
    }
  }, [data, setOccurrences, setApiOnline, setLastUpdated])

  useEffect(() => {
    if (error) {
      setApiOnline(false)
    }
  }, [error, setApiOnline])

  const occ = occurrences
  const occFiltered = occ.filter((o) => isInRange(o.detected_at, dateStart, dateEnd))
  const critical = occFiltered.filter((o: Occurrence) => o.risk_score === 3).length
  const active = occFiltered.length
  const finalized = occFiltered.filter((o: Occurrence) => o.status === 'Finalizada').length

  const kpis: Array<{ label: string; value: string | number; icon: typeof Activity; color: string; blink?: boolean }> = [
    { label: 'Ocorrências no Período', value: active, icon: Activity, color: '#00d4ff' },
    { label: 'Críticas', value: critical, icon: AlertTriangle, color: '#ef4444', blink: critical > 0 },
    { label: 'Finalizadas', value: finalized, icon: Calendar, color: '#22c55e' },
    { label: 'Última Inferência', value: lastUpdated ? timeAgo(lastUpdated.toISOString()) : '—', icon: Clock, color: '#f59e0b' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card"
            style={{ borderRadius: '12px', padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'Space Grotesk, sans-serif' }}>{kpi.label}</span>
              <kpi.icon size={16} color={kpi.color} style={{ opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: kpi.color,
                  ...(kpi.blink ? { animation: 'pulse-ring-red 1.5s ease-in-out infinite' } : {}),
                }}
              >
                {kpi.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Date Range Filter + Map + Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Calendar size={16} color="#64748b" />
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>De</span>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            max={dateEnd}
            style={{
              background: '#0d1f2d',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              color: '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>até</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            min={dateStart}
            max={todayStr()}
            style={{
              background: '#0d1f2d',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              color: '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
            {occFiltered.length} ocorrências
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
            style={{ borderRadius: '12px', overflow: 'hidden', height: '420px' }}
          >
            <RiskMap occurrences={occFiltered} height="100%" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card"
            style={{ borderRadius: '12px', padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: 0, color: '#94a3b8' }}>
              Feed de Alertas
            </h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <LiveOccurrencesFeed occurrences={occFiltered.filter((o: Occurrence) => o.risk_score >= 2)} maxItems={10} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.25rem' }}
        >
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1rem', color: '#94a3b8' }}>
            Ocorrências no Período
          </h3>
          <OccurrencesTimeline occurrences={occFiltered} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.25rem', width: '240px' }}
        >
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.5rem', color: '#94a3b8' }}>
            Distribuição Score
          </h3>
          <RiskDonutChart occurrences={occFiltered} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.25rem' }}
        >
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1rem', color: '#94a3b8' }}>
            Mapa de Risco — CCM-ARTESP
          </h3>
          <HeatmapChart />
        </motion.div>
      </div>
    </div>
  )
}
