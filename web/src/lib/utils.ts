import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const RISK_LABELS = ['Livre', 'Atenção', 'Alto', 'Crítico'] as const
export const RISK_COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'] as const
export const RISK_BG = [
  'rgba(34,197,94,0.1)',
  'rgba(245,158,11,0.1)',
  'rgba(249,115,22,0.1)',
  'rgba(239,68,68,0.1)',
] as const

export type RiskScore = 0 | 1 | 2 | 3

export interface Occurrence {
  id: string
  br: number
  km: number
  municipio: string
  uf: string
  tipo: string
  interdicao: boolean
  risk_score: RiskScore
  risk_label: string
  nlp_sentiment?: string
  nlp_boost?: number
  narrativa?: string
  detectado_em: string
  lat?: number
  lon?: number
}

export interface Alert {
  id: string
  message: string
  risk_score: RiskScore
  br: number
  municipio: string
  timestamp: string
  status: 'sent' | 'mock' | 'failed'
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
