import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, ZoomControl } from 'react-leaflet'
import type { RoadSegment } from '@/lib/map-utils'
import { getMarkerColor, getRiskLabel, formatKm } from '@/lib/map-utils'
import { StateBoundary } from '@/components/map/StateBoundary'
import 'leaflet/dist/leaflet.css'

interface RiskPoint {
  id: string
  lat: number
  lon: number
  road: string
  km: number
  risk_score: number
  municipio?: string
  state?: string
}

interface Props {
  center?: [number, number]
  zoom?: number
  segments?: RoadSegment[]
  riskPoints?: RiskPoint[]
  height?: string
}

export function RiskMapWrapper({
  center = [-23.5, -46.6],
  zoom = 7,
  segments = [],
  riskPoints = [],
  height = '100%',
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', background: '#020408' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />

      <StateBoundary />

      {segments.map((seg) => {
        if (seg.coordinates.length < 2) return null
        const color = getMarkerColor(seg.risk_score)
        return (
          <Polyline
            key={seg.id}
            positions={seg.coordinates}
            pathOptions={{
              color,
              weight: seg.risk_score > 0 ? 5 : 2,
              opacity: seg.risk_score > 0 ? 0.9 : 0.3,
            }}
          >
            <Popup>
              <div style={{ fontFamily: '"Inter", sans-serif', minWidth: '180px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
                  {seg.road} · {formatKm(seg.km_start)} → {formatKm(seg.km_end)}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: `${color}22`,
                    color,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {getRiskLabel(seg.risk_score)} (Score {seg.risk_score})
                </span>
              </div>
            </Popup>
          </Polyline>
        )
      })}

      {riskPoints.map((pt) => {
        const color = getMarkerColor(pt.risk_score)
        return (
          <CircleMarker
            key={pt.id}
            center={[pt.lat, pt.lon]}
            radius={7 + pt.risk_score * 3}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.55,
              weight: 1.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: '"Inter", sans-serif', minWidth: '180px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
                  {pt.road} · {formatKm(pt.km)}
                </div>
                {pt.municipio && (
                  <div style={{ fontSize: '12px', marginBottom: '6px', color: '#94a3b8' }}>
                    {pt.municipio}/{pt.state}
                  </div>
                )}
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: `${color}22`,
                    color,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {getRiskLabel(pt.risk_score)} (Score {pt.risk_score})
                </span>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
