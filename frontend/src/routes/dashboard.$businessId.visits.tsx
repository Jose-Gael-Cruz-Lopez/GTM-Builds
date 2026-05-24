import { RouteError } from "@/components/RouteError";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { adminApi, isAdminRouteUnavailable, type AdminVisitRow } from "@/lib/admin-api";
import { requireSession } from "@/lib/auth-guards";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { useSession } from "@/hooks/use-session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IsoScene } from "@/components/ui/iso-scene";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  rewardsOnly: z.coerce.boolean().optional().default(false),
});

export const Route = createFileRoute("/dashboard/$businessId/visits")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ params, location }) => {
    await requireSession(location.pathname || `/dashboard/${params.businessId}/visits`);
  },
  component: VisitsPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Visitas · NexoLeal" }] }),
});

function VisitsPage() {
  const { businessId } = Route.useParams();
  const search = Route.useSearch();
  const { businessName, business } = useOwnedBusiness();
  const { user } = useSession();
  const qc = useQueryClient();
  const [rewardsOnly, setRewardsOnly] = useState(search.rewardsOnly);

  const ownerFirstName =
    user?.user_metadata?.full_name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "equipo";

  const list = useQuery({
    queryKey: ["business", businessId, "visits-feed", search.from, search.to],
    queryFn: () =>
      adminApi.listVisits({
        businessId,
        from: search.from,
        to: search.to,
        limit: 50,
      }),
    retry: false,
  });

  const unavailable = list.error && isAdminRouteUnavailable(list.error);

  useEffect(() => {
    const channel = supabase
      .channel(`visits:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["business", businessId, "visits-feed"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId, qc]);

  const rows = (list.data?.visits ?? []).filter((v) => (rewardsOnly ? v.reward_unlocked : true));

  return (
    <DashboardShell
      businessId={businessId}
      businessName={businessName}
      plan={business?.plan ?? "free"}
      activeNav="visitas"
      ownerFirstName={ownerFirstName}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Visitas</h2>
          <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            Feed en tiempo real de escaneos en caja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="rewards-only" checked={rewardsOnly} onCheckedChange={setRewardsOnly} />
          <Label htmlFor="rewards-only" className="text-sm">
            Solo recompensas
          </Label>
        </div>
      </div>

      {unavailable ? (
        <IsoScene
          title="Función en preparación"
          description="Estamos terminando esta vista. Mientras tanto, ve los datos resumidos en el panel principal."
          action={
            <a href={`/dashboard/${businessId}`} className="btn-signal text-sm">
              Ir al panel
            </a>
          }
        />
      ) : list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 shimmer rounded-[var(--radius)]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <IsoScene
          title="Aún no se registran visitas en este rango"
          description="Cuando tu staff escanee códigos QR, las visitas aparecerán aquí al instante."
        />
      ) : (
        <div className="surface-paper overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sellos</TableHead>
                <TableHead>Recompensa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((visit) => (
                <VisitRow key={visit.id} visit={visit} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardShell>
  );
}

function VisitRow({ visit }: { visit: AdminVisitRow }) {
  const ts = format(new Date(visit.created_at), "d MMM yyyy · HH:mm", { locale: es });
  const stamps =
    visit.stamps_before != null && visit.stamps_after != null
      ? `${visit.stamps_before} → ${visit.stamps_after}`
      : "—";

  return (
    <TableRow>
      <TableCell className="text-sm tabular-nums">{ts}</TableCell>
      <TableCell className="font-mono text-xs">{visit.client_id.slice(0, 8)}…</TableCell>
      <TableCell className="tabular-nums">{stamps}</TableCell>
      <TableCell>
        {visit.reward_unlocked ? (
          <Badge
            variant="outline"
            className="border-[color:var(--color-celebrate)] text-[color:var(--color-celebrate)]"
          >
            Desbloqueada
          </Badge>
        ) : (
          <span className="text-[color:var(--color-ink-soft)]">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
