import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  UserMinus,
  Users,
  Zap,
} from "lucide-react";
import type { CampaignTargetSegment } from "@/integrations/supabase/types";
import { campaignsApi, type Campaign } from "@/lib/api/campaigns";
import { analyticsApi } from "@/lib/api/analytics";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getSegmentCount,
  SEGMENT_OPTIONS,
  TONE_OPTIONS,
} from "@/components/campaigns/segment-utils";
import { cn } from "@/lib/utils";

const SEGMENT_ICONS = {
  at_risk: AlertTriangle,
  lost: UserMinus,
  all: Users,
  frequent: Zap,
} as const;

type Step = 1 | 2 | 3;

export function CampaignGenerationSheet({
  businessId,
  open,
  onOpenChange,
  onEdit,
  onActivate,
}: {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (campaignId: string) => void;
  onActivate: (campaign: Campaign) => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [segment, setSegment] = useState<CampaignTargetSegment>("at_risk");
  const [customSegment, setCustomSegment] = useState("");
  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState("calido");
  const [drafts, setDrafts] = useState<Campaign[]>([]);

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

  const count = getSegmentCount(segment, clients.data, churn.data);

  const generate = useMutation({
    mutationFn: () =>
      campaignsApi.generate(businessId, {
        targetSegment: segment,
        objective: objective.trim() || customSegment.trim() || undefined,
        tone,
      }),
    onSuccess: (d) => {
      setDrafts(d.campaigns);
      setStep(3);
      toast.success(
        d.generatedBy === "fallback"
          ? "Generamos 3 plantillas. (IA no disponible — usamos fallback)"
          : `¡3 campañas generadas con ${d.model}!`,
      );
      qc.invalidateQueries({ queryKey: ["business", businessId, "campaigns"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const reset = () => {
    setStep(1);
    setSegment("at_risk");
    setCustomSegment("");
    setObjective("");
    setTone("calido");
    setDrafts([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="mx-auto max-h-[70vh] max-w-2xl overflow-hidden">
        <DrawerHeader className="border-b pb-4 text-left">
          <DrawerTitle className="font-display text-2xl">Generar con IA</DrawerTitle>
          <DrawerDescription>
            Hola — vamos a crear mensajes que reconecten con tus clientes. Paso {step} de 3.
          </DrawerDescription>
          <div className="mt-3 flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-[var(--signal)]" : "bg-[var(--surface-soft)]",
                )}
              />
            ))}
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {step === 1 && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ink-soft)]">
                ¿A quién quieres llegar? Elige un segmento ilustrado o describe uno personalizado.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {SEGMENT_OPTIONS.map((opt) => {
                  const Icon = SEGMENT_ICONS[opt.value];
                  const selected = segment === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSegment(opt.value)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-[var(--radius)] border p-4 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] focus-visible:ring-offset-2",
                        selected
                          ? "border-[var(--ink)] bg-[var(--cream)] shadow-[var(--shadow-soft)]"
                          : "border-[var(--border)] bg-white hover:border-[var(--ink-soft)]",
                      )}
                    >
                      <span
                        className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)]"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${opt.accent} 20%, white)`,
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: opt.accent }} />
                      </span>
                      <span className="font-display font-semibold text-[var(--ink)]">
                        {opt.label}
                      </span>
                      <span className="text-xs text-[var(--ink-soft)]">{opt.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="custom-segment">Segmento personalizado (opcional)</Label>
                <Input
                  id="custom-segment"
                  value={customSegment}
                  onChange={(e) => setCustomSegment(e.target.value)}
                  placeholder="Ej: clientes que cumplen años esta semana"
                />
              </div>

              <p className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)]">
                <strong>{count}</strong> cliente{count === 1 ? "" : "s"}{" "}
                {SEGMENT_OPTIONS.find((o) => o.value === segment)?.label.toLowerCase()} recibirán
                esta campaña.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="objective">Objetivo de la campaña</Label>
                <Textarea
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={4}
                  placeholder="Queremos que regresen esta semana..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tone">Tono del mensaje</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              {generate.isPending ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--signal)]" />
                  <p className="text-sm text-[var(--ink-soft)]">
                    Redactando 3 borradores para tu segmento...
                  </p>
                </div>
              ) : drafts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--ink-soft)]">
                    Pulsa generar para crear tus borradores.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => generate.mutate()}
                    disabled={generate.isPending}
                  >
                    <Sparkles className="h-4 w-4" /> Generar borradores
                  </Button>
                </div>
              ) : (
                drafts.map((draft, i) => (
                  <div
                    key={draft.id}
                    className="relative rounded-[var(--radius-lg)] rounded-bl-sm border bg-[var(--cream)] p-4 shadow-[var(--shadow-soft)]"
                  >
                    <span className="absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--signal)] text-[10px] font-bold text-[var(--ink)]">
                      {i + 1}
                    </span>
                    <h4 className="font-display font-semibold text-[var(--ink)]">{draft.title}</h4>
                    <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--ink-soft)]">
                      {draft.message_template}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(draft.id)}>
                        Editar
                      </Button>
                      <Button size="sm" onClick={() => onActivate(draft)}>
                        Activar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t pt-4">
          <div className="flex w-full gap-2">
            {step > 1 && step < 3 && (
              <Button type="button" variant="outline" onClick={() => setStep((step - 1) as Step)}>
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
            )}
            {step === 1 && (
              <Button type="button" className="ml-auto" onClick={() => setStep(2)}>
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                className="ml-auto"
                onClick={() => {
                  setStep(3);
                  generate.mutate();
                }}
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generar borradores
                  </>
                )}
              </Button>
            )}
            {step === 3 && (
              <Button
                type="button"
                variant="ghost"
                className="ml-auto"
                onClick={() => handleOpenChange(false)}
              >
                Cerrar
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
