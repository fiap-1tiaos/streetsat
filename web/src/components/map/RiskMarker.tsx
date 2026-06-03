import { CircleMarker, Popup } from 'react-leaflet'
import { RISK_LABELS, RISK_COLORS, type Occurrence, timeAgo } from '@/lib/utils'

interface Props {
  occurrence: Occurrence
  onClick?: (o: Occurrence) => void
}

export function RiskMarker({ occurrence: o, onClick }: Props) {
  const color = RISK_COLORS[o.risk_score]

  return (
    <CircleMarker
      center={[o.lat!, o.lon!]}
      radius={7 + o.risk_score * 3}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.55,
        weight: 1.5,
      }}
      eventHandlers={{ click: () => onClick?.(o) }}
    >
      <Popup>
        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '200px' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: RISK_LABELS[o.risk_score] === 'Crítico' ? '#ef4444' : '#e2e8f0' }}>
            {o.id} · BR-{o.br} km {o.km}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '6px', color: '#94a3b8' }}>
            {o.municipio}/{o.uf}
          </div>
          <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: color + '22', color, border: `1px solid ${color}44`, marginBottom: '6px' }}>
            {RISK_LABELS[o.risk_score]} (Score {o.risk_score})
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {o.tipo} · {o.interdicao ? 'Interdição' : 'Sem interdição'}<br />
            Detectado {timeAgo(o.detectado_em)}
          </div>
          {o.narrativa && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', fontStyle: 'italic' }}>
              "{o.narrativa.slice(0, 100)}..."
            </div>
          )}
        </div>
      </Popup>
    </CircleMarker>
  )
}
