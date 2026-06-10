import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { RiskScoreResponse, RouteResponse, NearbyResponse } from '@/lib/api'

export function useRiskScore(road: string | null, km: number | null) {
  const [data, setData] = useState<RiskScoreResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!road || km === null) return

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await api.fetchRiskScore(road, km)
        setData(result)
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [road, km])

  return { data, loading, error }
}

export function useRouteOptimization(
  origin: { road: string; km: number } | null,
  destination: { road: string; km: number } | null
) {
  const [data, setData] = useState<RouteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!origin || !destination) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.fetchOptimizeRoute(origin, destination)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [origin, destination])

  return { data, loading, error, fetch }
}

export function useNearby(road: string | null, km: number | null, radius?: number) {
  const [data, setData] = useState<NearbyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!road || km === null) return

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await api.fetchNearby(road, km, radius)
        setData(result)
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [road, km, radius])

  return { data, loading, error }
}
