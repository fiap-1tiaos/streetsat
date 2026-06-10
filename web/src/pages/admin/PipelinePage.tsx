import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { RefreshCw, Clock, AlertCircle, CheckCircle, Loader2, Play } from 'lucide-react'
import { useRealtime } from '@/hooks/useRealtime'
import { api, type PipelineStatusResponse, type PipelineLogEntry } from '@/lib/api'

const COLORS = {
  idle: '#475569',
  success: '#22c55e',
  running: '#f59e0b',
  failed: '#ef4444',
  offline: '#334155',
}

function statusColor(s: string): string {
  if (s === 'success') return COLORS.success
  if (s === 'running') return COLORS.running
  if (s === 'failed') return COLORS.failed
  if (s === 'offline') return COLORS.offline
  return COLORS.idle
}

function statusIcon(s: string) {
  if (s === 'success') return <CheckCircle size={16} color={COLORS.success} />
  if (s === 'running') return <Loader2 size={16} color={COLORS.running} className="animate-spin" />
  if (s === 'failed') return <AlertCircle size={16} color={COLORS.failed} />
  return <Clock size={16} color={COLORS.idle} />
}

interface NodeDef {
  id: string
  label: string
  subtitle: string
  getStatus: (d: PipelineStatusResponse | null) => string
  getMetric: (d: PipelineStatusResponse | null) => string
}

const NODES: NodeDef[] = [
  {
    id: 'scraper',
    label: 'Lambda Scraper',
    subtitle: 'handler_scraper.py',
    getStatus: (d) => d?.last_scrape?.status ?? 'idle',
    getMetric: (d) => {
      if (!d) return '—'
      if (d.last_scrape.status === 'running') return 'Em execução…'
      return d.last_scrape.last_run ? `${d.last_scrape.occurrences_count ?? 0} ocorrências` : '—'
    },
  },
  {
    id: 's3',
    label: 'S3 Bucket',
    subtitle: 'raw/occurrences/',
    getStatus: (d) => d && d.s3_raw_count > 0 ? 'success' : 'idle',
    getMetric: (d) => d ? `${d.s3_raw_count} arquivos` : '—',
  },
  {
    id: 'inference-queue',
    label: 'SQS Inference',
    subtitle: 'Fila de inferência',
    getStatus: (d) => {
      if (!d) return 'idle'
      const q = d.inference_queue
      if (q.messages_available < 0) return 'offline'
      return q.messages_available > 0 ? 'running' : 'idle'
    },
    getMetric: (d) => d ? `${d.inference_queue.messages_available} disponível · ${d.inference_queue.messages_in_flight} em voo` : '—',
  },
  {
    id: 'inference',
    label: 'Lambda Inference',
    subtitle: 'handler_inference.py',
    getStatus: (d) => d?.last_inference?.status ?? 'idle',
    getMetric: (d) => {
      if (!d) return '—'
      if (d.last_inference.status === 'running') return 'Em execução…'
      return d.last_inference.last_run ? `${d.last_inference.alerts_generated ?? 0} alertas gerados` : '—'
    },
  },
  {
    id: 'alerts-queue',
    label: 'SQS Alerts',
    subtitle: 'Fila de alertas',
    getStatus: (d) => {
      if (!d) return 'idle'
      const q = d.alerts_queue
      if (q.messages_available < 0) return 'offline'
      return q.messages_available > 0 ? 'running' : 'idle'
    },
    getMetric: (d) => d ? `${d.alerts_queue.messages_available} disponível · ${d.alerts_queue.messages_in_flight} em voo` : '—',
  },
  {
    id: 'alerts',
    label: 'Lambda Alerts',
    subtitle: 'handler_alerts.py',
    getStatus: (d) => d?.last_alert_publish?.status ?? 'idle',
    getMetric: (d) => {
      if (!d) return '—'
      if (d.last_alert_publish.status === 'running') return 'Em execução…'
      return d.last_alert_publish.last_run ? `${d.last_alert_publish.published_count ?? 0} publicados` : '—'
    },
  },
  {
    id: 'sns',
    label: 'SNS Topic',
    subtitle: 'Notificações',
    getStatus: (d) => d && d.sns_topic.active_subscriptions > 0 ? 'success' : 'idle',
    getMetric: (d) => d ? `${d.sns_topic.active_subscriptions} inscrições` : '—',
  },
]

function levelLabel(s: string): string {
  if (s === 'INFO') return '#22c55e'
  if (s === 'WARN' || s === 'WARNING') return '#f59e0b'
  if (s === 'ERROR') return '#ef4444'
  return '#64748b'
}

export default function PipelinePage() {
  const fetcher = useCallback(() => api.pipelineStatus(), [])
  const { data: status, loading, refetch } = useRealtime({ fetcher, intervalMs: 15_000 })
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null)

  const handleForceScraper = useCallback(async () => {
    setScraping(true)
    setScrapeMsg(null)
    try {
      const r = await api.pipelineTriggerScraper()
      setScrapeMsg(`Lambda invocada (status ${r.status_code})`)
    } catch {
      setScrapeMsg('Erro ao invocar Lambda')
    } finally {
      setScraping(false)
      setTimeout(() => refetch(), 2000)
    }
  }, [refetch])

  const logFetcher = useCallback(() => api.pipelineLogs({ limit: 30 }), [])
  const { data: logsRaw } = useRealtime({ fetcher: logFetcher, intervalMs: 30_000 })
  const logs: PipelineLogEntry[] = Array.isArray(logsRaw) ? logsRaw : (logsRaw as { total?: number; items?: PipelineLogEntry[] })?.items ?? []

  const [tab, setTab] = useState<'flow' | 'logs'>('flow')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['flow', 'logs'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${tab === t ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.1)'}`,
                background: tab === t ? 'rgba(0,212,255,0.08)' : 'transparent',
                color: tab === t ? '#00d4ff' : '#64748b',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {t === 'flow' ? 'Fluxograma' : 'Logs'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {scrapeMsg && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#22c55e' }}>{scrapeMsg}</span>
          )}
          <motion.button
            onClick={handleForceScraper}
            disabled={scraping}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'rgba(255,200,0,0.08)',
              border: '1px solid rgba(255,200,0,0.25)',
              borderRadius: '8px',
              color: scraping ? '#64748b' : '#eab308',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: scraping ? 'not-allowed' : 'pointer',
              opacity: scraping ? 0.6 : 1,
            }}
          >
            {scraping ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Forçar Scraper
          </motion.button>
          <motion.button
            onClick={() => refetch()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: '8px',
              color: '#00d4ff',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Atualizar
          </motion.button>
        </div>
      </div>

      {tab === 'flow' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, padding: '2rem 0' }}>
          {NODES.map((node, idx) => (
            <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '480px' }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass-card"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  borderLeft: `3px solid ${statusColor(node.getStatus(status))}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: statusColor(node.getStatus(status)) + '18',
                  border: `1px solid ${statusColor(node.getStatus(status))}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {statusIcon(node.getStatus(status))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' }}>
                    {node.label}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#475569', marginTop: '2px' }}>
                    {node.subtitle}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: statusColor(node.getStatus(status)), fontWeight: 600 }}>
                    {node.getStatus(status).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#475569', marginTop: '2px' }}>
                    {node.getMetric(status)}
                  </div>
                </div>
              </motion.div>

              {idx < NODES.length - 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '36px', justifyContent: 'center' }}>
                  <svg width="16" height="36" viewBox="0 0 16 36" fill="none">
                    <line x1="8" y1="0" x2="8" y2="30" stroke={statusColor(NODES[idx + 1].getStatus(status))} strokeWidth="2" strokeDasharray={NODES[idx + 1].getStatus(status) === 'idle' ? '4 3' : 'none'} />
                    <polygon points="0,26 8,36 16,26" fill={statusColor(NODES[idx + 1].getStatus(status))} />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
              Nenhum log disponível
            </div>
          ) : (
            <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', textAlign: 'left', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>Timestamp</th>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', textAlign: 'left', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>Fonte</th>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', textAlign: 'left', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>Nível</th>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', textAlign: 'left', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ padding: '0.35rem 0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>{log.timestamp?.slice(11, 19) ?? ''}</td>
                    <td style={{ padding: '0.35rem 0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>{log.source}</td>
                    <td style={{ padding: '0.35rem 0.75rem', color: levelLabel(log.level), fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>{log.level}</td>
                    <td style={{ padding: '0.35rem 0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
