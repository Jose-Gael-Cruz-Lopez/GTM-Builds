import { apiFetch } from '../api-client'

export interface RetentionWindow {
  days: number
  label: string
  clientCount: number
  retentionRate: number
}

export interface RetentionResponse {
  totalClients: number
  windows: RetentionWindow[]
  statusBreakdown: { active: number; atRisk: number; lost: number }
  generatedAt: string
  cached?: boolean
}

export interface VisitsResponse {
  labels: string[]
  values: number[]
  rollingAvg: number[]
  totalVisits: number
  avgPerDay: number
  period: string
  generatedAt: string
  cached?: boolean
}

export interface ClientsAnalyticsResponse {
  total: number
  newLast30Days: number
  newLast7Days: number
  returning: number
  singleVisit: number
  breakdown: { labels: string[]; values: number[] }
  generatedAt: string
  cached?: boolean
}

export interface PeakHoursResponse {
  grid: number[][]
  dayLabels: string[]
  hourLabels: string[]
  peak: { day: string; hour: string; visitCount: number }
  totalVisitsAnalyzed: number
  generatedAt: string
  cached?: boolean
}

export interface ChurnRiskClient {
  clientId: string
  fullName: string
  phone: string | null
  email: string | null
  status: 'active' | 'at_risk' | 'lost'
  daysSinceVisit: number | null
  lastVisitAt: string | null
  totalVisits: number
  riskScore: number
}

export interface ChurnRiskResponse {
  clients: ChurnRiskClient[]
  counts: { highRisk: number; mediumRisk: number; earlyRisk: number }
  generatedAt: string
  cached?: boolean
}

export const analyticsApi = {
  retention: (id: string) => apiFetch<RetentionResponse>(`/businesses/${id}/retention`),
  visits: (id: string, days?: number) =>
    apiFetch<VisitsResponse>(`/businesses/${id}/visits${days !== undefined ? `?days=${days}` : ''}`),
  clients: (id: string) => apiFetch<ClientsAnalyticsResponse>(`/businesses/${id}/clients`),
  peakHours: (id: string) => apiFetch<PeakHoursResponse>(`/businesses/${id}/peak-hours`),
  churnRisk: (id: string) => apiFetch<ChurnRiskResponse>(`/businesses/${id}/churn-risk`),
}
