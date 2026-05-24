import { RouteError } from "@/components/RouteError";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { supabase } from "@/integrations/supabase/client";
import { businessesApi } from "@/lib/api/businesses";
import { analyticsApi } from "@/lib/api/analytics";
import { ApiError } from "@/lib/api-client";
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
import { AnalyticsEmptyState } from "@/components/dashboard/AnalyticsEmptyState";

export const Route = createFileRoute("/dashboard/$businessId")({
  beforeLoad: async ({ params }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        href: `/login?redirect=${encodeURIComponent(`/dashboard/${params.businessId}`)}`,
      });
    }
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

  const ownerFirstName =
    user?.user_metadata?.full_name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "equipo";

  const stats = useQuery({
    queryKey: ["business", businessId, "stats"],
    queryFn: () => businessesApi.getStatsSummary(businessId),
    refetchInterval: 30_000,
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
  const isEmpty = stats.data && stats.data.totalClients === 0;

  return (
    <DashboardShell
      businessId={businessId}
      businessName={businessName}
      plan={business?.plan ?? "free"}
      activeNav="resumen"
      ownerFirstName={ownerFirstName}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.isLoading ? (
          <>
            <KpiTileSkeleton />
            <KpiTileSkeleton />
            <KpiTileSkeleton />
            <KpiTileSkeleton />
          </>
        ) : (
          <>
            <KpiTile
              title="Visitas hoy"
              value={stats.data?.visitsToday ?? "—"}
              href={`/dashboard/${businessId}/visits`}
              delta={null}
              statusTone="neutral"
            />
            <KpiTile
              title="Clientes activos"
              value={activeClients}
              href={`/dashboard/${businessId}/clients?status=active`}
              healthChip={activePct >= 60}
              healthLabel="Saludable"
              statusTone="good"
            />
            <KpiTile
              title="Recompensas (30d)"
              value="—"
              statusTone="health"
              sparklineData={visits.data?.values.slice(-7)}
            />
            <KpiTile
              title="Retención (60d)"
              value={retention60 != null ? `${retention60}%` : "—"}
              healthChip={retention60 != null && retention60 >= 50}
              statusTone="good"
            />
          </>
        )}
      </div>

      {isEmpty ? (
        <AnalyticsEmptyState
          className="mt-8"
          title="Aún no tienes datos"
          description="Comparte tu QR con tus clientes y empezarás a ver visitas y métricas aquí en cuanto registren su primer escaneo."
        />
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
