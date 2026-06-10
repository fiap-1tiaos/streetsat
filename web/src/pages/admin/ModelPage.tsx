import { useCallback } from 'react'
import { motion } from 'motion/react'
import { useRealtime } from '@/hooks/useRealtime'
import { api, type NasaStatusResponse } from '@/lib/api'
import { ModelMetricsChart } from '@/components/charts/ModelMetricsChart'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Cloud, Droplets, Thermometer, Wind, Globe } from 'lucide-react'

const CATEGORY_EMOJI: Record<string, string> = {
  wildfires: '🔥',
  severeStorms: '⛈️',
  floods: '🌊',
  volcanoes: '🌋',
  drought: '🏜️',
}

const CATEGORY_LABEL: Record<string, string> = {
  wildfires: 'Incêndios',
  severeStorms: 'Tempestades',
  floods: 'Inundações',
  volcanoes: 'Vulcões',
  drought: 'Seca',
}

export default function ModelPage() {
  const fetcher = useCallback(() => api.modelMetadata(), [])
  const { data: meta, loading } = useRealtime({ fetcher, intervalMs: 300_000 })

  const nasaFetcher = useCallback(() => api.nasaStatus(), [])
  const { data: nasa } = useRealtime<NasaStatusResponse>({ fetcher: nasaFetcher, intervalMs: 120_000 })

  const hasData = meta && meta.n_train > 0

  const importanceData = meta
    ? meta.features
      .map((f, i) => ({ feature: f, importance: Math.round((meta.feature_importances[i] ?? 0) * 1000) / 10 }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
    : []

  const catEntries = nasa?.eonet.categories ? Object.entries(nasa.eonet.categories) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{meta?.model_type ?? '—'}</h3>
            </div>
            {hasData ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.7rem', color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Ativo
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                {loading ? 'Carregando...' : 'Offline'}
              </span>
            )}
          </div>

          {hasData ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Versão', value: meta.version },
                  { label: 'Treinado em', value: meta.trained_at ? new Date(meta.trained_at).toLocaleDateString('pt-BR') : '-' },
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
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
              {loading ? 'Carregando metadados do modelo...' : 'Nenhum modelo treinado encontrado. Execute scripts/train_model.py para treinar.'}
            </div>
          )}
        </motion.div>

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
          <ModelMetricsChart metrics={{ accuracy: meta?.accuracy, f1_score: meta?.f1_score }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Globe size={16} color="#00d4ff" />
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: 0, color: '#94a3b8' }}>
              Dados NASA · EONET
            </h3>
          </div>

          {nasa ? (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#e2e8f0' }}>
                    {nasa.eonet.total_active_events}
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem', fontWeight: 400 }}>em SP</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                  {nasa.eonet.total_global} globais · raio {nasa.eonet.region_km}km
                </div>
              </div>

              {catEntries.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {catEntries.map(([cat, count]) => (
                    <span key={cat} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.6rem', borderRadius: '6px',
                      background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)',
                      fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {CATEGORY_EMOJI[cat] ?? '🌍'} {CATEGORY_LABEL[cat] ?? cat} {count}
                    </span>
                  ))}
                </div>
              )}

              {nasa.eonet.last_collected && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                  Última coleta: {new Date(nasa.eonet.last_collected).toLocaleString('pt-BR')}
                </div>
              )}

              {nasa.eonet.events.length > 0 && (
                <div style={{ marginTop: '0.75rem', maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {nasa.eonet.events.slice(0, 8).map((ev) => (
                    <div key={ev.event_id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.25rem 0.5rem', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.02)', fontSize: '0.65rem',
                    }}>
                      <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {CATEGORY_EMOJI[ev.category] ?? '🌍'} {ev.title.slice(0, 36)}
                      </span>
                      <span style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {ev.distance_km ? `${ev.distance_km}km` : ''}{ev.magnitude ? ` · ${ev.magnitude}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
              Aguardando dados da NASA…
            </div>
          )}
        </motion.div>
      </div>

      {nasa?.weather && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
          style={{ borderRadius: '12px', padding: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Cloud size={16} color="#00d4ff" />
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: 0, color: '#94a3b8' }}>
              Condições Meteorológicas · NASA POWER
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            {[
              { icon: <Thermometer size={14} />, label: 'Temperatura', value: `${nasa.weather.temperature_c.toFixed(1)}°C`, color: '#f59e0b' },
              { icon: <Droplets size={14} />, label: 'Precipitação', value: `${nasa.weather.precipitation_mm.toFixed(1)} mm`, color: '#00d4ff' },
              { icon: <Wind size={14} />, label: 'Vento', value: `${nasa.weather.wind_speed_ms.toFixed(1)} m/s`, color: '#22c55e' },
              { icon: <Droplets size={14} />, label: 'Umidade', value: `${nasa.weather.humidity.toFixed(0)}%`, color: '#8b5cf6' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ color: item.color, opacity: 0.7 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card"
        style={{ borderRadius: '12px', padding: '1.25rem' }}
      >
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1rem', color: '#94a3b8' }}>
          Feature Importance (top 10)
        </h3>
        {importanceData.length > 0 ? (
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
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
            Dados indisponíveis
          </div>
        )}
      </motion.div>

      {nasa?.note && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '8px',
          background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)',
          fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6,
        }}>
          {nasa.note}
        </div>
      )}
    </div>
  )
}
