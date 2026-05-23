import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { VisitsResponse } from "@/lib/api/analytics";

export interface VisitsChartProps {
  data?: VisitsResponse;
  isLoading: boolean;
}

interface ChartPoint {
  day: string;
  visits: number;
  avg: number;
}

export function VisitsChart({ data, isLoading }: VisitsChartProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <div className="h-5 w-24 animate-pulse rounded bg-muted/30" />
          <div className="h-3 w-28 animate-pulse rounded bg-muted/30" />
        </div>
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted/20" />
      </div>
    );
  }

  if (!data || data.labels.length === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display font-semibold">Visitas</h3>
          <span className="text-sm muted-text">Sin datos</span>
        </div>
        <div className="mt-4 grid h-64 place-items-center text-sm muted-text">
          Aún no hay visitas registradas en este periodo.
        </div>
      </div>
    );
  }

  const chart: ChartPoint[] = data.labels.map((label, i) => ({
    day: formatDay(label),
    visits: data.values[i] ?? 0,
    avg: Number((data.rollingAvg[i] ?? 0).toFixed(2)),
  }));

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display font-semibold">Visitas</h3>
        <div className="text-sm muted-text">
          {data.period} · {data.totalVisits} total ·{" "}
          {data.avgPerDay.toFixed(1)}/día
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chart}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              cursor={{ stroke: "var(--ring)", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                value,
                name === "visits" ? "Visitas" : "Promedio (7d)",
              ]}
              labelFormatter={(label) => `Día ${label}`}
            />
            <Line
              type="monotone"
              dataKey="visits"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)" }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatDay(label: string): string {
  // Backend returns ISO-like labels (YYYY-MM-DD). Render as DD/MM for compact axis ticks.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (match) return `${match[3]}/${match[2]}`;
  return label;
}
