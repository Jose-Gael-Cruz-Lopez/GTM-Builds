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
  Send,
  RefreshCw,
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
  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState("calido");
  const [extraSpecs, setExtraSpecs] = useState("");
  const [draft, setDraft] = useState<Campaign | null>(null);

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
    mutationFn: (specs?: string) =>
      campaignsApi.generate(businessId, {
        targetSegment: segment,
        objective: objective.trim() || undefined,
        tone,
        extraSpecs: specs?.trim() || undefined,
      }),
    onSuccess: (d) => {
      const campaign = d.campaigns[0];
      if (!campaign) return;
      setDraft(campaign);
      setStep(3);
      toast.success(
        d.generatedBy === "fallback"
          ? "Campaña generada (modo sin conexión)."
          : `¡Campaña generada con IA!`,
      );
      qc.invalidateQueries({ queryKey: ["business", businessId, "campaigns"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const reset = () => {
    setStep(1);
    setSegment("at_risk");
    setObjective("");
    setTone("calido");
    setExtraSpecs("");
    setDraft(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleRefine = () => {
    setDraft(null);
    generate.mutate(extraSpecs);
    setExtraSpecs("");
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="mx-auto max-h-[80vh] max-w-2xl overflow-hidden">
        <DrawerHeader className="border-b pb-4 text-left">
          <DrawerTitle className="font-display text-2xl">Generar con IA</DrawerTitle>
          <DrawerDescription>
            {step === 3 && draft
              ? "Revisa tu campaña y decide qué hacer."
              : `Paso ${step} de 3 — Crea una campaña personalizada para tus clientes.`}
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
          {/* Step 1 — Segment */}
          {step === 1 && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ink-soft)]">
                ¿A quién quieres llegar? Elige el grupo de clientes que recibirán la campaña.
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
                        style={{ backgroundColor: `color-mix(in srgb, ${opt.accent} 20%, white)` }}
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
              <p className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)]">
                <strong>{count}</strong> cliente{count === 1 ? "" : "s"} recibirán esta campaña.
              </p>
            </div>
          )}

          {/* Step 2 — Objective + tone + extra specs */}
          {step === 2 && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ink-soft)]">
                Dile a la IA qué quieres lograr. Entre más detallado, mejor será la campaña.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="objective">¿Qué quieres lograr?</Label>
                <Textarea
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  placeholder="Ej: Que regresen clientes que no vienen hace 2 semanas con un descuento del 15%..."
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
              <div className="grid gap-2">
                <Label htmlFor="extraSpecs">Especificaciones extra (opcional)</Label>
                <Textarea
                  id="extraSpecs"
                  value={extraSpecs}
                  onChange={(e) => setExtraSpecs(e.target.value)}
                  rows={2}
                  placeholder="Ej: Menciona que tenemos nueva sucursal, incluye límite de 3 días, usa el nombre del negocio..."
                />
              </div>
            </div>
          )}

          {/* Step 3 — Generated campaign */}
          {step === 3 && (
            <div className="grid gap-4">
              {generate.isPending ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--signal)]" />
                  <p className="text-sm text-[var(--ink-soft)]">
                    La IA está creando tu campaña personalizada...
                  </p>
                </div>
              ) : draft ? (
                <>
                  <div className="relative rounded-[var(--radius-lg)] rounded-bl-sm border bg-[var(--cream)] p-5 shadow-[var(--shadow-soft)]">
                    <h4 className="font-display text-lg font-semibold text-[var(--ink)]">
                      {draft.title}
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-[var(--ink-soft)]">
                      {draft.message_template}
                    </p>
                    {draft.send_timing && (
                      <p className="mt-3 text-xs text-[var(--ink-soft)]">
                        <strong>Cuándo enviar:</strong> {draft.send_timing}
                      </p>
                    )}
                    {draft.expected_lift && (
                      <span className="mt-2 inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--health)]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink)]">
                        {draft.expected_lift}
                      </span>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                      <Button size="sm" variant="outline" onClick={() => onEdit(draft.id)}>
                        Editar texto
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          onActivate(draft);
                        }}
                      >
                        <Send className="h-3.5 w-3.5" /> Enviar a clientes
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[var(--radius)] border border-dashed border-[var(--border)] p-4">
                    <p className="text-sm font-medium text-[var(--ink)]">
                      ¿No es exactamente lo que buscabas?
                    </p>
                    <Label htmlFor="refine-specs" className="text-xs text-[var(--ink-soft)]">
                      Agrega especificaciones y la IA regenera la campaña
                    </Label>
                    <Textarea
                      id="refine-specs"
                      value={extraSpecs}
                      onChange={(e) => setExtraSpecs(e.target.value)}
                      rows={2}
                      placeholder="Ej: Quiero que mencione el descuento en el primer párrafo, con más urgencia..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!extraSpecs.trim() || generate.isPending}
                      onClick={handleRefine}
                    >
                      <RefreshCw className="h-4 w-4" /> Mejorar campaña
                    </Button>
                  </div>
                </>
              ) : null}
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
                  generate.mutate(extraSpecs || undefined);
                }}
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generar campaña
                  </>
                )}
              </Button>
            )}
            {step === 3 && !generate.isPending && (
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
