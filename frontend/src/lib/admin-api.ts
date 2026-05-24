import { apiFetch, ApiError } from "./api-client";
import type { ClientStatus } from "@/integrations/supabase/types";

export interface AdminClientItem {
  clientId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  stampCount: number;
  totalVisits: number;
  totalRewards: number;
  lastVisitAt: string | null;
  status: ClientStatus;
  joinedAt: string;
}

export interface AdminClientsResponse {
  items: AdminClientItem[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export interface AdminVisitRow {
  id: string;
  client_id: string;
  business_id: string;
  created_at: string;
  notes: string | null;
  reward_unlocked: boolean;
  stamps_before: number | null;
  stamps_after: number | null;
  staff_key_id: string | null;
}

export function isAdminRouteUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 400 || error.status === 404) &&
    (error.code === "VALIDATION_ERROR" || error.code === "NOT_FOUND")
  );
}

export const adminApi = {
  listClients: (params: {
    businessId: string;
    page?: number;
    limit?: number;
    status?: ClientStatus;
  }) => {
    const sp = new URLSearchParams({ businessId: params.businessId });
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.status) sp.set("status", params.status);
    return apiFetch<AdminClientsResponse>(`/clients/businesses-clients?${sp}`);
  },

  listVisits: (params: {
    businessId: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) => {
    const sp = new URLSearchParams({ businessId: params.businessId });
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.offset) sp.set("offset", String(params.offset));
    return apiFetch<{ visits: AdminVisitRow[]; count: number }>(`/visits/business-visits?${sp}`);
  },
};
