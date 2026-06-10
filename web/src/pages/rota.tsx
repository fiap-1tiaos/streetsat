import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, MapPin, Route, Loader2 } from 'lucide-react'
import { RouteComparison } from '@/components/RouteComparison'
import { useRouteOptimization } from '@/hooks/use-risk-data'
import { MapContainer, TileLayer, Polyline, ZoomControl } from 'react-leaflet'
import { StateBoundary } from '@/components/map/StateBoundary'
import { routeDataToPolylines } from '@/lib/map-utils'
import 'leaflet/dist/leaflet.css'

const ROADS = ['SP-330', 'SP-310', 'SP-348', 'SP-280', 'SP-065']

const SAFE_COLOR = '#22c55e'
const DIRECT_COLOR = '#ef4444'

export default function RotaPage() {
  const [originRoad, setOriginRoad] = useState('SP-330')
  const [originKm, setOriginKm] = useState('100')
  const [destRoad, setDestRoad] = useState('SP-310')
  const [destKm, setDestKm] = useState('200')

  const origin = { road: originRoad, km: parseInt(originKm, 10) || 0 }
  const destination = { road: destRoad, km: parseInt(destKm, 10) || 0 }
  const { data, loading, error, fetch } = useRouteOptimization(origin, destination)

  const handleOptimize = () => {
    if (!origin.km || !destination.km) return
    fetch()
  }

  const safePolylines = useMemo(
    () => data ? routeDataToPolylines(data.safe_route, 'Segura', SAFE_COLOR) : [],
    [data]
  )
  const directPolylines = useMemo(
    () => data ? routeDataToPolylines(data.direct_route, 'Direta', DIRECT_COLOR) : [],
    [data]
  )

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#e2e8f0' }}>
          Otimização de Rota
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>
          Compare rota direta vs rota segura
        </p>
      </div>

      {/* Inputs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ borderRadius: '12px', padding: '1.5rem' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end' }}>
          {/* Origin */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              <MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
              Origem
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={originRoad}
                onChange={(e) => setOriginRoad(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                {ROADS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="number"
                value={originKm}
                onChange={(e) => setOriginKm(e.target.value)}
                placeholder="km"
                style={{
                  width: '100px',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
            <ArrowRight size={20} color="#64748b" />
          </div>

          {/* Destination */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              <Route size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
              Destino
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={destRoad}
                onChange={(e) => setDestRoad(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                {ROADS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="number"
                value={destKm}
                onChange={(e) => setDestKm(e.target.value)}
                placeholder="km"
                style={{
                  width: '100px',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleOptimize}
          disabled={loading || !origin.km || !destination.km}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(0,212,255,0.1)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: '8px',
            color: '#00d4ff',
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Route size={16} />}
          {loading ? 'Otimizando...' : 'Otimizar Rota'}
        </motion.button>
      </motion.div>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.85rem' }}>
          {error.message}
        </div>
      )}

      {/* Results */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <RouteComparison route={data} />

          {/* Route Map */}
          <div className="glass-card" style={{ borderRadius: '12px', overflow: 'hidden', height: '400px' }}>
            <MapContainer
              center={[-23.5, -46.6]}
              zoom={7}
              style={{ height: '100%', width: '100%', background: '#020408' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com">CARTO</a>'
                maxZoom={19}
              />
              <ZoomControl position="bottomright" />
              <StateBoundary />

              {safePolylines.map((pl) => (
                <Polyline
                  key={pl.id}
                  positions={pl.coordinates}
                  pathOptions={{ color: pl.color, weight: 4, opacity: 0.8 }}
                />
              ))}
              {directPolylines.map((pl) => (
                <Polyline
                  key={pl.id}
                  positions={pl.coordinates}
                  pathOptions={{ color: pl.color, weight: 3, opacity: 0.5, dashArray: '8 4' }}
                />
              ))}
            </MapContainer>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '20px', height: '3px', background: SAFE_COLOR, display: 'inline-block', borderRadius: '2px' }} />
              Rota Segura
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '20px', height: '2px', background: DIRECT_COLOR, display: 'inline-block', borderRadius: '1px', borderTop: '2px dashed ' + DIRECT_COLOR }} />
              Rota Direta
            </span>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#475569' }}>
          <Route size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.9rem' }}>
            Selecione origem e destino para otimizar sua rota
          </p>
        </div>
      )}
    </div>
  )
}
