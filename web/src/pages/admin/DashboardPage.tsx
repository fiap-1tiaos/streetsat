import { useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Activity, Cpu, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { useRealtime } from '@/hooks/useRealtime'
import { useOccurrencesStore } from '@/stores/occurrencesStore'
import { type Occurrence, timeAgo } from '@/lib/utils'
import { RiskMap } from '@/components/map/RiskMap'
import { RiskDonutChart } from '@/components/charts/RiskDonutChart'
import { OccurrencesTimeline } from '@/components/charts/OccurrencesTimeline'
import { HeatmapChart } from '@/components/charts/HeatmapChart'
import { LiveOccurrencesFeed } from '@/components/realtime/LiveOccurrencesFeed'

const MOCK_OCC: Occurrence[] = Array.from({ length: 20 }, (_, i) => ({
  id: `OC-${String(i + 1).padStart(4, '0')}`,
  br: [101, 116, 381, 40, 50, 153][i % 6],
  km: 100 + i * 15,
  municipio: ['São Paulo', 'Guarulhos', 'Campinas', 'Curitiba', 'Betim', 'Belo Horizonte'][i % 6],
  uf: ['SP', 'SP', 'SP', 'PR', 'MG', 'MG'][i % 6],
  tipo: ['Colisão', 'Tombamento', 'Atropelamento', 'Capotamento'][i % 4],
  interdicao: i % 3 === 0,
  risk_score: (i % 4) as 0 | 1 | 2 | 3,
  risk_label: ['Livre', 'Atenção', 'Alto', 'Crítico'][i % 4],
  detectado_em: new Date(Date.now() - i * 1800_000).toISOString(),
  lat: [-23.5, -25.4, -19.9, -21.7, -19.7, -22.9, -20.3, -27.6, -30.0, -16.7,
        -23.1, -25.0, -20.4, -22.1, -18.9, -23.8, -21.2, -26.3, -29.1, -17.3][i],
  lon: [-46.6, -49.3, -44.2, -43.3, -47.9, -43.2, -40.3, -48.5, -51.2, -49.3,
        -47.1, -50.0, -44.8, -43.9, -48.4, -43.7, -41.0, -49.0, -51.8, -49.8][i],
}))

export default function DashboardPage() {
  const { occurrences, setOccurrences, setApiOnline, setLastUpdated, lastUpdated } = useOccurrencesStore()

  const fetcher = useCallback(() => api.occurrences(), [])
  const { data, error } = useRealtime({ fetcher, intervalMs: 30_000 })

  useEffect(() => {
    if (data) {
      const occ = data as Occurrence[]
      setOccurrences(occ.length > 0 ? occ : MOCK_OCC)
      setApiOnline(true)
      setLastUpdated(new Date())
    } else {
      setOccurrences(MOCK_OCC)
    }
  }, [data, setOccurrences, setApiOnline, setLastUpdated])

  useEffect(() => {
    if (error) {
      setApiOnline(false)
      if (occurrences.length === 0) setOccurrences(MOCK_OCC)
    }
  }, [error, setApiOnline, occurrences.length, setOccurrences])

  const occ = occurrences.length > 0 ? occurrences : MOCK_OCC
  const critical = occ.filter((o: Occurrence) => o.risk_score === 3).length
  const active = occ.length

  const kpis = [
    { label: 'Ocorrências Ativas', value: active, icon: Activity, color: '#00d4ff', delta: '+3' },
    { label: 'Críticas', value: critical, icon: AlertTriangle, color: '#ef4444', blink: critical > 0 },
    { label: 'Uptime API', value: '99.8%', icon: Cpu, color: '#22c55e' },
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
              {kpi.delta && (
                <span style={{ fontSize: '0.75rem', color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>{kpi.delta}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map + Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{ borderRadius: '12px', overflow: 'hidden', height: '420px' }}
        >
          <RiskMap occurrences={occ} height="100%" />
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
            <LiveOccurrencesFeed occurrences={occ.filter((o: Occurrence) => o.risk_score >= 2)} maxItems={10} />
          </div>
        </motion.div>
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
            Ocorrências — Últimas 24h
          </h3>
          <OccurrencesTimeline occurrences={occ} />
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
          <RiskDonutChart occurrences={occ} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.25rem' }}
        >
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1rem', color: '#94a3b8' }}>
            Mapa de Calor — Histórico PRF
          </h3>
          <HeatmapChart />
        </motion.div>
      </div>
    </div>
  )
}
