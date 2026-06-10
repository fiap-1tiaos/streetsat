import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface Metrics {
  accuracy?: number
  f1_score?: number
  precision_livre?: number
  precision_atencao?: number
  precision_alto?: number
  precision_critico?: number
}

interface Props {
  metrics: Metrics
}

export function ModelMetricsChart({ metrics }: Props) {
  const data = [
    { metric: 'Acurácia', value: Math.round((metrics.accuracy ?? 0) * 100) },
    { metric: 'F1-macro', value: Math.round((metrics.f1_score ?? 0) * 100) },
    { metric: 'Livre', value: Math.round((metrics.precision_livre ?? 0) * 100) },
    { metric: 'Atenção', value: Math.round((metrics.precision_atencao ?? 0) * 100) },
    { metric: 'Alto', value: Math.round((metrics.precision_alto ?? 0) * 100) },
    { metric: 'Crítico', value: Math.round((metrics.precision_critico ?? 0) * 100) },
  ]

  const hasData = data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
        Dados reais indisponíveis
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <PolarGrid stroke="rgba(0,212,255,0.1)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Modelo"
          dataKey="value"
          stroke="#00d4ff"
          fill="#00d4ff"
          fillOpacity={0.1}
          strokeWidth={1.5}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(13,31,45,0.95)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
          }}
          formatter={(v) => [`${v}%`, ''] as [string, string]}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
