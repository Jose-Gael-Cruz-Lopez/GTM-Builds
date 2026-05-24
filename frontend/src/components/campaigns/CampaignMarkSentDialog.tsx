import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CampaignMarkSentDialog({
  open,
  onClose,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <MessageCircle className="h-5 w-5 text-[var(--status-good)]" />
            ¿Enviaste la campaña?
          </DialogTitle>
          <DialogDescription>
            Si ya compartiste el mensaje por WhatsApp, márcala como enviada para llevar el control
            de tus campañas.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={confirming}>
            Todavía no
          </Button>
          <Button type="button" onClick={onConfirm} disabled={confirming}>
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Marcar como enviada"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
