import type { QueryClient } from "@tanstack/react-query";
import type { StatsSummary } from "@/lib/api/businesses";

export type VisitStatsSnapshot = Pick<
  StatsSummary,
  "visitsToday" | "activeClients" | "totalClients"
>;

/** Refetch dashboard KPIs after a visit is registered (scan or staff flow). */
export function refreshDashboardStats(
  qc: QueryClient,
  businessId: string,
  snapshot?: VisitStatsSnapshot,
) {
  if (snapshot) {
    qc.setQueryData<StatsSummary>(["business", businessId, "stats"], (prev) =>
      prev ? { ...prev, ...snapshot } : prev,
    );
  }

  void qc.invalidateQueries({ queryKey: ["business", businessId, "stats"] });
  void qc.invalidateQueries({ queryKey: ["business", businessId, "visits-chart"] });
  void qc.invalidateQueries({ queryKey: ["business", businessId, "clients-breakdown"] });
  void qc.invalidateQueries({ queryKey: ["business", businessId, "visits-feed"] });
}
