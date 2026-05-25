import { RouteError } from "@/components/RouteError";
import { createFileRoute } from "@tanstack/react-router";

import { requireSession } from "@/lib/auth-guards";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { useSession } from "@/hooks/use-session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IsoScene } from "@/components/ui/iso-scene";

export const Route = createFileRoute("/dashboard/$businessId/sucursales")({
  beforeLoad: async ({ params, location }) => {
    await requireSession(
      location.pathname || `/dashboard/${params.businessId}/sucursales`,
    );
  },
  component: SucursalesPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Sucursales · NexoLeal" }] }),
});

function SucursalesPage() {
  const { businessId } = Route.useParams();
  const { businessName, business } = useOwnedBusiness();
  const { user } = useSession();

  const ownerFirstName =
    user?.user_metadata?.full_name?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "equipo";

  return (
    <DashboardShell
      businessId={businessId}
      businessName={businessName}
      plan={business?.plan ?? "free"}
      activeNav="sucursales"
      ownerFirstName={ownerFirstName}
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Sucursales</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Gestiona las ubicaciones de tu negocio.
        </p>
      </div>

      <IsoScene
        title="Próximamente"
        description="Aquí podrás dar de alta, editar y desactivar las sucursales de tu negocio. Esta sección está en desarrollo."
        action={
          <a href={`/dashboard/${businessId}`} className="btn-signal text-sm">
            Volver al panel
          </a>
        }
      />
    </DashboardShell>
  );
}
