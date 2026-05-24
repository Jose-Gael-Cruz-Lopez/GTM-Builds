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

export interface GenerateCampaignsRequest {
  targetSegment?: CampaignTargetSegment
  objective?: string
  tone?: string
}

export interface UpdateCampaignPatch {
  title?: string
  messageTemplate?: string
  targetSegment?: CampaignTargetSegment
  sendTiming?: string
  expectedLift?: string
  status?: 'archived' | 'sent'
  sentAt?: string
}

export interface CampaignStatsResponse {
  campaign: Campaign
  stats: {
    targetAudience: number
    generatedBy: string
    aiModel: string | null
    sentCount: number | null
    openRate: number | null
    redemptionCount: number | null
    estimatedLift: string
    note?: string
  }
}

export const campaignsApi = {
  generate: (businessId: string, body?: GenerateCampaignsRequest) =>
    apiFetch<GenerateCampaignsResponse>(
      `/businesses/${businessId}/campaigns/generate`,
      { method: 'POST', body: body ?? {} }
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
  stats: (businessId: string, campaignId: string) =>
    apiFetch<CampaignStatsResponse>(
      `/businesses/${businessId}/campaigns/${campaignId}/stats`
    ),
}
