import { useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import { Route, Activity, AlertTriangle, Shield, ChevronDown } from 'lucide-react'
import { RiskMapWrapper } from '@/components/RiskMapWrapper'
import { RiskBadge } from '@/components/RiskBadge'
import { getMarkerColor, formatKm } from '@/lib/map-utils'
import { useRealtime } from '@/hooks/useRealtime'
import { useHighwaySegments } from '@/hooks/useHighwaySegments'
import { api } from '@/lib/api'
import type { Occurrence } from '@/lib/utils'

const ROADS = ['SP-330', 'SP-310', 'SP-348', 'SP-280', 'SP-065']

interface AlertItem {
  id: string
  road: string
  km: number
  risk: number
  msg: string
}

export default function DashboardPage() {
  const [selectedRoad, setSelectedRoad] = useState('SP-330')

  const fetcher = useCallback(() => api.occurrences(), [])
  const { data, error } = useRealtime({ fetcher, intervalMs: 60_000 })

  const summary = useMemo(() => {
    const items = data ?? []
    const uniqueRoads = new Set(items.map((o: any) => o.road))
    const highRisk = items.filter((o: any) => o.risk_score >= 2)
    const avgRisk = items.length
      ? items.reduce((s: number, o: any) => s + (o.risk_score ?? 0), 0) / items.length
      : 0
    return {
      totalKm: items.length,
      alerts: highRisk.length,
      avgRisk,
      roads: uniqueRoads.size,
    }
  }, [data])

  const recentAlerts: AlertItem[] = useMemo(() => {
    const items = data ?? []
    return items
      .filter((o: any) => (o.risk_score ?? 0) >= 1)
      .sort((a: any, b: any) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
      .slice(0, 5)
      .map((o: any) => ({
        id: o.id,
        road: o.road,
        km: o.km,
        risk: o.risk_score ?? 0,
        msg: `${o.occurrence_type}${o.interdiction_level > 0 ? ' — Interdição' : ''}`,
      }))
  }, [data])

  const segments = useHighwaySegments((data ?? []) as Occurrence[])

  const filteredSegments = useMemo(
    () => (selectedRoad ? segments.filter((s) => s.road === selectedRoad) : segments),
    [segments, selectedRoad]
  )

  const hasData = (data?.length ?? 0) > 0

  const cards = [
    { label: 'Ocorrências', value: String(summary.totalKm), icon: Route, color: '#00d4ff' },
    { label: 'Alertas Ativos', value: String(summary.alerts), icon: AlertTriangle, color: '#ef4444', blink: summary.alerts > 0 },
    { label: 'Risco Médio', value: summary.avgRisk.toFixed(1), icon: Shield, color: getMarkerColor(Math.round(summary.avgRisk)) },
    { label: 'Rodovias', value: String(summary.roads || ROADS.length), icon: Activity, color: '#22c55e' },
  ]

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#e2e8f0' }}>
            Streetsat
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Monitoramento de Risco Rodoviário — SP
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <select
            value={selectedRoad}
            onChange={(e) => setSelectedRoad(e.target.value)}
            style={{
              appearance: 'none',
              padding: '0.5rem 2.25rem 0.5rem 1rem',
              background: 'rgba(13,31,45,0.7)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            {ROADS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card"
            style={{ borderRadius: '12px', padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: '"Space Grotesk", sans-serif' }}>{card.label}</span>
              <card.icon size={16} color={card.color} style={{ opacity: 0.7 }} />
            </div>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: card.color,
                ...(card.blink ? { animation: 'pulse-ring-red 1.5s ease-in-out infinite' } : {}),
              }}
            >
              {card.value}
            </span>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{ borderRadius: '12px', overflow: 'hidden', height: '420px' }}
        >
          {hasData ? (
            <RiskMapWrapper
              segments={filteredSegments}
              center={[-23.5, -46.6]}
              zoom={7}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.85rem' }}>
              {error ? 'Erro ao carregar dados' : 'Aguardando dados...'}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <h3 style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: 0, color: '#94a3b8' }}>
            Alertas Recentes
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentAlerts.length === 0 && !error && (
              <div style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', padding: '1rem' }}>
                Nenhum alerta ativo
              </div>
            )}
            {recentAlerts.map((a) => (
              <div
                key={a.id}
                className="glass-card"
                style={{
                  borderRadius: '8px',
                  padding: '0.6rem 0.75rem',
                  borderLeft: `3px solid ${getMarkerColor(a.risk)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#475569' }}>{a.id}</span>
                  <RiskBadge riskScore={a.risk} size="sm" />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {a.road} · {formatKm(a.km)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {a.msg}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card"
        style={{ borderRadius: '12px', padding: '1.25rem' }}
      >
        <h3 style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1rem', color: '#94a3b8' }}>
          Segmentos — {selectedRoad}
        </h3>
        {filteredSegments.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', padding: '1rem' }}>
            Nenhum segmento disponível para {selectedRoad}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredSegments.slice(0, 10).map((seg) => (
              <div key={seg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                  {formatKm(seg.km_start)} → {formatKm(seg.km_end)}
                </div>
                <RiskBadge riskScore={seg.risk_score} size="sm" />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
