const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface RiskScoreResponse {
  road: string
  km: number
  risk_score: number
  risk_label: string
  confidence: number
  features?: Record<string, number>
}

export interface RouteSegment {
  road: string
  km_start: number
  km_end: number
  risk_score: number
  risk_label: string
  distance_km: number
}

export interface RouteData {
  segments: RouteSegment[]
  total_distance_km: number
  total_risk: number
  avg_risk: number
  estimated_time_min: number
}

export interface RouteResponse {
  safe_route: RouteData
  direct_route: RouteData
  risk_reduction_pct: number
  km_overhead: number
}

export interface NearbyPoint {
  id: string
  road: string
  km: number
  risk_score: number
  risk_label: string
  municipio: string
  state: string
  occurrence_type: string
  detected_at: string
  latitude: number
  longitude: number
}

export interface NearbyResponse {
  points: NearbyPoint[]
  total: number
  radius_km: number
}

export interface AlertResponse {
  id: string
  message: string
  risk_score: number
  road: string
  km?: number
  municipio?: string
  city?: string
  state?: string
  occurrence_type?: string
  risk_label?: string
  criticality?: number
  victims_total?: number
  narrative?: string
  latitude?: number
  longitude?: number
  detected_at: string
  status: string
}

export interface QueueStatus {
  queue_url: string
  messages_available: number
  messages_in_flight: number
  approximate_age_seconds: number
}

export interface PipelineStatusResponse {
  last_scrape: { status: string; last_run: string | null; occurrences_count: number; elapsed_seconds: number; error: string | null }
  inference_queue: QueueStatus
  last_inference: { status: string; last_run: string | null; alerts_generated: number; elapsed_seconds: number; error: string | null }
  alerts_queue: QueueStatus
  last_alert_publish: { status: string; last_run: string | null; published_count: number; elapsed_seconds: number; error: string | null }
  sns_topic: { topic_arn: string; active_subscriptions: number }
  s3_raw_count: number
  alert_history_24h: number
}

export interface HeatmapCell {
  count: number
  avg_risk: number
}

export interface HeatmapResponse {
  days: string[]
  hours: string[]
  matrix: HeatmapCell[][]
}

export interface NasaStatusResponse {
  eonet: {
    total_active_events: number
    total_global: number
    categories: Record<string, number>
    events: Array<{ event_id: string; title: string; category: string; lat: number; lon: number; magnitude?: number; distance_km?: number }>
    last_collected: string | null
    region_km: number
  }
  weather: {
    precipitation_mm: number
    wind_speed_ms: number
    temperature_c: number
    humidity: number
  }
  firms: { max_frp_nearby: number }
  collected_at: string
  note: string
}

export interface PipelineLogEntry {
  timestamp: string
  source: string
  level: string
  message: string
}

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => apiFetch<{ status: string; model_loaded: boolean; timestamp: string }>('/health'),
  occurrences: () =>
    apiFetch<{ total: number; items: unknown[] }>('/occurrences').then((r) => r.items),
  risk: (road: string, km: number) => apiFetch<RiskScoreResponse>(`/risk/${road}/km/${km}`),
  optimizeRoute: (body: unknown) => apiFetch<unknown>('/route/optimize', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  modelMetadata: () => apiFetch<{
    model_type: string; version: string; trained_at: string;
    accuracy: number; f1_score: number; n_train: number; n_test: number;
    features: string[]; feature_importances: number[];
  }>('/model/metadata').catch(() => null),
  alerts: (params?: { min_risk_score?: number; limit?: number }) =>
    apiFetch<{ total: number; items: AlertResponse[] }>('/alerts' + (params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString() : '')).then(r => r.items).catch(() => [] as AlertResponse[]),
  pipelineStatus: () =>
    apiFetch<PipelineStatusResponse>('/pipeline/status').catch(() => null),
  pipelineLogs: (params?: { source?: string; limit?: number }) =>
    apiFetch<{ total: number; items: PipelineLogEntry[] }>('/pipeline/logs' + (params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString() : '')).catch(() => ({ total: 0, items: [] })),
  pipelineTriggerScraper: () =>
    apiFetch<{ status: string; function: string; status_code: number }>('/pipeline/trigger/scraper', { method: 'POST' }),

  fetchHeatmap: () =>
    apiFetch<HeatmapResponse>('/occurrences/heatmap'),

  fetchRiskScore: (road: string, km: number) =>
    apiFetch<RiskScoreResponse>(`/risk/${road}/km/${km}`),

  fetchOptimizeRoute: (
    origin: { road: string; km: number },
    destination: { road: string; km: number }
  ) =>
    apiFetch<RouteResponse>('/route/optimize', {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    }),

  nasaStatus: () => apiFetch<NasaStatusResponse>('/nasa/status'),

  fetchNearby: (road: string, km: number, radius?: number) => {
    const params = new URLSearchParams()
    if (radius) params.set('radius', String(radius))
    return apiFetch<NearbyResponse>(`/nearby/${road}/km/${km}?${params}`)
  },
}
