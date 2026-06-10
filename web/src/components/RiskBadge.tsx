import { getMarkerColor, getRiskLabel } from '@/lib/map-utils'

interface Props {
  riskScore: number
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { padding: '0.15rem 0.5rem', fontSize: '0.65rem' },
  md: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
  lg: { padding: '0.4rem 1rem', fontSize: '0.875rem' },
}

export function RiskBadge({ riskScore, confidence, size = 'md' }: Props) {
  const color = getMarkerColor(riskScore)
  const label = getRiskLabel(riskScore)
  const s = sizeMap[size]

  return (
    <span
      role="status"
      aria-label={`Risco: ${label}${confidence !== undefined ? `, confiança: ${Math.round(confidence * 100)}%` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        ...s,
        borderRadius: '6px',
        fontWeight: 700,
        fontFamily: '"JetBrains Mono", monospace',
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
      {confidence !== undefined && (
        <span style={{ opacity: 0.7, fontWeight: 400 }}>
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  )
}
