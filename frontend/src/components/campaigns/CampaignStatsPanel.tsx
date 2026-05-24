import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { campaignsApi } from "@/lib/api/campaigns";

export function CampaignStatsPanel({
  businessId,
  campaignId,
}: {
  businessId: string;
  campaignId: string;
}) {
  const stats = useQuery({
    queryKey: ["business", businessId, "campaigns", campaignId, "stats"],
    queryFn: () => campaignsApi.stats(businessId, campaignId),
  });

  if (stats.isLoading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando métricas...
      </div>
    );
  }

  if (stats.isError || !stats.data) return null;

  const { stats: data } = stats.data;

  if (data.sentCount === null) {
    return (
      <div className="mt-4 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--ink-soft)]">
          <BarChart3 className="h-3.5 w-3.5 text-[var(--data-blue)]" />
          Métricas en preparación
        </div>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Pronto podrás ver aperturas, clics y conversiones de esta campaña.
        </p>
      </div>
    );
  }

  return (
    <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
      <Stat label="Enviados" value={String(data.sentCount)} />
      <Stat
        label="Apertura"
        value={data.openRate != null ? `${Math.round(data.openRate * 100)}%` : "—"}
      />
      <Stat label="Canjes" value={String(data.redemptionCount ?? "—")} />
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-2.5 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{label}</dt>
      <dd className="mt-0.5 font-semibold text-[var(--ink)]">{value}</dd>
    </div>
  );
}
