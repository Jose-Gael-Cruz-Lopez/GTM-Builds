import { RouteError } from "@/components/RouteError";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Building2, Bot, ChevronRight, Users } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AIAssistant } from "@/components/assistant/AIAssistant";

import { businessesApi } from "@/lib/api/businesses";
import { analyticsApi } from "@/lib/api/analytics";
import { ApiError } from "@/lib/api-client";
import { requireSession } from "@/lib/auth-guards";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { useSession } from "@/hooks/use-session";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { KpiTile, KpiTileSkeleton } from "@/components/dashboard/KpiTile";
import { VisitsChart } from "@/components/dashboard/VisitsChart";
import { SegmentCards } from "@/components/dashboard/SegmentCards";
import { RetentionChart } from "@/components/dashboard/RetentionChart";
import { PeakHoursHeatmap } from "@/components/dashboard/PeakHoursHeatmap";
import { WeeklyInsightCard } from "@/components/dashboard/WeeklyInsightCard";
import { ChurnRiskList } from "@/components/dashboard/ChurnRiskList";
import { DemoPreviewBanner } from "@/components/dashboard/DemoPreviewBanner";
import {
  DEMO_CHURN,
  DEMO_CLIENTS,
  DEMO_PEAK_HOURS,
  DEMO_RETENTION,
  DEMO_REWARDS_30D,
  DEMO_STATS,
  getDemoVisits,
} from "@/lib/demo-dashboard-data";

export const Route = createFileRoute("/dashboard/$businessId")({
  beforeLoad: async ({ params, location }) => {
    await requireSession(location.pathname || `/dashboard/${params.businessId}`);
  },
  component: DashboardPage,
  errorComponent: RouteError,
  head: () => ({
    meta: [
      { title: "Panel · NexoLeal" },
      {
        name: "description",
        content: "Métricas en tiempo real de tu programa de lealtad.",
      },
    ],
  }),
});

function DashboardPage() {
  const { businessId } = Route.useParams();
  const { user } = useSession();
  const { businessName, business } = useOwnedBusiness();

  const [assistantOpen, setAssistantOpen] = useState(false);

  const ownerFirstName =
    user?.user_metadata?.full_name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "equipo";

  const stats = useQuery({
    queryKey: ["business", businessId, "stats"],
    queryFn: () => businessesApi.getStatsSummary(businessId),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });

  const visits = useQuery({
    queryKey: ["business", businessId, "visits-chart", 30],
    queryFn: () => analyticsApi.visits(businessId, 30),
    retry: shouldRetry,
  });

  const clientsBreak = useQuery({
    queryKey: ["business", businessId, "clients-breakdown"],
    queryFn: () => analyticsApi.clients(businessId),
    retry: shouldRetry,
  });

  const retention = useQuery({
    queryKey: ["business", businessId, "retention"],
    queryFn: () => analyticsApi.retention(businessId),
    retry: shouldRetry,
  });

  const peakHours = useQuery({
    queryKey: ["business", businessId, "peak-hours"],
    queryFn: () => analyticsApi.peakHours(businessId),
    retry: shouldRetry,
  });

  const churn = useQuery({
    queryKey: ["business", businessId, "churn-risk"],
    queryFn: () => analyticsApi.churnRisk(businessId),
    retry: shouldRetry,
  });

  const forbidden = [stats, visits, clientsBreak, retention, peakHours, churn].find(
    (q) => q.error instanceof ApiError && q.error.code === "AUTH_FORBIDDEN",
  );

  if (forbidden) {
    return <ForbiddenState />;
  }

  const totalClients = stats.data?.totalClients ?? 0;
  const activeClients = stats.data?.activeClients ?? 0;
  const activePct = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
  const retention60 = retention.data?.windows.find((w) => w.days === 60)?.retentionRate ?? null;
  const isEmpty = stats.data != null && stats.data.totalClients === 0;
  const showDemoPreview = isEmpty;

  const displayStats = showDemoPreview ? DEMO_STATS : stats.data;
  const displayActiveClients = displayStats?.activeClients ?? 0;
  const displayActivePct =
    displayStats && displayStats.totalClients > 0
      ? Math.round((displayActiveClients / displayStats.totalClients) * 100)
      : activePct;
  const displayRetention60 = showDemoPreview
    ? (DEMO_RETENTION.windows.find((w) => w.days === 60)?.retentionRate ?? null)
    : retention60;
  const demoVisitsSparkline = showDemoPreview ? getDemoVisits(30).values.slice(-7) : undefined;

  return (
    <DashboardShell
      businessId={businessId}
      businessName={businessName}
      plan={business?.plan ?? "free"}
      activeNav="resumen"
      ownerFirstName={ownerFirstName}
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          to="/dashboard/$businessId/sucursales"
          params={{ businessId }}
          className="surface-paper group flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-soft)]"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--color-cream)]">
            <Building2 className="h-6 w-6 text-[color:var(--color-ink)]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold">Sucursales</p>
            <p className="mt-0.5 text-xs text-[color:var(--color-ink-soft)]">
              Gestiona tus ubicaciones
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[color:var(--color-ink-soft)] transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>

        <Link
          to="/dashboard/$businessId/clients"
          params={{ businessId }}
          search={{ page: 1, limit: 20, status: "all", sort: "last_visit" }}
          className="surface-paper group flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-soft)]"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--color-cream)]">
            <Users className="h-6 w-6 text-[color:var(--color-ink)]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold">Lista de clientes</p>
            <p className="mt-0.5 text-xs text-[color:var(--color-ink-soft)]">
              Frecuencia y estado de cada cliente
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[color:var(--color-ink-soft)] transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>

        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="surface-paper group flex w-full items-center gap-4 p-5 text-left transition-shadow hover:shadow-[var(--shadow-soft)]"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--color-signal)]">
            <Bot className="h-6 w-6 text-[color:var(--color-ink)]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold">Asistente IA</p>
            <p className="mt-0.5 text-xs text-[color:var(--color-ink-soft)]">
              Resumen rápido, campañas y recomendaciones
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[color:var(--color-ink-soft)] transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </button>
      </div>

      <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 sm:max-w-2xl [&>button]:hidden"
        >
          <AIAssistant businessId={businessId} onClose={() => setAssistantOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          title="Visitas hoy"
          value={displayStats?.visitsToday ?? "—"}
          href={`/dashboard/${businessId}/visits`}
          isLoading={!showDemoPreview && stats.isLoading && stats.data === undefined}
          delta={null}
          statusTone="neutral"
        />
        <KpiTile
          title="Clientes activos"
          value={displayActiveClients}
          href={`/dashboard/${businessId}/clients?status=active`}
          isLoading={!showDemoPreview && stats.isLoading && stats.data === undefined}
          healthChip={displayActivePct >= 60}
          healthLabel="Saludable"
          statusTone="good"
        />
        {showDemoPreview ? (
          <KpiTile
            title="Recompensas (30d)"
            value={DEMO_REWARDS_30D}
            statusTone="health"
            sparklineData={demoVisitsSparkline}
          />
        ) : visits.isLoading ? (
          <KpiTileSkeleton />
        ) : (
          <KpiTile
            title="Recompensas (30d)"
            value="—"
            statusTone="health"
            sparklineData={visits.data?.values.slice(-7)}
          />
        )}
        {showDemoPreview ? (
          <KpiTile
            title="Retención (60d)"
            value={displayRetention60 != null ? `${displayRetention60}%` : "—"}
            healthChip={displayRetention60 != null && displayRetention60 >= 50}
            statusTone="good"
          />
        ) : retention.isLoading ? (
          <KpiTileSkeleton />
        ) : (
          <KpiTile
            title="Retención (60d)"
            value={displayRetention60 != null ? `${displayRetention60}%` : "—"}
            healthChip={displayRetention60 != null && displayRetention60 >= 50}
            statusTone="good"
          />
        )}
      </div>

      {showDemoPreview ? (
        <>
          <DemoPreviewBanner />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Suspense fallback={<KpiTileSkeleton />}>
                <VisitsChart businessId={businessId} getPreviewData={getDemoVisits} />
              </Suspense>
            </div>
            <div className="lg:col-span-4">
              <SegmentCards businessId={businessId} data={DEMO_CLIENTS} isLoading={false} />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <RetentionChart data={DEMO_RETENTION} isLoading={false} />
            <PeakHoursHeatmap data={DEMO_PEAK_HOURS} isLoading={false} />
          </div>

          <div className="mt-6">
            <WeeklyInsightCard
              businessId={businessId}
              peakHours={DEMO_PEAK_HOURS}
              isLoading={false}
            />
          </div>

          <div className="mt-6">
            <ChurnRiskList data={DEMO_CHURN} isLoading={false} businessId={businessId} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Suspense fallback={<KpiTileSkeleton />}>
                <VisitsChart businessId={businessId} />
              </Suspense>
            </div>
            <div className="lg:col-span-4">
              <SegmentCards
                businessId={businessId}
                data={clientsBreak.data}
                isLoading={clientsBreak.isLoading}
                isError={clientsBreak.isError}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <RetentionChart
              data={retention.data}
              isLoading={retention.isLoading}
              isError={retention.isError}
            />
            <PeakHoursHeatmap
              data={peakHours.data}
              isLoading={peakHours.isLoading}
              isError={peakHours.isError}
            />
          </div>

          <div className="mt-6">
            <WeeklyInsightCard
              businessId={businessId}
              peakHours={peakHours.data}
              isLoading={peakHours.isLoading}
            />
          </div>

          <div className="mt-6">
            <ChurnRiskList data={churn.data} isLoading={churn.isLoading} businessId={businessId} />
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (
      error.code === "AUTH_FORBIDDEN" ||
      error.code === "AUTH_REQUIRED" ||
      error.code === "NOT_FOUND"
    ) {
      return false;
    }
  }
  return failureCount < 2;
}

function ForbiddenState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-paper)] px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold">No tienes acceso a este negocio</h1>
        <p className="mt-3 text-[color:var(--color-ink-soft)]">
          Esta cuenta no es la dueña del panel que intentas abrir.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/login" className="btn-signal text-sm">
            Iniciar sesión
          </a>
          <a href="/" className="btn-secondary text-sm">
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
