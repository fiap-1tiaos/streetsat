import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { Layers, Search, AlertTriangle, Map as MapIcon, X } from 'lucide-react'
import { RiskMapWrapper } from '@/components/RiskMapWrapper'
import { RiskBadge } from '@/components/RiskBadge'
import { useRiskScore, useNearby } from '@/hooks/use-risk-data'
import { useHighwaySegments } from '@/hooks/useHighwaySegments'
import { useOccurrencesStore } from '@/stores/occurrencesStore'
import { formatKm } from '@/lib/map-utils'

const ROADS = ['SP-330', 'SP-310', 'SP-348', 'SP-280', 'SP-065']

type Layer = 'risk' | 'occurrences' | 'alerts'

export default function MapaPage() {
  const [searchRoad, setSearchRoad] = useState('')
  const [searchKm, setSearchKm] = useState('')
  const [activeLayers, setActiveLayers] = useState<Set<Layer>>(new Set(['risk', 'occurrences']))
  const [showSearch, setShowSearch] = useState(false)

  const { occurrences } = useOccurrencesStore()
  const segments = useHighwaySegments(occurrences)

  const road = searchRoad || null
  const km = parseInt(searchKm, 10) || null
  const { data: riskData, loading: riskLoading } = useRiskScore(road, km)
  const { data: nearbyData } = useNearby(road, km, 10)

  const toggleLayer = useCallback((layer: Layer) => {
    setActiveLayers((prev) => {
      const next = new Set(prev)
      if (next.has(layer)) next.delete(layer)
      else next.add(layer)
      return next
    })
  }, [])

  const hasValidSearch = road && km !== null && !isNaN(km)

  return (
    <div style={{ position: 'relative', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <RiskMapWrapper
        segments={segments}
        center={[-23.5, -46.6]}
        zoom={7}
        height="100%"
      />

      {/* Layer controls */}
      <div
        className="glass-card-strong"
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 10,
          borderRadius: '10px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.25rem' }}>
          <Layers size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
          Camadas
        </span>
        {(['risk', 'occurrences', 'alerts'] as Layer[]).map((layer) => (
          <button
            key={layer}
            onClick={() => toggleLayer(layer)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: 'none',
              background: activeLayers.has(layer) ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: activeLayers.has(layer) ? '#00d4ff' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: '"JetBrains Mono", monospace',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: activeLayers.has(layer) ? '#00d4ff' : 'transparent',
              border: '1px solid currentColor',
              flexShrink: 0,
            }} />
            {layer === 'risk' ? 'Risco' : layer === 'occurrences' ? 'Ocorrências' : 'Alertas'}
          </button>
        ))}
      </div>

      {/* Search control */}
      <div
        className="glass-card-strong"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 10,
          borderRadius: '10px',
          padding: '1rem',
          minWidth: '240px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSearch ? '0.75rem' : 0 }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Search size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
            Consultar Risco
          </span>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
          >
            {showSearch ? <X size={14} /> : <Search size={14} />}
          </button>
        </div>

        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={searchRoad}
                onChange={(e) => setSearchRoad(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.5rem',
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="">Rodovia</option>
                {ROADS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="number"
                value={searchKm}
                onChange={(e) => setSearchKm(e.target.value)}
                placeholder="km"
                style={{
                  width: '80px',
                  padding: '0.4rem 0.5rem',
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Results */}
            {riskLoading && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>
                Consultando...
              </div>
            )}

            {hasValidSearch && riskData && !riskLoading && (
              <div style={{ padding: '0.75rem', background: 'rgba(0,212,255,0.04)', borderRadius: '8px' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                  {searchRoad} · {formatKm(km!)}
                </div>
                <RiskBadge riskScore={riskData.risk_score} confidence={riskData.confidence} size="md" />
                {nearbyData && nearbyData.points.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
                    <AlertTriangle size={10} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                    {nearbyData.total} ocorrência{nearbyData.total > 1 ? 's' : ''} num raio de {nearbyData.radius_km} km
                  </div>
                )}
              </div>
            )}

            {hasValidSearch && !riskData && !riskLoading && (
              <div style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', padding: '0.5rem' }}>
                Nenhum dado disponível
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div
        className="glass-card-strong"
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '1rem',
          zIndex: 10,
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {[
          { label: 'Livre', color: '#22c55e' },
          { label: 'Atenção', color: '#f59e0b' },
          { label: 'Alto', color: '#f97316' },
          { label: 'Crítico', color: '#ef4444' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace' }}>
            <span style={{ width: '10px', height: '4px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Page indicator */}
      <div style={{ position: 'absolute', bottom: '1.5rem', right: '1rem', zIndex: 10 }}>
        <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}>
          <MapIcon size={10} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
          Mapa Interativo
        </span>
      </div>
    </div>
  )
}
