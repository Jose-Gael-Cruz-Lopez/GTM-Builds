import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { campaignsApi } from "@/lib/api/campaigns";
import { ApiError } from "@/lib/api-client";
import type { CampaignTargetSegment } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SEGMENT_OPTIONS, SEND_TIMING_OPTIONS } from "@/components/campaigns/segment-utils";

interface CampaignEditDialogProps {
  businessId: string;
  campaignId: string;
  onClose: () => void;
}

const VARIABLES = ["{name}", "{days}", "{businessName}", "{stamps}"] as const;

export function CampaignEditDialog({ businessId, campaignId, onClose }: CampaignEditDialogProps) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [targetSegment, setTargetSegment] = useState<CampaignTargetSegment>("at_risk");
  const [sendTiming, setSendTiming] = useState<string>(SEND_TIMING_OPTIONS[0].value);
  const [expectedLift, setExpectedLift] = useState("");

  const detail = useQuery({
    queryKey: ["business", businessId, "campaigns", campaignId],
    queryFn: () => campaignsApi.get(businessId, campaignId),
  });

  useEffect(() => {
    const c = detail.data?.campaign;
    if (!c) return;
    setTitle(c.title);
    setMessageTemplate(c.message_template);
    setTargetSegment(c.target_segment);
    const knownTiming = SEND_TIMING_OPTIONS.find((o) => o.value === c.send_timing);
    setSendTiming(knownTiming?.value ?? c.send_timing);
    setExpectedLift(c.expected_lift);
  }, [detail.data]);

  const save = useMutation({
    mutationFn: () =>
      campaignsApi.update(businessId, campaignId, {
        title,
        messageTemplate,
        targetSegment,
        sendTiming,
        expectedLift,
      }),
    onSuccess: () => {
      toast.success("Cambios guardados");
      qc.invalidateQueries({ queryKey: ["business", businessId, "campaigns"] });
      onClose();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-display">Editar campaña</DialogTitle>
          <DialogDescription>
            Ajusta el mensaje, el segmento y los detalles antes de enviar.
          </DialogDescription>
        </DialogHeader>

        {detail.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="campaign-title">Título</Label>
              <Input
                id="campaign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-message">Mensaje</Label>
              <Textarea
                id="campaign-message"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={6}
                required
                className="font-mono text-sm"
              />
              <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Variables disponibles:</span>{" "}
                {VARIABLES.map((v, i) => (
                  <span key={v}>
                    <code className="rounded bg-background px-1 py-0.5">{v}</code>
                    {i < VARIABLES.length - 1 ? " · " : ""}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="campaign-segment">Segmento objetivo</Label>
                <Select
                  value={targetSegment}
                  onValueChange={(v) => setTargetSegment(v as CampaignTargetSegment)}
                >
                  <SelectTrigger id="campaign-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-timing">Cuándo enviar</Label>
                <Select value={sendTiming} onValueChange={setSendTiming}>
                  <SelectTrigger id="campaign-timing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEND_TIMING_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-lift">Lift esperado</Label>
              <Input
                id="campaign-lift"
                value={expectedLift}
                onChange={(e) => setExpectedLift(e.target.value)}
                placeholder="Ej: +12% retorno"
              />
            </div>

            <p className="text-xs text-[var(--ink-soft)]">
              La programación automática llegará pronto.
            </p>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={save.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
