import { useCallback } from 'react'
import { motion } from 'motion/react'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api'
import { ModelMetricsChart } from '@/components/charts/ModelMetricsChart'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MOCK_META = {
  model_type: 'RandomForestClassifier',
  version: '1.0.0',
  trained_at: '2026-05-31T03:30:00',
  accuracy: 0.5255,
  f1_score: 0.4345,
  n_train: 76634,
  n_test: 19159,
  features: [
    'hour', 'day_of_week', 'is_weekend', 'month', 'br_number', 'km_bucket',
    'cause_encoded', 'type_encoded', 'weather_encoded', 'day_phase_encoded',
    'road_type_encoded', 'road_layout_encoded', 'land_use_encoded', 'uf_encoded',
  ],
  feature_importances: [0.18, 0.12, 0.08, 0.11, 0.15, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.01, 0.01, 0.00],
}

const CONFUSION = [
  { label: 'Livre (pred)', Livre: 1395, Atenção: 1086, Alto: 252, Crítico: 178 },
  { label: 'Atenção (pred)', Livre: 621, Atenção: 7059, Alto: 1823, Crítico: 356 },
  { label: 'Alto (pred)', Livre: 398, Atenção: 1462, Alto: 1007, Crítico: 480 },
  { label: 'Crítico (pred)', Livre: 497, Atenção: 1252, Alto: 942, Crítico: 351 },
]

export default function ModelPage() {
  const fetcher = useCallback(() => api.modelMetadata(), [])
  const { data } = useRealtime({ fetcher, intervalMs: 300_000 })
  const meta = (data ?? MOCK_META) as typeof MOCK_META

  const importanceData = meta.features
    .map((f, i) => ({ feature: f, importance: Math.round(meta.feature_importances[i] * 1000) / 10 }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metadata card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Modelo Ativo</div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{meta.model_type}</h3>
            </div>
            <span className="animate-pulse-ring" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.7rem', color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Ativo
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Versão', value: meta.version },
              { label: 'Treinado em', value: new Date(meta.trained_at).toLocaleDateString('pt-BR') },
              { label: 'Amostras treino', value: meta.n_train.toLocaleString('pt-BR') },
              { label: 'Amostras teste', value: meta.n_test.toLocaleString('pt-BR') },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.875rem', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Acurácia', value: meta.accuracy, color: '#00d4ff' },
              { label: 'F1-macro', value: meta.f1_score, color: '#f59e0b' },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{m.label}</span>
                  <span style={{ fontSize: '0.75rem', color: m.color, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{(m.value * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${m.value * 100}%`, height: '100%', background: m.color, borderRadius: '3px', transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.25rem' }}
        >
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.5rem', color: '#94a3b8' }}>
            Métricas por Classe
          </h3>
          <ModelMetricsChart metrics={{ accuracy: meta.accuracy, f1_score: meta.f1_score }} />
        </motion.div>
      </div>

      {/* Feature importance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
        style={{ borderRadius: '12px', padding: '1.25rem' }}
      >
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1rem', color: '#94a3b8' }}>
          Feature Importance (top 10)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={importanceData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={140} />
            <Tooltip
              contentStyle={{ background: 'rgba(13,31,45,0.95)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}
              formatter={(v) => [`${v}%`, 'Importância'] as [string, string]}
            />
            <Bar dataKey="importance" fill="#00d4ff" fillOpacity={0.7} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Confusion matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
        style={{ borderRadius: '12px', padding: '1.25rem', overflowX: 'auto' }}
      >
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1rem', color: '#94a3b8' }}>
          Matriz de Confusão (estimada)
        </h3>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.5rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', textAlign: 'left' }}>Real ↓ / Pred →</th>
              {['Livre', 'Atenção', 'Alto', 'Crítico'].map((l) => (
                <th key={l} style={{ padding: '0.5rem 1rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', textAlign: 'center' }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONFUSION.map((row) => (
              <tr key={row.label}>
                <td style={{ padding: '0.4rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#64748b' }}>{row.label}</td>
                {(['Livre', 'Atenção', 'Alto', 'Crítico'] as const).map((col) => {
                  const val = row[col]
                  const max = 7059
                  const intensity = val / max
                  return (
                    <td
                      key={col}
                      style={{
                        padding: '0.4rem 1rem',
                        textAlign: 'center',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: `rgba(0,212,255,${intensity * 0.25})`,
                        color: intensity > 0.5 ? '#00d4ff' : '#e2e8f0',
                        borderRadius: '4px',
                      }}
                    >
                      {val.toLocaleString('pt-BR')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
