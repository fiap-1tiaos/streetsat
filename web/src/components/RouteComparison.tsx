import type { RouteResponse, RouteData } from '@/lib/api'
import { getMarkerColor, formatKm } from '@/lib/map-utils'

interface Props {
  route: RouteResponse
}

export function RouteComparison({ route }: Props) {
  const { safe_route, direct_route, risk_reduction_pct, km_overhead } = route
  const better = safe_route.total_risk < direct_route.total_risk ? 'safe' : 'direct'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <RouteCard
          label="Rota Segura"
          data={safe_route}
          highlight={better === 'safe'}
        />
        <RouteCard
          label="Rota Direta"
          data={direct_route}
          highlight={better === 'direct'}
        />
      </div>
      {risk_reduction_pct > 0 && (
        <div
          className="glass-card"
          style={{
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#94a3b8',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        >
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            ↓ {risk_reduction_pct.toFixed(1)}% de risco
          </span>
          <span> com acréscimo de {km_overhead.toFixed(1)} km</span>
        </div>
      )}
    </div>
  )
}

function RouteCard({
  label,
  data,
  highlight,
}: {
  label: string
  data: RouteData
  highlight: boolean
}) {
  return (
    <div
      className="glass-card"
      style={{
        borderRadius: '12px',
        padding: '1.25rem',
        border: highlight ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(0,212,255,0.08)',
      }}
    >
      <h3
        style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
          fontSize: '0.9rem',
          margin: '0 0 1rem',
          color: highlight ? '#22c55e' : '#94a3b8',
        }}
      >
        {highlight && <span style={{ marginRight: '0.4rem' }}>✓</span>}
        {label}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Row label="Distância" value={`${data.total_distance_km.toFixed(1)} km`} />
        <Row label="Risco médio" value={data.avg_risk.toFixed(2)} color={getMarkerColor(Math.round(data.avg_risk))} />
        <Row label="Tempo estimado" value={`${Math.round(data.estimated_time_min)} min`} />
        <Row label="Segmentos" value={String(data.segments.length)} />
      </div>

      {data.segments.length > 0 && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,212,255,0.06)' }}>
          <div style={{ fontSize: '0.65rem', color: '#475569', fontFamily: '"JetBrains Mono", monospace', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Segmentos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {data.segments.slice(0, 5).map((seg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>
                <span>{seg.road} · {formatKm(seg.km_start)}</span>
                <span style={{ color: getMarkerColor(seg.risk_score) }}>{seg.risk_label}</span>
              </div>
            ))}
            {data.segments.length > 5 && (
              <div style={{ fontSize: '0.65rem', color: '#475569', textAlign: 'center' }}>
                +{data.segments.length - 5} mais
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', color: color ?? '#e2e8f0' }}>
        {value}
      </span>
    </div>
  )
}
