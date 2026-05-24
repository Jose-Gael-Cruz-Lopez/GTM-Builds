import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ClientsAnalyticsResponse } from "@/lib/api/analytics";

export interface ClientsBreakdownProps {
  data?: ClientsAnalyticsResponse;
  isLoading: boolean;
}

interface Slice {
  key: "active" | "atRisk" | "lost";
  label: string;
  value: number;
  color: string;
}

export function ClientsBreakdown({ data, isLoading }: ClientsBreakdownProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-muted/30" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted/20" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-5">
        <h3 className="font-display font-semibold">Tus clientes</h3>
        <div className="mt-4 grid h-64 place-items-center text-sm muted-text">Sin datos</div>
      </div>
    );
  }

  const { active, atRisk, lost } = pickBreakdown(data);
  const total = active + atRisk + lost;

  const slices: Slice[] = [
    { key: "active", label: "Activos", value: active, color: "#10b981" },
    { key: "atRisk", label: "En riesgo", value: atRisk, color: "#f59e0b" },
    { key: "lost", label: "Perdidos", value: lost, color: "#f43f5e" },
  ];

  const hasAny = total > 0;
  const chartData = hasAny ? slices.filter((s) => s.value > 0) : [];

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display font-semibold">Tus clientes</h3>
        <div className="text-sm muted-text">
          {data.total} en total · {data.newLast30Days} nuevos (30d)
        </div>
      </div>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr,auto]">
        <div className="h-56">
          {hasAny ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm muted-text">
              Aún no tienes clientes registrados.
            </div>
          )}
        </div>

        <ul className="space-y-3 text-sm">
          {slices.map((slice) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <li key={slice.key} className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="flex-1">{slice.label}</span>
                <span className="font-semibold tabular-nums">{slice.value}</span>
                <span className="w-10 text-right text-xs muted-text tabular-nums">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function pickBreakdown(data: ClientsAnalyticsResponse): {
  active: number;
  atRisk: number;
  lost: number;
} {
  const lookup = new Map<string, number>();
  data.breakdown.labels.forEach((label, i) => {
    lookup.set(label.toLowerCase(), data.breakdown.values[i] ?? 0);
  });

  const pick = (...keys: string[]): number => {
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
