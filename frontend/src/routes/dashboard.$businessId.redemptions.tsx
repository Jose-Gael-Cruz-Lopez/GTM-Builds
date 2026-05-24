import { RouteError } from "@/components/RouteError";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { businessesApi } from "@/lib/api/businesses";
import { ApiError } from "@/lib/api-client";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { useSession } from "@/hooks/use-session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IsoScene } from "@/components/ui/iso-scene";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  pendingOnly: z.coerce.boolean().optional().default(false),
});

export const Route = createFileRoute("/dashboard/$businessId/redemptions")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ params }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        href: `/login?redirect=${encodeURIComponent(`/dashboard/${params.businessId}/redemptions`)}`,
      });
    }
  },
  component: RedemptionsPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Recompensas · NexoLeal" }] }),
});

function RedemptionsPage() {
  const { businessId } = Route.useParams();
  const search = Route.useSearch();
  const { businessName, business } = useOwnedBusiness();
  const { user } = useSession();
  const qc = useQueryClient();
  const [pendingOnly, setPendingOnly] = useState(search.pendingOnly);

  const ownerFirstName =
    user?.user_metadata?.full_name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "equipo";

  const list = useQuery({
    queryKey: ["business", businessId, "rewards", pendingOnly],
    queryFn: () =>
      businessesApi.listRewards(businessId, {
        redeemed: pendingOnly ? false : undefined,
        limit: 50,
      }),
    retry: false,
  });

  const redeem = useMutation({
    mutationFn: (rewardId: string) => businessesApi.redeemReward(businessId, rewardId),
    onSuccess: () => {
      toast.success("Recompensa marcada como entregada");
      void qc.invalidateQueries({ queryKey: ["business", businessId, "rewards"] });
    },
    onError: (e: ApiError | Error) => {
      toast.error(e instanceof ApiError ? e.message : "No pudimos actualizar la recompensa");
    },
  });

  const rows = list.data?.rewards ?? [];
  const unavailable = list.error instanceof ApiError && list.error.status >= 500;

  return (
    <DashboardShell
      businessId={businessId}
      businessName={businessName}
      plan={business?.plan ?? "free"}
      activeNav="recompensas"
      ownerFirstName={ownerFirstName}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Recompensas</h2>
          <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            Recompensas desbloqueadas por tus clientes al completar sellos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="pending-only" checked={pendingOnly} onCheckedChange={setPendingOnly} />
          <Label htmlFor="pending-only" className="text-sm">
            Solo pendientes de entregar
          </Label>
        </div>
      </div>

      {list.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-ink-soft)]" />
        </div>
      ) : list.error && unavailable ? (
        <IsoScene
          title="Función en preparación"
          description="No pudimos cargar las recompensas. Intenta de nuevo en unos minutos."
        >
          <Gift className="mx-auto h-10 w-10 text-[color:var(--color-ink-soft)]" aria-hidden />
        </IsoScene>
      ) : rows.length === 0 ? (
        <IsoScene
          title="Aún no hay recompensas"
          description="Cuando un cliente complete sus sellos, la recompensa aparecerá aquí para que la entregues en caja."
        >
          <Gift className="mx-auto h-10 w-10 text-[color:var(--color-ink-soft)]" aria-hidden />
        </IsoScene>
      ) : (
        <div className="surface-paper overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Desbloqueada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.clientName}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>
                    <span title={format(new Date(row.createdAt), "PPpp", { locale: es })}>
                      {formatDistanceToNow(new Date(row.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.redeemed ? (
                      <Badge variant="secondary">Entregada</Badge>
                    ) : (
                      <Badge className="bg-[var(--color-signal)] text-[color:var(--color-ink)]">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!row.redeemed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={redeem.isPending}
                        onClick={() => redeem.mutate(row.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Marcar entregada
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardShell>
  );
}
