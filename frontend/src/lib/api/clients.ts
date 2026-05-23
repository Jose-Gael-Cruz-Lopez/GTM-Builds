import { apiFetch } from '../api-client'
import type {
  BusinessCategory,
  ClientStatus,
  Tables,
} from '@/integrations/supabase/types'

export type ClientProfile = Tables<'clients'>
export type ClientBusinessLoyalty = Tables<'client_business_loyalty'>

export interface RegisterClientRequest {
  fullName: string
  phone?: string
  email?: string
  businessId?: string
}

export interface RegisterClientResponse {
  client: ClientProfile
  loyaltyLink: ClientBusinessLoyalty | null
}

export interface LoyaltyForBusinessResponse {
  client: { id: string; fullName: string }
  business: { id: string; name: string; category: BusinessCategory }
  loyalty: {
    stampCount: number
    stampsRequired: number
    stampsRemaining: number
    progressPercent: number
    rewardDescription: string
    totalVisits: number
    totalRewards: number
    lastVisitAt: string | null
    status: ClientStatus
  }
}

export interface LoyaltyCard {
  businessId: string
  businessName: string
  businessCategory: BusinessCategory
  stampCount: number
  stampsRequired: number
  progressPercent: number
  rewardDescription: string
  totalVisits: number
  lastVisitAt: string | null
  status: ClientStatus
}

export const clientsApi = {
  register: (body: RegisterClientRequest) =>
    apiFetch<RegisterClientResponse>('/clients', { method: 'POST', body }),
  getMe: () =>
    apiFetch<{ client: ClientProfile }>('/clients/me'),
  getLoyalty: (businessId: string) =>
    apiFetch<LoyaltyForBusinessResponse>(`/clients/me/loyalty/${businessId}`),
  listLoyaltyCards: () =>
    apiFetch<{ cards: LoyaltyCard[] }>('/clients/me/loyalty'),
}
