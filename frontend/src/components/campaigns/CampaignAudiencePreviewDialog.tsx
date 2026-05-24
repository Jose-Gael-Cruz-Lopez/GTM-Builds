import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Campaign } from "@/lib/api/campaigns";
import { analyticsApi } from "@/lib/api/analytics";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  filterAudienceBySegment,
  getSegmentCount,
  initials,
} from "@/components/campaigns/segment-utils";

export function CampaignAudiencePreviewDialog({
  businessId,
  campaign,
  open,
  onClose,
  onConfirm,
  confirming,
}: {
  businessId: string;
  campaign: Campaign;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  const clients = useQuery({
    queryKey: ["business", businessId, "analytics", "clients"],
    queryFn: () => analyticsApi.clients(businessId),
    enabled: open,
  });
  const churn = useQuery({
    queryKey: ["business", businessId, "analytics", "churn-risk"],
    queryFn: () => analyticsApi.churnRisk(businessId),
    enabled: open,
  });

  const count = getSegmentCount(campaign.target_segment, clients.data, churn.data);
  const preview = filterAudienceBySegment(campaign.target_segment, churn.data?.clients ?? []).slice(
    0,
    5,
  );

  const loading = clients.isLoading || churn.isLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display">Vista previa de audiencia</DialogTitle>
          <DialogDescription>
            {loading ? (
              "Calculando audiencia..."
            ) : (
              <>
                Esta campaña se enviará a{" "}
                <strong>
                  {count} cliente{count === 1 ? "" : "s"}
                </strong>
                .{preview.length > 0 && " Estos son los primeros 5:"}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--ink-soft)]" />
          </div>
        ) : preview.length > 0 ? (
          <ul className="grid gap-2">
            {preview.map((client) => (
              <li
                key={client.clientId}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border bg-[var(--surface-soft)] px-3 py-2"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[var(--cream)] text-xs font-medium text-[var(--ink)]">
                    {initials(client.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[var(--ink)]">{client.fullName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">
            No hay clientes en este segmento todavía. Puedes activar la campaña y enviarla cuando
            tengas audiencia.
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={confirming}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={confirming}>
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Activando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
