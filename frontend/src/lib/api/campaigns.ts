import { apiFetch } from '../api-client'
import type {
  CampaignStatus,
  CampaignTargetSegment,
  Tables,
} from '@/integrations/supabase/types'

export type Campaign = Tables<'campaigns'>

export interface GenerateCampaignsResponse {
  campaigns: Campaign[]
  generatedBy: 'nvidia-nim' | 'fallback'
  model: string
  context: {
    totalClients: number
    atRiskClients: number
    lostClients: number
  }
}

export interface GroupedCampaigns {
  draft: Campaign[]
  active: Campaign[]
  sent: Campaign[]
  archived: Campaign[]
}

export type ListCampaignsResponse =
  | { campaigns: Campaign[]; total: number }
  | { campaigns: GroupedCampaigns; total: number }

export interface UpdateCampaignPatch {
  title?: string
  messageTemplate?: string
  targetSegment?: CampaignTargetSegment
  sendTiming?: string
  expectedLift?: string
  status?: 'archived'
}

export const campaignsApi = {
  generate: (businessId: string) =>
    apiFetch<GenerateCampaignsResponse>(
      `/businesses/${businessId}/campaigns/generate`,
      { method: 'POST' }
    ),
  list: (businessId: string, status?: CampaignStatus) =>
    apiFetch<ListCampaignsResponse>(
      `/businesses/${businessId}/campaigns${status ? `?status=${status}` : ''}`
    ),
  get: (businessId: string, campaignId: string) =>
    apiFetch<{ campaign: Campaign }>(
      `/businesses/${businessId}/campaigns/${campaignId}`
    ),
  activate: (businessId: string, campaignId: string) =>
    apiFetch<{ campaign: Campaign }>(
      `/businesses/${businessId}/campaigns/${campaignId}/activate`,
      { method: 'POST' }
    ),
  update: (businessId: string, campaignId: string, patch: UpdateCampaignPatch) =>
    apiFetch<{ campaign: Campaign }>(
      `/businesses/${businessId}/campaigns/${campaignId}`,
      { method: 'PATCH', body: patch }
    ),
}
