import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  AnalyticsCardSkeleton,
  AnalyticsEmptyState,
} from "@/components/dashboard/AnalyticsEmptyState";

export interface VisitsChartProps {
  businessId: string;
  defaultDays?: 7 | 30 | 90;
}

interface ChartPoint {
  day: string;
  visits: number;
}

const PERIOD_OPTIONS = [7, 30, 90] as const;

export function VisitsChart({ businessId, defaultDays = 30 }: VisitsChartProps) {
  const [days, setDays] = useState<(typeof PERIOD_OPTIONS)[number]>(defaultDays);

  const visits = useQuery({
    queryKey: ["business", businessId, "visits-chart", days],
    queryFn: () => analyticsApi.visits(businessId, days),
    retry: (count, err) => !(err instanceof ApiError && err.code === "AUTH_FORBIDDEN") && count < 2,
  });

  if (visits.isLoading) return <AnalyticsCardSkeleton />;

  if (visits.isError || !visits.data || visits.data.labels.length === 0) {
    return (
      <div className="surface-paper p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display font-semibold">Visitas</h3>
          <PeriodToggle days={days} onChange={setDays} />
        </div>
        <AnalyticsEmptyState className="border-0 bg-transparent py-8" />
      </div>
    );
  }

  const chart: ChartPoint[] = visits.data.labels.map((label, i) => ({
    day: formatDay(label),
    visits: visits.data!.values[i] ?? 0,
  }));

  const useBars = days <= 7;

  return (
    <div className="surface-paper p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold">Visitas</h3>
          <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
            {visits.data.totalVisits} total · {visits.data.avgPerDay.toFixed(1)}/día
          </p>
        </div>
        <PeriodToggle days={days} onChange={setDays} />
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {useBars ? (
            <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                minTickGap={8}
              />
              <YAxis
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "color-mix(in srgb, var(--color-data-blue) 10%, transparent)" }}
                contentStyle={tooltipStyle}
                formatter={(value: number) => [value, "Visitas"]}
                labelFormatter={(label) => `Fecha ${label}`}
              />
              <Bar dataKey="visits" fill="var(--color-data-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-data-blue)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-data-blue)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                minTickGap={16}
              />
              <YAxis
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-data-blue)", strokeWidth: 1 }}
                contentStyle={tooltipStyle}
                formatter={(value: number) => [value, "Visitas"]}
                labelFormatter={(label) => `Fecha ${label}`}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="var(--color-data-blue)"
                strokeWidth={2}
                fill="url(#visitsFill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-data-blue)" }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--surface)",
  fontSize: 12,
};

function PeriodToggle({
  days,
  onChange,
}: {
  days: (typeof PERIOD_OPTIONS)[number];
  onChange: (d: (typeof PERIOD_OPTIONS)[number]) => void;
}) {
  return (
    <div className="inline-flex rounded-[var(--radius-pill)] border border-[color:var(--color-border)] bg-[var(--color-bg-paper)] p-0.5">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors",
            days === option
              ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
              : "text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]",
          )}
          aria-pressed={days === option}
        >
          {option}d
        </button>
      ))}
    </div>
  );
}

function formatDay(label: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (match) return `${match[3]}/${match[2]}`;
  return label;
}
