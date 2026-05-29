import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";
import type { ClientsAnalyticsResponse } from "@/lib/api/analytics";
import {
  AnalyticsCardSkeleton,
  AnalyticsEmptyState,
} from "@/components/dashboard/AnalyticsEmptyState";

export interface SegmentCardsProps {
  businessId: string;
  data?: ClientsAnalyticsResponse;
  isLoading: boolean;
  isError?: boolean;
}

interface Segment {
  key: "active" | "at_risk" | "lost";
  label: string;
  count: number;
  tone: "good" | "warn" | "risk";
  trend?: "up" | "down" | "flat";
}

function pickBreakdown(data: ClientsAnalyticsResponse) {
  const lookup = new Map<string, number>();
  data.breakdown.labels.forEach((label, i) => {
    lookup.set(label.toLowerCase(), data.breakdown.values[i] ?? 0);
  });

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = lookup.get(key);
      if (typeof v === "number") return v;
    }
    return 0;
  };

  return {
    active: pick("active", "activos"),
    atRisk: pick("at_risk", "at-risk", "atrisk", "en riesgo", "riesgo"),
    lost: pick("lost", "perdidos"),
  };
}

export function SegmentCards({ businessId, data, isLoading, isError }: SegmentCardsProps) {
  if (isLoading) return <AnalyticsCardSkeleton />;

  if (isError || !data) {
    return (
      <div className="surface-paper p-5">
        <h3 className="font-display font-semibold">Segmentos de clientes</h3>
        <AnalyticsEmptyState className="mt-4 border-0 bg-transparent py-8" />
      </div>
    );
  }

  const { active, atRisk, lost } = pickBreakdown(data);
  const total = active + atRisk + lost;

  const segments: Segment[] = [
    {
      key: "active",
      label: "Activos",
      count: active,
      tone: "good",
      trend: active >= atRisk ? "up" : "flat",
    },
    {
      key: "at_risk",
      label: "En riesgo",
      count: atRisk,
      tone: "warn",
      trend: atRisk > 0 ? "down" : "flat",
    },
    {
      key: "lost",
      label: "Perdidos",
      count: lost,
      tone: "risk",
      trend: lost > 0 ? "down" : "flat",
    },
  ];

  return (
    <div className="surface-paper flex h-full flex-col p-5">
      <div className="mb-4">
        <h3 className="font-display font-semibold">Segmentos de clientes</h3>
        <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
          {total} en total · {data.newLast30Days} nuevos (30d)
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={cn(
              "flex items-center gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-cream)] p-4 cursor-default",
            )}
          >
            <div
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius)]",
                segment.tone === "good" &&
                  "bg-[color-mix(in_srgb,var(--color-status-good)_18%,var(--color-cream))]",
                segment.tone === "warn" &&
                  "bg-[color-mix(in_srgb,var(--color-status-warn)_18%,var(--color-cream))]",
                segment.tone === "risk" &&
                  "bg-[color-mix(in_srgb,var(--color-status-risk)_14%,var(--color-cream))]",
              )}
            >
              <TrendingUp
                className={cn(
                  "h-5 w-5",
                  segment.tone === "good" && "text-[color:var(--color-status-good)]",
                  segment.tone === "warn" && "text-[color:var(--color-status-warn)]",
                  segment.tone === "risk" && "text-[color:var(--color-status-risk)]",
                )}
                aria-hidden
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StatusDot tone={segment.tone} />
                <span className="text-sm font-medium">{segment.label}</span>
              </div>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">{segment.count}</p>
            </div>

            <div className="text-[color:var(--color-ink-soft)]">
              {segment.trend === "up" ? (
                <ArrowUp className="h-4 w-4 text-[color:var(--color-status-good)]" aria-hidden />
              ) : segment.trend === "down" ? (
                <ArrowDown className="h-4 w-4 text-[color:var(--color-status-warn)]" aria-hidden />
              ) : (
                <span className="text-xs">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
