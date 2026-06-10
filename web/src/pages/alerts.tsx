import { useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import { Bell, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { RiskBadge } from '@/components/RiskBadge'
import { formatKm } from '@/lib/map-utils'
import { formatDate } from '@/lib/utils'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api'

const ROADS = ['SP-330', 'SP-310', 'SP-348', 'SP-280', 'SP-065']

interface AlertItem {
  id: string
  road: string
  km: number
  risk_score: number
  confidence: number
  municipio: string
  state: string
  occurrence_type: string
  timestamp: string
  status: 'active' | 'resolved'
}

function toAlert(item: any): AlertItem {
  return {
    id: item.id ?? '',
    road: item.road ?? '',
    km: item.km ?? 0,
    risk_score: item.risk_score ?? 0,
    confidence: item.confidence ?? 0.5,
    municipio: item.municipio ?? '',
    state: item.state ?? 'SP',
    occurrence_type: item.occurrence_type ?? item.message ?? '',
    timestamp: item.timestamp ?? '',
    status: item.status === 'resolved' ? 'resolved' : 'active',
  }
}

const PAGE_SIZE = 15

export default function AlertsPage() {
  const [page, setPage] = useState(0)
  const [filterRoad, setFilterRoad] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all')
  const [sortBy, setSortBy] = useState<'recency' | 'severity'>('recency')
  const [minRisk, setMinRisk] = useState(0)

  const fetcher = useCallback(() => api.alerts(), [])
  const { data: items } = useRealtime({ fetcher, intervalMs: 60_000 })
  const alerts: AlertItem[] = useMemo(() => (items ?? []).map(toAlert), [items])

  const filtered = useMemo(() => {
    let result = [...alerts]

    if (filterRoad) result = result.filter((a) => a.road === filterRoad)
    if (filterStatus !== 'all') result = result.filter((a) => a.status === filterStatus)
    if (minRisk > 0) result = result.filter((a) => a.risk_score >= minRisk)

    if (sortBy === 'severity') {
      result.sort((a, b) => b.risk_score - a.risk_score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } else {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }

    return result
  }, [alerts, filterRoad, filterStatus, sortBy, minRisk])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const activeCount = alerts.filter((a) => a.status === 'active').length
  const criticalCount = alerts.filter((a) => a.risk_score === 3).length

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#e2e8f0' }}>
            Alertas
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            {activeCount} ativos · {criticalCount} críticos
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ borderRadius: '12px', padding: '1rem' }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} color="#64748b" />
            <select
              value={filterRoad}
              onChange={(e) => { setFilterRoad(e.target.value); setPage(0) }}
              style={{
                padding: '0.35rem 0.6rem',
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.15)',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            >
              <option value="">Todas rodovias</option>
              {ROADS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {(['all', 'active', 'resolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(0) }}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: `1px solid ${filterStatus === s ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.1)'}`,
                  background: filterStatus === s ? 'rgba(0,212,255,0.08)' : 'transparent',
                  color: filterStatus === s ? '#00d4ff' : '#64748b',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Resolvidos'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>Risco ≥</span>
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => { setMinRisk(minRisk === s ? 0 : s); setPage(0) }}
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${minRisk === s ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.15)'}`,
                  background: minRisk === s ? 'rgba(239,68,68,0.1)' : 'transparent',
                  color: minRisk === s ? '#ef4444' : '#64748b',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortBy(sortBy === 'recency' ? 'severity' : 'recency')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.3rem 0.6rem',
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: '6px',
              color: '#64748b',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <ArrowUpDown size={12} />
            {sortBy === 'recency' ? 'Recência' : 'Gravidade'}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
        style={{ borderRadius: '12px', overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
                {['ID', 'Rodovia', 'KM', 'Risco', 'Confiança', 'Tipo', 'Município', 'Data', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((alert, i) => (
                <motion.tr
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    borderBottom: '1px solid rgba(0,212,255,0.03)',
                    background: alert.risk_score === 3 ? 'rgba(239,68,68,0.03)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }}>
                    {alert.id}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontFamily: '"JetBrains Mono", monospace' }}>
                    {alert.road}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace' }}>
                    {formatKm(alert.km)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <RiskBadge riskScore={alert.risk_score} size="sm" />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                    {Math.round(alert.confidence * 100)}%
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                    {alert.occurrence_type}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                    {alert.municipio}/{alert.state}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }}>
                    {formatDate(alert.timestamp)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      fontFamily: '"JetBrains Mono", monospace',
                      background: alert.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                      color: alert.status === 'active' ? '#22c55e' : '#64748b',
                      border: `1px solid ${alert.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'}`,
                    }}>
                      {alert.status === 'active' ? 'Ativo' : 'Resolvido'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {paged.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#475569' }}>
            <Bell size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.85rem' }}>Nenhum alerta encontrado</p>
          </div>
        )}
      </motion.div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.75rem',
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: '6px',
              color: page === 0 ? '#475569' : '#e2e8f0',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>

          <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', padding: '0 0.5rem' }}>
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.75rem',
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: '6px',
              color: page >= totalPages - 1 ? '#475569' : '#e2e8f0',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            Próximo
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
