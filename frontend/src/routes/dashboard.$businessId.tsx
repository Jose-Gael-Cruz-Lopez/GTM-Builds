import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { businessesApi } from "@/lib/api/businesses";
import { analyticsApi } from "@/lib/api/analytics";
import { ApiError } from "@/lib/api-client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { VisitsChart } from "@/components/dashboard/VisitsChart";
import { ClientsBreakdown } from "@/components/dashboard/ClientsBreakdown";
import { ChurnRiskList } from "@/components/dashboard/ChurnRiskList";

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
  head: () => ({ meta: [{ title: "Panel · NexoLeal" }] }),
});

function DashboardPage() {
  const { businessId } = Route.useParams();

  const business = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessesApi.get(businessId),
    retry: shouldRetry,
  });

  const stats = useQuery({
    queryKey: ["business", businessId, "stats"],
    queryFn: () => businessesApi.getStatsSummary(businessId),
    refetchInterval: 30_000,
    retry: shouldRetry,
  });

  const visits = useQuery({
    queryKey: ["business", businessId, "visits-chart"],
    queryFn: () => analyticsApi.visits(businessId, 30),
    retry: shouldRetry,
  });

  const clientsBreak = useQuery({
    queryKey: ["business", businessId, "clients-breakdown"],
    queryFn: () => analyticsApi.clients(businessId),
    retry: shouldRetry,
  });

  const churn = useQuery({
    queryKey: ["business", businessId, "churn-risk"],
    queryFn: () => analyticsApi.churnRisk(businessId),
    retry: shouldRetry,
  });

  const forbidden = [business, stats, visits, clientsBreak, churn].find(
    (q) => q.error instanceof ApiError && q.error.code === "AUTH_FORBIDDEN",
  );

  if (forbidden) {
    return <ForbiddenState />;
  }

  const campaignsHref = `/campaigns/${businessId}`;
  const isEmpty = stats.data && stats.data.totalClients === 0;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardHeader
        businessName={business.data?.business.name}
        businessId={businessId}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="badge mb-2">Panel de control</div>
            <h1 className="page-title">
              {business.data?.business.name ?? "Tu negocio"}
            </h1>
            <p className="muted-text mt-2 text-sm">
              Datos en tiempo real de tu programa de lealtad.
            </p>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card
                title="Clientes totales"
                value={stats.data?.totalClients ?? "—"}
              />
              <Card
                title="Activos"
                value={stats.data?.activeClients ?? "—"}
                tone="success"
              />
              <Card
                title="En riesgo"
                value={stats.data?.atRiskClients ?? "—"}
                tone="warning"
              />
              <Card
                title="Visitas hoy"
                value={stats.data?.visitsToday ?? "—"}
                tone="brand"
              />
            </>
          )}
        </div>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* Charts */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <VisitsChart data={visits.data} isLoading={visits.isLoading} />
              <ClientsBreakdown
                data={clientsBreak.data}
                isLoading={clientsBreak.isLoading}
              />
            </div>

            {/* Churn risk list */}
            <div className="mt-8">
              <ChurnRiskList
                data={churn.data}
                isLoading={churn.isLoading}
                campaignsHref={campaignsHref}
              />
            </div>
          </>
        )}

        {/* Quick links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <QuickLink
            href={campaignsHref}
            title="Campañas con IA"
            description="Genera mensajes de reactivación para los clientes en riesgo."
          />
          <QuickLink
            href="/scan"
            title="Escanear QR"
            description="Registra visitas desde la caja en segundos."
          />
          <QuickLink
            href="/wallet"
            title="Vista cliente"
            description="Mira tu programa de lealtad como lo ven tus clientes."
          />
        </div>
      </main>
    </div>
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

function EmptyState() {
  return (
    <div className="card mt-8 flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--primary)]">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="font-display text-xl font-semibold">
        Aún no tienes datos
      </h2>
      <p className="muted-text max-w-md text-sm">
        Comparte tu QR con tus clientes y empezarás a ver visitas y métricas
        aquí en cuanto registren su primer escaneo.
      </p>
    </div>
  );
}

function ForbiddenState() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 text-black">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">NexoLeal</span>
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="page-title">No tienes acceso a este negocio</h1>
        <p className="muted-text mt-3">
          Esta cuenta no es la dueña del panel que intentas abrir. Inicia sesión
          con la cuenta correcta o vuelve al inicio.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/login" className="btn-primary">
            Iniciar sesión
          </a>
          <a href="/" className="btn-secondary">
            Volver al inicio
          </a>
        </div>
      </main>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="card group flex flex-col gap-2 p-5 transition hover:shadow-[var(--shadow-lifted)]"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">{title}</h3>
        <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" />
      </div>
      <p className="muted-text text-sm">{description}</p>
    </a>
  );
}
