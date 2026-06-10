import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { type Occurrence } from '@/lib/utils'

interface Props {
  occurrences: Occurrence[]
}

const COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444']
const LABELS = ['Livre', 'Atenção', 'Alto', 'Crítico']

export function OccurrencesTimeline({ occurrences }: Props) {
  const data = useMemo(() => {
    const now = Date.now()
    return Array.from({ length: 24 }, (_, i) => {
      const hourStart = now - (23 - i) * 3_600_000
      const hourEnd = hourStart + 3_600_000
      const inHour = occurrences.filter((o) => {
        const t = new Date(o.detected_at).getTime()
        return t >= hourStart && t < hourEnd
      })
      const row: Record<string, unknown> = {
        hour: new Date(hourStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }
      for (let s = 0; s < 4; s++) {
        row[LABELS[s]] = inHour.filter((o) => o.risk_score === s).length
      }
      return row
    })
  }, [occurrences])

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          {COLORS.map((color, i) => (
            <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="hour"
          tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          interval={5}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: 'rgba(13,31,45,0.95)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
          }}
        />
        {LABELS.map((label, i) => (
          <Area
            key={label}
            type="monotone"
            dataKey={label}
            stackId="1"
            stroke={COLORS[i]}
            fill={`url(#grad${i})`}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
