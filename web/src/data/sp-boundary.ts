import spStateGeoJSON from './sp-state.json'
import type { FeatureCollection, Polygon } from 'geojson'

export const SP_BOUNDARY = spStateGeoJSON as unknown as FeatureCollection<Polygon>

export interface TerritoryConfig {
  id: string
  name: string
  geojson: FeatureCollection<Polygon>
  color?: string
  fillOpacity?: number
  weight?: number
}

export const DEFAULT_TERRITORIES: TerritoryConfig[] = [
  {
    id: 'SP',
    name: 'São Paulo',
    geojson: SP_BOUNDARY,
    color: '#00d4ff',
    fillOpacity: 0.06,
    weight: 2,
  },
]
