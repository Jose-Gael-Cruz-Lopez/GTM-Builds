import { apiFetch } from "../api-client";

export interface AssistantInsights {
  segmentAnalysis: {
    lostInsight: string;
    newInsight: string;
    frequentInsight: string;
  };
  serviceAnalysis: {
    slowPeriods: string[];
    activePeriods: string[];
    lowPerformanceReasons: string[];
    predictions: string[];
  };
  recommendations: {
    forLost: string;
    forFrequent: string;
    forNew: string;
    suggestedDiscountLost: number;
    suggestedDiscountFrequent: number;
    suggestedDiscountNew: number;
    suggestedVisitsForReward: number;
  };
}

export interface AnalyzeResponse {
  periodDays: number;
  visitCount: number;
  uniqueClientsInPeriod: number;
  segments: {
    total: number;
    newClients: number;
    frequentClients: number;
    lostClients: number;
    atRiskClients: number;
  };
  peakDay: string;
  slowDay: string;
  peakHour: string;
  slowHour: string;
  insights: AssistantInsights;
  usedFallback: boolean;
  isDemo: boolean;
  generatedAt: string;
}

export interface CreateCampaignRequest {
  segment: "lost" | "frequent" | "new";
  discountPct: number;
  durationDays: number;
}

export interface CreateCampaignResponse {
  campaign: {
    id: string;
    title: string;
    message_template: string;
    target_segment: string;
    status: string;
  };
  targetAudience: number;
  discountPct: number;
  durationDays: number;
  expiresAt: string;
}

export interface UpdateLoyaltyRequest {
  visitsRequired: number;
  rewardDescription?: string;
}

export interface UpdateLoyaltyResponse {
  loyaltyConfig: {
    id: string;
    stamps_required: number;
    reward_description: string;
    is_active: boolean;
  };
  action: "created" | "updated";
}

export const assistantApi = {
  analyze: (businessId: string) =>
    apiFetch<AnalyzeResponse>(`/businesses/${businessId}/assistant/analyze`, {
      method: "POST",
      body: {},
      timeoutMs: 30_000,
    }),

  createCampaign: (businessId: string, body: CreateCampaignRequest) =>
    apiFetch<CreateCampaignResponse>(`/businesses/${businessId}/assistant/campaign`, {
      method: "POST",
      body,
    }),

  updateLoyalty: (businessId: string, body: UpdateLoyaltyRequest) =>
    apiFetch<UpdateLoyaltyResponse>(`/businesses/${businessId}/assistant/loyalty`, {
      method: "PATCH",
      body,
    }),
};
