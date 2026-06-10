import { GeoJSON } from 'react-leaflet'
import { DEFAULT_TERRITORIES, type TerritoryConfig } from '@/data/sp-boundary'
import type { PathOptions } from 'leaflet'

interface Props {
  territories?: TerritoryConfig[]
}

function styleFn(feature: unknown): PathOptions {
  void feature
  return {
    color: '#2dd4bf',
    weight: 2,
    opacity: 0.8,
    fillColor: '#2dd4bf',
    fillOpacity: 0.06,
  }
}

export function StateBoundary({ territories = DEFAULT_TERRITORIES }: Props) {
  return (
    <>
      {territories.map((t) => (
        <GeoJSON
          key={t.id}
          data={t.geojson}
          style={styleFn}
        />
      ))}
    </>
  )
}
