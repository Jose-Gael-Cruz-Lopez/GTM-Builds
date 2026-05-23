# 04 — Admin Dashboard

**Wave**: 3 (parallel with 05, 06, 07; after Wave 2)
**Working dir**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

Business owners need a `/dashboard/$businessId` page showing live stats + analytics from the backend. The backend already exposes everything we need under `/businesses/:id/stats/summary` and `/businesses/:id/{retention,visits,clients,peak-hours,churn-risk}`. All require `requireAdmin()` (owner JWT).

`recharts` is **not** installed yet. We use Tailwind + custom-rendered bars / sparklines OR install `recharts` — install `recharts` for nicer visuals:

```bash
cd frontend
npm install recharts
```

## Prerequisites

- Wave 1: `apiFetch`, `businessesApi`, `analyticsApi`, `useSession`
- Wave 2: working login flow (so we can land here authenticated)

## Tasks

### 1. Create `/dashboard/$businessId` route

`frontend/src/routes/dashboard.$businessId.tsx` (TanStack file-based: dot-segment = path param).

Skeleton:

```tsx
import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { businessesApi } from "@/lib/api/businesses"
import { analyticsApi } from "@/lib/api/analytics"
import { Card } from "@/components/dashboard/StatCard"
import { VisitsChart } from "@/components/dashboard/VisitsChart"
import { ClientsBreakdown } from "@/components/dashboard/ClientsBreakdown"
import { ChurnRiskList } from "@/components/dashboard/ChurnRiskList"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"

export const Route = createFileRoute("/dashboard/$businessId")({
  beforeLoad: async ({ params }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: `/dashboard/${params.businessId}` },
      })
    }
  },
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Panel · NexoLeal" }] }),
})

function DashboardPage() {
  const { businessId } = Route.useParams()

  const business = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => businessesApi.get(businessId),
  })

  const stats = useQuery({
    queryKey: ['business', businessId, 'stats'],
    queryFn: () => businessesApi.getStatsSummary(businessId),
    refetchInterval: 30_000, // refresh every 30s
  })

  const visits = useQuery({
    queryKey: ['business', businessId, 'visits-chart'],
    queryFn: () => analyticsApi.visits(businessId, 30),
  })

  const clientsBreak = useQuery({
    queryKey: ['business', businessId, 'clients-breakdown'],
    queryFn: () => analyticsApi.clients(businessId),
  })

  const churn = useQuery({
    queryKey: ['business', businessId, 'churn-risk'],
    queryFn: () => analyticsApi.churnRisk(businessId),
  })

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardHeader businessName={business.data?.business.name} businessId={businessId} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Clientes totales" value={stats.data?.totalClients ?? '—'} />
          <Card title="Activos" value={stats.data?.activeClients ?? '—'} tone="success" />
          <Card title="En riesgo" value={stats.data?.atRiskClients ?? '—'} tone="warning" />
          <Card title="Visitas hoy" value={stats.data?.visitsToday ?? '—'} tone="brand" />
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <VisitsChart data={visits.data} isLoading={visits.isLoading} />
          <ClientsBreakdown data={clientsBreak.data} isLoading={clientsBreak.isLoading} />
        </div>

        {/* Churn risk list */}
        <div className="mt-8">
          <ChurnRiskList data={churn.data} isLoading={churn.isLoading} />
        </div>

        {/* Quick links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link to="/campaigns/$businessId" params={{ businessId }} className="card p-5 hover:shadow-md transition">
            <h3 className="font-display font-semibold">Campañas con IA</h3>
            <p className="muted-text mt-1 text-sm">Genera mensajes de reactivación.</p>
          </Link>
          <Link to="/scan" className="card p-5 hover:shadow-md transition">
            <h3 className="font-display font-semibold">Escanear QR</h3>
            <p className="muted-text mt-1 text-sm">Registra visitas desde la caja.</p>
          </Link>
          <Link to="/wallet" className="card p-5 hover:shadow-md transition">
            <h3 className="font-display font-semibold">Vista cliente</h3>
            <p className="muted-text mt-1 text-sm">Cómo lo ven tus clientes.</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
```

### 2. Create dashboard sub-components

#### `frontend/src/components/dashboard/DashboardHeader.tsx`

Top bar with logo, business name, user email, sign-out button. Use existing card/header styles from signup/onboarding.

#### `frontend/src/components/dashboard/StatCard.tsx`

```tsx
export function Card({ title, value, tone = 'default' }: {
  title: string
  value: number | string
  tone?: 'default' | 'success' | 'warning' | 'brand'
}) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    brand: 'text-[var(--primary)]',
  }[tone]

  return (
    <div className="card p-5">
      <div className="text-sm muted-text">{title}</div>
      <div className={`mt-2 font-display text-3xl font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}
```

#### `frontend/src/components/dashboard/VisitsChart.tsx`

Uses `recharts` `<LineChart>`. Props: `data: { labels: string[]; values: number[]; rollingAvg: number[]; totalVisits: number; avgPerDay: number } | undefined` + `isLoading`. Render an empty-state card when loading or no data.

```tsx
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export function VisitsChart({ data, isLoading }: { data?: any; isLoading: boolean }) {
  if (isLoading) return <div className="card p-5 h-72 animate-pulse" />
  if (!data) return <div className="card p-5 h-72 grid place-items-center text-sm muted-text">Sin datos</div>

  const chart = data.labels.map((label: string, i: number) => ({
    day: label,
    visits: data.values[i],
    avg: data.rollingAvg[i],
  }))

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display font-semibold">Visitas</h3>
        <div className="text-sm muted-text">{data.period} · {data.totalVisits} total</div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer>
          <LineChart data={chart}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="visits" stroke="var(--primary)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avg" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

#### `frontend/src/components/dashboard/ClientsBreakdown.tsx`

A horizontal stacked bar or a tiny donut showing active/at_risk/lost. Use `recharts` `<PieChart>` with three slices colored emerald / amber / rose. Show counts as a legend.

#### `frontend/src/components/dashboard/ChurnRiskList.tsx`

A table (use shadcn `<Table>`) of the top 10 at-risk clients from `analyticsApi.churnRisk`. Columns: name, days since last visit, total visits, risk score, status badge. Add a "Generar campaña" CTA at the top right that links to `/campaigns/$businessId`.

### 3. Error & empty states

- Render a friendly "Aún no tienes datos" card when `stats.data.totalClients === 0`.
- Catch `AUTH_FORBIDDEN` from any of the four queries and redirect to `/dashboard/<own-business>` (or `/login` if no business). Use `onError` in each `useQuery`.

### 4. Loading skeletons

Use `<div className="animate-pulse bg-muted/30 ..." />` patterns for KPI cards and charts. Keep heights stable to prevent layout shift.

## Files this prompt creates or modifies

- **Created**:
  - `frontend/src/routes/dashboard.$businessId.tsx`
  - `frontend/src/components/dashboard/DashboardHeader.tsx`
  - `frontend/src/components/dashboard/StatCard.tsx`
  - `frontend/src/components/dashboard/VisitsChart.tsx`
  - `frontend/src/components/dashboard/ClientsBreakdown.tsx`
  - `frontend/src/components/dashboard/ChurnRiskList.tsx`
- **Modified**: `frontend/package.json` (recharts added)

## Done when

- Logging in as a business owner and visiting `/dashboard/<your-business-id>` renders the page.
- All four queries fire to the live backend (verify in DevTools Network).
- KPI cards show real numbers from `stats.summary`.
- The visits chart renders with the last 30 days of data.
- The clients breakdown shows three counts.
- The churn-risk list shows up to 10 rows.
- `npx tsc --noEmit` passes.

## Things to avoid

- DO NOT fabricate data — if a query is `isLoading` show a skeleton; if it returns 0 show an empty state.
- DO NOT add more dependencies (recharts is the only addition).
- DO NOT call APIs in `beforeLoad` other than `supabase.auth.getSession()` — heavy data fetching belongs in `useQuery` inside the component.
- DO NOT hardcode chart colors — use CSS variables (`var(--primary)`) so theming works.
