import { useRef, useCallback } from 'react'
import { motion, useInView } from 'motion/react'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api'
import { RISK_LABELS, RISK_COLORS, type Occurrence } from '@/lib/utils'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { SectionBadge } from '../components/SectionBadge'
import { fadeUp, stagger, VIEWPORT } from '@/lib/motion-tokens'

const MOCK: Occurrence[] = [
  { id: 'OC-001', br: 116, km: 225, municipio: 'Guarulhos',   uf: 'SP', tipo: 'Colisão',         interdicao: false, risk_score: 2, risk_label: 'Alto',     detectado_em: new Date().toISOString(), lat: -23.4, lon: -46.5 },
  { id: 'OC-002', br: 101, km: 180, municipio: 'Curitiba',    uf: 'PR', tipo: 'Tombamento',       interdicao: true,  risk_score: 3, risk_label: 'Crítico',  detectado_em: new Date().toISOString(), lat: -25.4, lon: -49.3 },
  { id: 'OC-003', br: 381, km: 95,  municipio: 'Betim',       uf: 'MG', tipo: 'Atropelamento',    interdicao: false, risk_score: 1, risk_label: 'Atenção',  detectado_em: new Date().toISOString(), lat: -19.9, lon: -44.2 },
  { id: 'OC-004', br: 40,  km: 312, municipio: 'Juiz de Fora',uf: 'MG', tipo: 'Capotamento',      interdicao: false, risk_score: 0, risk_label: 'Livre',    detectado_em: new Date().toISOString(), lat: -21.7, lon: -43.3 },
  { id: 'OC-005', br: 50,  km: 142, municipio: 'Uberaba',     uf: 'MG', tipo: 'Colisão frontal',  interdicao: true,  risk_score: 3, risk_label: 'Crítico',  detectado_em: new Date().toISOString(), lat: -19.7, lon: -47.9 },
]

export function LiveFeedSection() {
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, VIEWPORT)
  const fetcher = useCallback(() => api.occurrences(), [])
  const { data } = useRealtime({ fetcher, intervalMs: 30_000 })

  const occurrences: Occurrence[] = Array.isArray(data) ? (data as Occurrence[]) : MOCK
  const withCoords = occurrences.filter((o) => o.lat && o.lon).slice(0, 10)
  const critical   = occurrences.filter((o) => o.risk_score === 3).length
  const tickerItems = [...occurrences, ...occurrences, ...occurrences]

  return (
    <section
      id="live-feed"
      ref={ref}
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: '#020408' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="flex flex-col items-center text-center mb-12"
        >
          <motion.div variants={fadeUp}>
            <SectionBadge label="Monitoramento" color="cyan" />
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap justify-center">
            <h2
              className="font-display font-bold"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
            >
              Feed ao Vivo
            </h2>

            {/* AO VIVO badge */}
            <span className="flex items-center gap-2 px-3 py-1 rounded-full
                             bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              AO VIVO
            </span>
          </motion.div>

          <motion.p variants={fadeUp} className="text-slate-500 text-sm mt-3">
            <span className="text-[#00d4ff] font-mono font-semibold">{occurrences.length}</span>
            {' '}ocorrências ativas ·{' '}
            <span className="text-red-400 font-mono font-semibold">{critical}</span>
            {' '}críticas
          </motion.p>
        </motion.div>

        {/* Ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="overflow-hidden mb-8 py-3"
          style={{
            borderTop:    '1px solid rgba(0,212,255,0.07)',
            borderBottom: '1px solid rgba(0,212,255,0.07)',
          }}
        >
          <div
            className="animate-ticker flex gap-8 whitespace-nowrap w-max"
          >
            {tickerItems.map((o, i) => (
              <span
                key={`${o.id}-${i}`}
                className="inline-flex items-center gap-2 text-sm"
              >
                <ScoreBadge score={o.risk_score} label={RISK_LABELS[o.risk_score]} color={RISK_COLORS[o.risk_score]} />
                <span className="text-slate-300">BR-{o.br}</span>
                <span className="text-slate-600 text-xs">km {o.km}</span>
                <span className="text-slate-700 text-xs">·</span>
                <span className="text-slate-500 text-xs">{o.municipio}/{o.uf}</span>
                <span className="text-slate-800 ml-3 text-xs">◆</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Mini map */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="glass-card rounded-2xl overflow-hidden"
          style={{ height: 380 }}
        >
          <MapContainer
            center={[-15.77, -47.92]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {withCoords.map((o) => (
              <CircleMarker
                key={o.id}
                center={[o.lat!, o.lon!]}
                radius={8 + o.risk_score * 3}
                pathOptions={{
                  color:       RISK_COLORS[o.risk_score],
                  fillColor:   RISK_COLORS[o.risk_score],
                  fillOpacity: 0.5,
                  weight:      1.5,
                }}
              >
                <Popup>
                  <strong>BR-{o.br} km {o.km}</strong>
                  <br />
                  {o.municipio}/{o.uf}
                  <br />
                  Risco: {RISK_LABELS[o.risk_score]}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </motion.div>
      </div>
    </section>
  )
}

function ScoreBadge({ label, color }: { score: number; label: string; color: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded font-mono text-[0.65rem] font-semibold"
      style={{
        color,
        background: `${color}18`,
        border:     `1px solid ${color}35`,
      }}
    >
      {label}
    </span>
  )
}
