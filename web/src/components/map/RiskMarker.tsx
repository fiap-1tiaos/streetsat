import { CircleMarker, Popup } from 'react-leaflet'
import { RISK_LABELS, RISK_COLORS, type Occurrence, timeAgo } from '@/lib/utils'

const GREEN = '#22c55e'

interface Props {
  occurrence: Occurrence
  onClick?: (o: Occurrence) => void
}

export function RiskMarker({ occurrence: o, onClick }: Props) {
  const isFinalized = o.status === 'Finalizada' || o.risk_score === 0
  const color = isFinalized ? GREEN : RISK_COLORS[o.risk_score]

  return (
    <CircleMarker
      center={[o.latitude!, o.longitude!]}
      radius={isFinalized ? 6 : 7 + o.risk_score * 3}
      pathOptions={{
        color: isFinalized ? 'rgba(34,197,94,0.5)' : color,
        fillColor: color,
        fillOpacity: isFinalized ? 0.25 : 0.55,
        weight: isFinalized ? 1 : 1.5,
        dashArray: isFinalized ? '3 3' : undefined,
      }}
      eventHandlers={{ click: () => onClick?.(o) }}
    >
      <Popup>
        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '200px' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: isFinalized ? GREEN : '#e2e8f0' }}>
            {o.occurrence_id} · {o.road} km {o.km}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '6px', color: '#94a3b8' }}>
            {o.municipio}/{o.state}
          </div>
          <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: color + '22', color, border: `1px solid ${color}44`, marginBottom: '6px' }}>
            {isFinalized ? 'Finalizada' : RISK_LABELS[o.risk_score]} (Score {o.risk_score})
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {o.occurrence_type} · {['Livre', 'Parcial', 'Total'][o.interdiction_level] ?? 'Livre'}<br />
            Detectado {timeAgo(o.detected_at)}
            {o.status === 'Finalizada' && (
              <><br />Status: Finalizada</>
            )}
          </div>
          {o.narrative && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', fontStyle: 'italic' }}>
              "{o.narrative.slice(0, 100)}..."
            </div>
          )}
        </div>
      </Popup>
    </CircleMarker>
  )
}
