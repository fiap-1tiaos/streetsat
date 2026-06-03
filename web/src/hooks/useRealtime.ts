import { useState, useEffect, useCallback } from 'react'

interface RealtimeOptions<T> {
  fetcher: () => Promise<T>
  intervalMs?: number
  enabled?: boolean
}

export function useRealtime<T>({ fetcher, intervalMs = 30_000, enabled = true }: RealtimeOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const doFetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetcher()
      setData(result)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    if (!enabled) return
    doFetch()
    const id = setInterval(doFetch, intervalMs)
    return () => clearInterval(id)
  }, [doFetch, intervalMs, enabled])

  return { data, loading, error, lastUpdated, refetch: doFetch }
}
