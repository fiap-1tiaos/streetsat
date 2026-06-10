import { useCallback } from 'react'
import { useRealtime } from '@/hooks/useRealtime'
import { api, type HeatmapResponse } from '@/lib/api'

function interpolateColor(t: number): string {
  const r = Math.round(34 + (239 - 34) * t)
  const g = Math.round(197 + (68 - 197) * t)
  const b = Math.round(94 + (68 - 94) * t)
  return `rgb(${r},${g},${b})`
}

export function HeatmapChart() {
  const fetcher = useCallback(() => api.fetchHeatmap(), [])
  const { data, loading, error } = useRealtime<HeatmapResponse>({ fetcher, intervalMs: 300_000 })

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
        Carregando...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
        Dados indisponíveis
      </div>
    )
  }

  const maxCount = Math.max(...data.matrix.flat().map((c) => c.count), 1)
  const cellW = 32
  const cellH = 22

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '4px', paddingLeft: '32px' }}>
        {data.hours.map((h) => (
          <div key={h} style={{ width: cellW, textAlign: 'center', fontSize: '9px', color: '#475569', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
            {h}
          </div>
        ))}
      </div>
      {data.days.map((day, d) => (
        <div key={day} style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ width: 30, fontSize: '10px', color: '#64748b', fontFamily: 'Inter, sans-serif', flexShrink: 0, textAlign: 'right', paddingRight: '4px' }}>
            {day}
          </div>
          {data.matrix[d].map((cell, h) => {
            const intensity = cell.count / maxCount
            return (
              <div
                key={h}
                title={`${day} ${data.hours[h]} — ${cell.count} ocorrências, risco médio ${cell.avg_risk.toFixed(1)}`}
                style={{
                  width: cellW,
                  height: cellH,
                  borderRadius: '3px',
                  background: interpolateColor(intensity),
                  opacity: 0.15 + intensity * 0.85,
                  flexShrink: 0,
                  cursor: 'default',
                  transition: 'opacity 0.2s',
                }}
              />
            )
          })}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '8px', paddingLeft: '32px' }}>
        <span style={{ fontSize: '9px', color: '#475569' }}>Baixo</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ width: 20, height: 10, borderRadius: '2px', background: interpolateColor(i / 7), opacity: 0.2 + (i / 7) * 0.8 }} />
          ))}
        </div>
        <span style={{ fontSize: '9px', color: '#475569' }}>Alto</span>
      </div>
    </div>
  )
}
