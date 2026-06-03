const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  health: () => apiFetch<{ status: string; model_loaded: boolean; timestamp: string }>('/health'),
  occurrences: () =>
    apiFetch<{ total: number; items: unknown[] }>('/occurrences').then((r) => r.items),
  risk: (br: number, km: number) => apiFetch<{
    br: number; km: number; risk_score: number; risk_label: string; confidence: number
  }>(`/risk/br/${br}/km/${km}`),
  optimizeRoute: (body: unknown) => apiFetch<unknown>('/route/optimize', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  modelMetadata: () => apiFetch<{
    model_type: string; version: string; trained_at: string;
    accuracy: number; f1_score: number; n_train: number; n_test: number;
    features: string[]; feature_importances: number[];
  }>('/model/metadata').catch(() => null),
  alerts: () => apiFetch<unknown[]>('/alerts').catch(() => []),
}
