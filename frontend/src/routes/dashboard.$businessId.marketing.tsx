import { RouteError } from "@/components/RouteError";
import { createFileRoute } from "@tanstack/react-router";

import { requireSession } from "@/lib/auth-guards";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { useSession } from "@/hooks/use-session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IsoScene } from "@/components/ui/iso-scene";

export const Route = createFileRoute("/dashboard/$businessId/marketing")({
  beforeLoad: async ({ params, location }) => {
    await requireSession(location.pathname || `/dashboard/${params.businessId}/marketing`);
  },
  component: MarketingPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Marketing · NexoLeal" }] }),
});

function MarketingPage() {
  const { businessId } = Route.useParams();
  const { businessName, business } = useOwnedBusiness();
  const { user } = useSession();

  const ownerFirstName =
    user?.user_metadata?.full_name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "equipo";

  return (
    <DashboardShell
      businessId={businessId}
      businessName={businessName}
      plan={business?.plan ?? "free"}
      activeNav="marketing"
      ownerFirstName={ownerFirstName}
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Marketing</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Herramientas para atraer y retener clientes.
        </p>
      </div>

      <IsoScene
        title="Próximamente"
        description="Aquí encontrarás herramientas de marketing como referidos, campañas automáticas y segmentación de clientes. Esta sección está en desarrollo."
        action={
          <a href={`/dashboard/${businessId}`} className="btn-signal text-sm">
            Volver al panel
          </a>
        }
      />
    </DashboardShell>
  );
}
