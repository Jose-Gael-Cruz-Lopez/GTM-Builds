import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RetentionResponse } from "@/lib/api/analytics";
import {
  AnalyticsCardSkeleton,
  AnalyticsEmptyState,
} from "@/components/dashboard/AnalyticsEmptyState";

export interface RetentionChartProps {
  data?: RetentionResponse;
  isLoading: boolean;
  isError?: boolean;
}

export function RetentionChart({ data, isLoading, isError }: RetentionChartProps) {
  if (isLoading) return <AnalyticsCardSkeleton />;

  if (isError || !data || data.windows.length === 0) {
    return (
      <div className="surface-paper p-5">
        <h3 className="font-display font-semibold">Retención</h3>
        <AnalyticsEmptyState className="mt-4 border-0 bg-transparent py-8" />
      </div>
    );
  }

  const chartData = data.windows.map((w) => ({
    label: w.label.replace("Last ", "").replace(" days", "d"),
    rate: w.retentionRate,
    clients: w.clientCount,
  }));

  return (
    <div className="surface-paper p-5">
      <div className="mb-4">
        <h3 className="font-display font-semibold">Retención</h3>
        <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
          Cohortes de {data.totalClients} clientes · ventanas 30/60/90 días
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              orientation="right"
              tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
              tickLine={false}
              axisLine={false}
              unit="%"
              width={40}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in srgb, var(--color-data-blue) 8%, transparent)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--surface)",
                fontSize: 12,
              }}
              formatter={(value: number, _name, item) => [
                `${value}% (${item.payload.clients} clientes)`,
                "Retención",
              ]}
            />
            <Bar
              dataKey="rate"
              fill="var(--color-data-blue)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
