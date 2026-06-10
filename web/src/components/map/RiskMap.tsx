import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { RiskMarker } from './RiskMarker'
import { StateBoundary } from './StateBoundary'
import type { Occurrence } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

interface Props {
  occurrences: Occurrence[]
  onSelect?: (o: Occurrence) => void
  height?: string
}

export function RiskMap({ occurrences, onSelect, height = '100%' }: Props) {
  const withCoords = occurrences.filter((o) => o.latitude && o.longitude)

  return (
    <MapContainer
      center={[-23.5, -46.6]}
      zoom={7}
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

      {withCoords.map((o) => (
        <RiskMarker key={o.occurrence_id} occurrence={o} onClick={onSelect} />
      ))}
    </MapContainer>
  )
}
