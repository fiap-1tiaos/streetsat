import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RISK_LABELS, RISK_COLORS, type Occurrence } from '@/lib/utils'

interface Props {
  occurrences: Occurrence[]
}

export function RiskDonutChart({ occurrences }: Props) {
  const counts = [0, 1, 2, 3].map((score) => ({
    name: RISK_LABELS[score],
    value: occurrences.filter((o) => o.risk_score === score).length,
    color: RISK_COLORS[score],
  })).filter((d) => d.value > 0)

  const total = occurrences.length

  return (
    <div style={{ width: '100%', height: 240, position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={counts}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            dataKey="value"
            strokeWidth={0}
            paddingAngle={3}
          >
            {counts.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(13,31,45,0.95)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(val) => <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -62%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.75rem', fontWeight: 700, color: '#00d4ff' }}>{total}</div>
        <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>total</div>
      </div>
    </div>
  )
}
