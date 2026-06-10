import { RISK_COLORS, RISK_LABELS } from './utils'
import { getAllHighways } from '@/data/highways'
import type { RouteData } from './api'

export type RiskScore = 0 | 1 | 2 | 3

export function getMarkerColor(riskScore: number): string {
  return RISK_COLORS[riskScore as RiskScore] ?? '#22c55e'
}

export function getMarkerIcon(riskScore: number): string {
  return ['green', 'yellow', 'orange', 'red'][riskScore as RiskScore] ?? 'green'
}

export function getRiskLabel(riskScore: number): string {
  return RISK_LABELS[riskScore as RiskScore] ?? 'Livre'
}

export function formatKm(km: number): string {
  return `km ${km.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export interface RoadSegment {
  id: string
  road: string
  km_start: number
  km_end: number
  risk_score: number
  coordinates: [number, number][]
}

export interface RoutePolyline {
  id: string
  label: string
  coordinates: [number, number][]
  color: string
  risk_score: number
}

export function routeDataToPolylines(data: RouteData, label: string, color: string): RoutePolyline[] {
  const highways = getAllHighways()
  const waypointMap = new Map(highways.map((h) => [h.id, h.waypoints]))

  const result: RoutePolyline[] = []
  let polylineId = 0

  for (const seg of data.segments) {
    const wps = waypointMap.get(seg.road)
    if (!wps || wps.length < 2) continue

    const coords: [number, number][] = []
    for (const wp of wps) {
      if (wp.km >= seg.km_start && wp.km <= seg.km_end) {
        coords.push([wp.lat, wp.lon])
      }
    }
    if (coords.length < 2) {
      const start = wps.find((w) => w.km >= seg.km_start) ?? wps[0]
      const end = [...wps].reverse().find((w) => w.km <= seg.km_end) ?? wps[wps.length - 1]
      coords.push([start.lat, start.lon], [end.lat, end.lon])
    }

    result.push({
      id: `${label}-${polylineId++}`,
      label,
      coordinates: coords,
      color,
      risk_score: seg.risk_score,
    })
  }

  return result
}
