import { apiFetch } from '../api-client'
import type { BusinessCategory, BusinessPlan, Tables } from '@/integrations/supabase/types'

export type Business = Tables<'businesses'>
export type LoyaltyConfig = Tables<'loyalty_configs'>

export interface CreateBusinessRequest {
  name: string
  category: BusinessCategory
  plan?: BusinessPlan
  stampsRequired?: number
  rewardDescription?: string
}

export interface UpdateBusinessPatch {
  name?: string
  isActive?: boolean
  plan?: BusinessPlan
}

export interface UpdateLoyaltyConfigPatch {
  stampsRequired?: number
  rewardDescription?: string
  isActive?: boolean
}

export interface StaffKeySummary {
  id: string
  label: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface CreateStaffKeyResponse {
  id: string
  label: string
  rawKey: string
  headerValue: string
  createdAt: string
}

export interface StatsSummary {
  totalClients: number
  activeClients: number
  atRiskClients: number
  lostClients: number
  visitsToday: number
  activeCampaigns: number
  generatedAt: string
  cached?: boolean
}

export const businessesApi = {
  create: (body: CreateBusinessRequest) =>
    apiFetch<{ business: Business; loyaltyConfig: LoyaltyConfig }>('/businesses', { method: 'POST', body }),
  get: (id: string) => apiFetch<{ business: Business }>(`/businesses/${id}`),
  update: (id: string, patch: UpdateBusinessPatch) =>
    apiFetch<{ business: Business }>(`/businesses/${id}`, { method: 'PATCH', body: patch }),
  getLoyaltyConfig: (id: string) =>
    apiFetch<{ loyaltyConfig: LoyaltyConfig }>(`/businesses/${id}/loyalty-config`),
  updateLoyaltyConfig: (id: string, patch: UpdateLoyaltyConfigPatch) =>
    apiFetch<{ loyaltyConfig: LoyaltyConfig }>(`/businesses/${id}/loyalty-config`, { method: 'PATCH', body: patch }),
  createStaffKey: (id: string, body: { label: string }) =>
    apiFetch<CreateStaffKeyResponse>(`/businesses/${id}/staff-keys`, { method: 'POST', body }),
  listStaffKeys: (id: string) =>
    apiFetch<{ staffKeys: StaffKeySummary[] }>(`/businesses/${id}/staff-keys`),
  deleteStaffKey: (id: string, keyId: string) =>
    apiFetch<{ deactivated: boolean; keyId: string }>(`/businesses/${id}/staff-keys/${keyId}`, { method: 'DELETE' }),
  getStatsSummary: (id: string) => apiFetch<StatsSummary>(`/businesses/${id}/stats/summary`),
}
