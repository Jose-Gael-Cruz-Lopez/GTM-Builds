import { RouteError } from "@/components/RouteError";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";

import { requireSession } from "@/lib/auth-guards";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { useSession } from "@/hooks/use-session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/$businessId/sucursales")({
  beforeLoad: async ({ params, location }) => {
    await requireSession(location.pathname || `/dashboard/${params.businessId}/sucursales`);
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
    user?.user_metadata?.full_name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "equipo";

  const defaultBranchName = businessName?.trim() || "Tu negocio";

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

      <div className="surface-paper overflow-hidden">
        <div className="border-b border-[color:var(--color-border)] px-5 py-4">
          <p className="text-sm text-[color:var(--color-ink-soft)]">
            Tu negocio comienza con una sucursal principal. Podrás agregar más ubicaciones pronto.
          </p>
        </div>
        <ul className="divide-y divide-[color:var(--color-border)]" aria-label="Sucursales">
          <li className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-cream)]">
              <Building2 className="h-5 w-5 text-[color:var(--color-ink)]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display font-semibold">{defaultBranchName}</p>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  Principal
                </Badge>
                <Badge className="bg-[var(--color-signal)] text-[10px] uppercase tracking-wide text-[color:var(--color-ink)]">
                  Activa
                </Badge>
              </div>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-ink-soft)]">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Sucursal principal del negocio
              </p>
            </div>
          </li>
        </ul>
      </div>
    </DashboardShell>
  );
}
