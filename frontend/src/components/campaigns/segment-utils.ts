import type { CampaignTargetSegment } from '@/integrations/supabase/types'
import type { ClientsAnalyticsResponse } from '@/lib/api/analytics'
import type { ChurnRiskClient, ChurnRiskResponse } from '@/lib/api/analytics'

export const SEGMENT_OPTIONS: {
  value: CampaignTargetSegment
  label: string
  description: string
  accent: string
}[] = [
  {
    value: 'at_risk',
    label: 'En riesgo',
    description: 'Clientes que no han visitado recientemente',
    accent: 'var(--status-warn)',
  },
  {
    value: 'lost',
    label: 'Perdidos',
    description: 'Sin visitas en mucho tiempo',
    accent: 'var(--status-risk)',
  },
  {
    value: 'all',
    label: 'Todos los activos',
    description: 'Clientes con actividad reciente',
    accent: 'var(--status-good)',
  },
  {
    value: 'frequent',
    label: 'Frecuentes',
    description: '3+ visitas — tus mejores clientes',
    accent: 'var(--data-blue)',
  },
]

export const segmentLabel: Record<CampaignTargetSegment, string> = {
  at_risk: 'En riesgo',
  lost: 'Perdidos',
  all: 'Todos los activos',
  frequent: 'Frecuentes',
}

export const SEND_TIMING_OPTIONS = [
  { value: 'Inmediato', label: 'Inmediato' },
  { value: 'Mañana 10am', label: 'Mañana 10am' },
  { value: 'Próxima semana', label: 'Próxima semana' },
] as const

export const TONE_OPTIONS = [
  { value: 'calido', label: 'Cálido' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'divertido', label: 'Divertido' },
] as const

export function getSegmentCount(
  segment: CampaignTargetSegment,
  clients?: ClientsAnalyticsResponse,
  churn?: ChurnRiskResponse,
): number {
  if (!clients) return 0
  const [active, atRisk, lost] = clients.breakdown.values
  switch (segment) {
    case 'at_risk':
      return atRisk
    case 'lost':
      return lost
    case 'all':
      return active
    case 'frequent':
      return churn?.clients.filter((c) => c.totalVisits >= 3).length ?? 0
    default:
      return 0
  }
}

export function filterAudienceBySegment(
  segment: CampaignTargetSegment,
  clients: ChurnRiskClient[],
): ChurnRiskClient[] {
  switch (segment) {
    case 'at_risk':
      return clients.filter((c) => c.status === 'at_risk')
    case 'lost':
      return clients.filter((c) => c.status === 'lost')
    case 'all':
      return clients.filter((c) => c.status === 'active')
    case 'frequent':
      return clients.filter((c) => c.totalVisits >= 3)
    default:
      return clients
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
