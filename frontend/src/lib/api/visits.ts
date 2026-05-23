import { apiFetch } from '../api-client'
import type { Tables } from '@/integrations/supabase/types'

export type Visit = Tables<'visits'>

export interface RegisterVisitRequest {
  token: string
  notes?: string
}

export interface RegisterVisitResponse {
  visit: {
    id: string
    clientId: string
    clientName: string
    businessId: string
    createdAt: string
  } | Visit
  stamps?: {
    previous: number
    added: number
    current: number
    required: number
    remaining: number
  }
  rewardUnlocked: boolean
  reward?: { id: string; description: string } | null
  alreadyRegistered?: boolean
}

export interface ListMyVisitsParams {
  businessId?: string
  limit?: number
  offset?: number
}

export interface ListMyVisitsResponse {
  visits: Visit[]
  count: number
}

function toQuery(params?: ListMyVisitsParams): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  if (params.businessId !== undefined) sp.set('businessId', params.businessId)
  if (params.limit !== undefined) sp.set('limit', String(params.limit))
  if (params.offset !== undefined) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export const visitsApi = {
  register: (body: RegisterVisitRequest) =>
    apiFetch<RegisterVisitResponse>('/visits', { method: 'POST', body, staffKey: true }),
  listMine: (params?: ListMyVisitsParams) =>
    apiFetch<ListMyVisitsResponse>(`/visits/me/visits${toQuery(params)}`),
}
