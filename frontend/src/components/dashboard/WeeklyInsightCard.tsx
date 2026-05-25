import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { PeakHoursResponse } from "@/lib/api/analytics";
import { buildPeakInsight } from "@/components/dashboard/PeakHoursHeatmap";
import { AnalyticsCardSkeleton } from "@/components/dashboard/AnalyticsEmptyState";

export interface WeeklyInsightCardProps {
  businessId: string;
  peakHours?: PeakHoursResponse;
  isLoading: boolean;
}

export function WeeklyInsightCard({ businessId, peakHours, isLoading }: WeeklyInsightCardProps) {
  if (isLoading) return <AnalyticsCardSkeleton className="min-h-[160px]" />;

  const insight = peakHours
    ? buildPeakInsight(peakHours)
    : "Comparte tu enlace con clientes para descubrir patrones de visita esta semana.";

  const ctaTo = "/dashboard/$businessId/assistant" as const;

  return (
    <article className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-cream)] p-6 shadow-[var(--shadow-soft)] md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 85% 15%, color-mix(in srgb, var(--color-health) 35%, transparent), transparent 45%), radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--color-signal) 20%, transparent), transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative grid gap-6 md:grid-cols-[1fr,auto] md:items-center">
        <div>
          <p className="eyebrow mb-2">Insight de la semana</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Lo que tus datos dicen hoy
          </h2>
          <ul className="mt-4 space-y-2">
            <li className="flex gap-3 text-sm text-[color:var(--color-ink-soft)] md:text-base">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-signal)]"
                aria-hidden
              />
              <span>{insight}</span>
            </li>
          </ul>
        </div>

        <Link
          to={ctaTo}
          params={{ businessId }}
          className="btn-signal inline-flex shrink-0 items-center justify-center text-sm"
        >
          Abrir asistente IA
        </Link>
      </div>
    </article>
  );
}
