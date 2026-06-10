import { useMemo } from 'react'
import { getAllHighways } from '@/data/highways'
import type { RoadSegment } from '@/lib/map-utils'
import type { Occurrence } from '@/lib/utils'

const SEGMENT_LENGTH_KM = 10

function getSegmentCoordinates(
  waypoints: { km: number; lat: number; lon: number }[],
  startKm: number,
  endKm: number
): [number, number][] {
  const coords: [number, number][] = []
  for (const wp of waypoints) {
    if (wp.km >= startKm && wp.km <= endKm) {
      coords.push([wp.lat, wp.lon] as [number, number])
    }
  }
  if (coords.length < 2) {
    const startWp = waypoints.find((w) => w.km >= startKm) ?? waypoints[0]
    const endWp = [...waypoints].reverse().find((w) => w.km <= endKm) ?? waypoints[waypoints.length - 1]
    coords.push([startWp.lat, startWp.lon] as [number, number])
    coords.push([endWp.lat, endWp.lon] as [number, number])
  }
  return coords
}

export function useHighwaySegments(occurrences: Occurrence[]): RoadSegment[] {
  return useMemo(() => {
    const highways = getAllHighways()
    const segments: RoadSegment[] = []
    let segId = 0

    for (const hw of highways) {
      const occs = occurrences
        .filter((o) => o.road.toUpperCase() === hw.id)
        .map((o) => ({ km: o.km, risk_score: o.risk_score }))
        .sort((a, b) => a.km - b.km)

      const wps = hw.waypoints
      if (wps.length < 2) continue

      const maxKm = wps[wps.length - 1].km
      const minKm = wps[0].km

      const riskMap = new Map<number, number>()
      for (const occ of occs) {
        const key = Math.floor(occ.km / 10) * 10
        const existing = riskMap.get(key) ?? 0
        riskMap.set(key, Math.max(existing, occ.risk_score))
      }

      for (let start = minKm; start < maxKm; start += SEGMENT_LENGTH_KM) {
        const end = Math.min(start + SEGMENT_LENGTH_KM, maxKm)
        const key = Math.floor((start + end) / 2 / 10) * 10
        const risk_score = riskMap.get(key) ?? 0
        const coordinates = getSegmentCoordinates(wps, start, end)

        segments.push({
          id: `${hw.id}-${segId++}`,
          road: hw.id,
          km_start: start,
          km_end: end,
          risk_score,
          coordinates,
        })
      }
    }

    return segments
  }, [occurrences])
}
