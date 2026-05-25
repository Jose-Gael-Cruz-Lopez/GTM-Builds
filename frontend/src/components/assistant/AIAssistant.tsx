import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  Bot,
  Sparkles,
  TrendingUp,
  Users,
  UserPlus,
  BarChart3,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { assistantApi } from "@/lib/api/assistant";
import type { AnalyzeResponse } from "@/lib/api/assistant";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  from: "ai" | "user";
  content: string;
  actions?: ActionBtn[];
  isLoading?: boolean;
}

interface ActionBtn {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline";
  onClick: () => void;
}

type Step =
  | "welcome"
  | "analyzing"
  | "summary"
  | "lost-discount"
  | "lost-duration"
  | "frequent-visits"
  | "frequent-discount"
  | "frequent-duration"
  | "new-discount"
  | "new-duration"
  | "creating-campaign"
  | "campaign-done"
  | "service-analysis"
  | "loyalty-visits"
  | "loyalty-done";

let msgId = 0;
const nextId = () => String(++msgId);

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAssistant({ businessId }: { businessId: string }) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      from: "ai",
      content:
        "¡Hola! Soy tu asistente de negocio con IA. Puedo analizar tus visitas recientes y ayudarte a tomar acciones concretas para retener y ganar clientes. ¿Qué quieres hacer?",
      actions: [
        {
          label: "Resumen rápido",
          icon: <BarChart3 className="h-3.5 w-3.5" />,
          onClick: () => handleAnalyze(),
        },
        {
          label: "Análisis de actividad",
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          variant: "outline",
          onClick: () => handleServiceAnalysisRequest(),
        },
      ],
    },
  ]);

  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [activeSegment, setActiveSegment] = useState<"lost" | "frequent" | "new" | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [customDiscountInput, setCustomDiscountInput] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDurationInput, setCustomDurationInput] = useState("");
  const [customVisitsInput, setCustomVisitsInput] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function addMsg(msg: Omit<Message, "id">) {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  }

  function userSays(content: string) {
    addMsg({ from: "user", content });
  }

  function aiSays(content: string, actions?: ActionBtn[]) {
    addMsg({ from: "ai", content, actions });
  }

  function disableLastActions() {
    setMessages((prev) => {
      const copy = [...prev];
      const lastAi = [...copy].reverse().find((m) => m.from === "ai" && m.actions);
      if (lastAi) lastAi.actions = undefined;
      return copy;
    });
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  const analyzeMutation = useMutation({
    mutationFn: () => assistantApi.analyze(businessId),
    onSuccess: (data) => {
      setAnalysisData(data);
      setStep("summary");

      const { segments, periodDays, visitCount, insights } = data;
      const summary =
        `En los últimos **${periodDays} días** analicé **${visitCount} visitas**:\n\n` +
        `• **${segments.newClients}** clientes nuevos\n` +
        `• **${segments.frequentClients}** clientes frecuentes (4+ visitas)\n` +
        `• **${segments.lostClients}** clientes que ya no regresan\n` +
        `• **${segments.atRiskClients}** clientes en riesgo de perderse\n\n` +
        `${insights.segmentAnalysis.frequentInsight}\n\n¿Qué quieres hacer?`;

      aiSays(summary, [
        {
          label: "Campaña para perdidos",
          icon: <Users className="h-3.5 w-3.5" />,
          onClick: () => handleCampaignFlow("lost"),
        },
        {
          label: "Premio a frecuentes",
          icon: <Sparkles className="h-3.5 w-3.5" />,
          variant: "outline",
          onClick: () => handleCampaignFlow("frequent"),
        },
        {
          label: "Incentivo para nuevos",
          icon: <UserPlus className="h-3.5 w-3.5" />,
          variant: "outline",
          onClick: () => handleCampaignFlow("new"),
        },
        {
          label: "Ver análisis de actividad",
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          variant: "outline",
          onClick: () => handleServiceAnalysis(),
        },
      ]);
    },
    onError: () => {
      toast.error("No se pudo conectar con el asistente. Intenta de nuevo.");
      setStep("welcome");
      setMessages((prev) => prev.filter((m) => !m.isLoading));
    },
  });

  const campaignMutation = useMutation({
    mutationFn: (vars: { segment: "lost" | "frequent" | "new"; discountPct: number; durationDays: number }) =>
      assistantApi.createCampaign(businessId, vars),
    onSuccess: (data) => {
      setStep("campaign-done");
      aiSays(
        `¡Campaña creada con éxito! 🎉\n\n` +
          `**"${data.campaign.title}"**\n\n` +
          `Llegará a **${data.targetAudience} clientes** con un **${data.discountPct}% de descuento** por **${data.durationDays} días**.\n\n` +
          `El mensaje quedó guardado como borrador. Puedes activarlo desde Campañas cuando quieras.`,
        [
          {
            label: "Ver campañas",
            icon: <Check className="h-3.5 w-3.5" />,
            onClick: () =>
              navigate({ to: "/campaigns/$businessId", params: { businessId } }),
          },
          {
            label: "Hacer otro análisis",
            variant: "outline",
            onClick: () => handleReset(),
          },
        ]
      );
    },
    onError: () => {
      toast.error("No se pudo crear la campaña. Intenta de nuevo.");
      setStep("summary");
    },
  });

  const loyaltyMutation = useMutation({
    mutationFn: (vars: { visitsRequired: number }) =>
      assistantApi.updateLoyalty(businessId, {
        visitsRequired: vars.visitsRequired,
        rewardDescription: `Recompensa especial por ${vars.visitsRequired} visitas`,
      }),
    onSuccess: (data) => {
      setStep("loyalty-done");
      aiSays(
        `¡Listo! Ahora tus clientes recibirán una recompensa después de **${data.loyaltyConfig.stamps_required} visitas**. 🏆\n\nEsto aplica para todos los clientes de tu negocio automáticamente.`,
        [
          {
            label: "Hacer otro análisis",
            onClick: () => handleReset(),
          },
          {
            label: "Volver al panel",
            variant: "outline",
            onClick: () =>
              navigate({ to: "/dashboard/$businessId", params: { businessId } }),
          },
        ]
      );
    },
    onError: () => {
      toast.error("No se pudo actualizar la configuración. Intenta de nuevo.");
    },
  });

  // ─── Flow handlers ────────────────────────────────────────────────────────

  function handleAnalyze() {
    disableLastActions();
    userSays("Resumen rápido");
    addMsg({ from: "ai", content: "Analizando los datos de tu negocio con IA...", isLoading: true });
    setStep("analyzing");
    analyzeMutation.mutate();
  }

  function handleServiceAnalysisRequest() {
    disableLastActions();
    userSays("Análisis de actividad");
    if (analysisData) {
      handleServiceAnalysis();
    } else {
      addMsg({ from: "ai", content: "Primero necesito analizar tus datos...", isLoading: true });
      setStep("analyzing");
      analyzeMutation.mutate();
    }
  }

  function handleServiceAnalysis() {
    if (!analysisData) return;
    const { insights, peakDay, slowDay, peakHour, slowHour } = analysisData;
    const { serviceAnalysis } = insights;

    setStep("service-analysis");
    aiSays(
      `**Análisis de tu actividad:**\n\n` +
        `**Horarios activos:** ${peakDay} a las ${peakHour}\n` +
        `**Horarios tranquilos:** ${slowDay} a las ${slowHour}\n\n` +
        `**Períodos de baja actividad:**\n${serviceAnalysis.slowPeriods.map((p) => `• ${p}`).join("\n")}\n\n` +
        `**¿Por qué está tranquilo?**\n${serviceAnalysis.lowPerformanceReasons.map((r) => `• ${r}`).join("\n")}\n\n` +
        `**Predicciones si actúas:**\n${serviceAnalysis.predictions.map((p) => `• ${p}`).join("\n")}\n\n` +
        `**Recomendación:** ${insights.recommendations.forLost}`,
      [
        {
          label: "Crear campaña para los días tranquilos",
          icon: <Sparkles className="h-3.5 w-3.5" />,
          onClick: () => handleCampaignFlow("lost"),
        },
        {
          label: "Ver resumen de clientes",
          variant: "outline",
          onClick: () => handleReset(),
        },
      ]
    );
  }

  function handleCampaignFlow(segment: "lost" | "frequent" | "new") {
    disableLastActions();
    setActiveSegment(segment);

    if (segment === "lost") {
      userSays("Campaña para clientes perdidos");
      const rec = analysisData?.insights.recommendations;
      aiSays(
        `Perfecto. Tengo **${analysisData?.segments.lostClients ?? "varios"} clientes** que ya no regresan.\n\n` +
          `${rec?.forLost ?? "Un descuento personalizado puede traerlos de vuelta."}\n\n` +
          `¿Con cuánto descuento quieres invitarlos a volver?`,
        buildDiscountActions(rec?.suggestedDiscountLost ?? 15, () => setStep("lost-discount"))
      );
      setStep("lost-discount");
    } else if (segment === "frequent") {
      userSays("Premio a clientes frecuentes");
      const rec = analysisData?.insights.recommendations;
      aiSays(
        `Tienes **${analysisData?.segments.frequentClients ?? "varios"} clientes frecuentes** que merecen reconocimiento. 🏆\n\n` +
          `${rec?.forFrequent ?? "Un programa de recompensas los fidelizará aún más."}\n\n` +
          `¿Cuántas visitas se necesitan para recibir la recompensa?`,
        buildVisitsActions(rec?.suggestedVisitsForReward ?? 5)
      );
      setStep("frequent-visits");
    } else {
      userSays("Incentivo para nuevos clientes");
      const rec = analysisData?.insights.recommendations;
      aiSays(
        `Tienes **${analysisData?.segments.newClients ?? "varios"} clientes nuevos** explorando tu negocio. 🌟\n\n` +
          `${rec?.forNew ?? "Un incentivo en la segunda visita los convierte en regulares."}\n\n` +
          `¿Qué descuento quieres ofrecerles para que vuelvan?`,
        buildDiscountActions(rec?.suggestedDiscountNew ?? 10, () => setStep("new-discount"))
      );
      setStep("new-discount");
    }
  }

  function buildDiscountActions(suggested: number, _onMount?: () => void): ActionBtn[] {
    const options = [10, 15, 20].filter((v) => v !== suggested);
    const btns: ActionBtn[] = [
      {
        label: `${suggested}% (recomendado)`,
        onClick: () => selectDiscount(suggested),
      },
      ...options.map((v) => ({
        label: `${v}%`,
        variant: "outline" as const,
        onClick: () => selectDiscount(v),
      })),
      {
        label: "Personalizado",
        variant: "outline" as const,
        onClick: () => promptCustomDiscount(),
      },
    ];
    return btns;
  }

  function buildVisitsActions(suggested: number): ActionBtn[] {
    const options = [3, 5, 7, 10].filter((v) => v !== suggested);
    return [
      {
        label: `${suggested} visitas (recomendado)`,
        onClick: () => selectVisits(suggested),
      },
      ...options.slice(0, 2).map((v) => ({
        label: `${v} visitas`,
        variant: "outline" as const,
        onClick: () => selectVisits(v),
      })),
      {
        label: "Personalizado",
        variant: "outline" as const,
        onClick: () => promptCustomVisits(),
      },
    ];
  }

  function buildDurationActions(segment: "lost" | "frequent" | "new"): ActionBtn[] {
    return [
      { label: "7 días", variant: "outline", onClick: () => selectDuration(7, segment) },
      { label: "14 días (recomendado)", onClick: () => selectDuration(14, segment) },
      { label: "30 días", variant: "outline", onClick: () => selectDuration(30, segment) },
      { label: "Personalizado", variant: "outline", onClick: () => promptCustomDuration(segment) },
    ];
  }

  function selectDiscount(value: number) {
    disableLastActions();
    setSelectedDiscount(value);
    userSays(`${value}%`);
    const seg = activeSegment ?? "lost";
    aiSays(`¡Perfecto! **${value}% de descuento**. ¿Por cuánto tiempo tendrá vigencia?`, buildDurationActions(seg));
    setStep(seg === "lost" ? "lost-duration" : "new-duration");
  }

  function promptCustomDiscount() {
    disableLastActions();
    aiSays("Escribe el porcentaje de descuento que quieres ofrecer (entre 1 y 80):");
    setCustomDiscountInput("");
    setStep(activeSegment === "new" ? "new-discount" : "lost-discount");
  }

  function submitCustomDiscount() {
    const val = parseInt(customDiscountInput, 10);
    if (!val || val < 1 || val > 80) {
      toast.error("Ingresa un número entre 1 y 80.");
      return;
    }
    selectDiscount(val);
    setCustomDiscountInput("");
  }

  function selectDuration(days: number, seg: "lost" | "frequent" | "new") {
    disableLastActions();
    setSelectedDuration(days);
    const label = days === 7 ? "1 semana" : days === 14 ? "2 semanas" : days === 30 ? "1 mes" : `${days} días`;
    userSays(label);
    const disc = selectedDiscount ?? 15;
    const clientCount =
      seg === "lost"
        ? (analysisData?.segments.lostClients ?? 0)
        : seg === "frequent"
          ? (analysisData?.segments.frequentClients ?? 0)
          : (analysisData?.segments.newClients ?? 0);
    aiSays(
      `Creando la campaña para **${clientCount} clientes** con **${disc}% de descuento** por **${days} días**...`,
      undefined
    );
    setStep("creating-campaign");
    campaignMutation.mutate({ segment: seg, discountPct: disc, durationDays: days });
  }

  function promptCustomDuration(seg: "lost" | "frequent" | "new") {
    disableLastActions();
    aiSays("Escribe el número de días de vigencia (entre 1 y 90):");
    setCustomDurationInput("");
    setStep(seg === "lost" ? "lost-duration" : "new-duration");
  }

  function submitCustomDuration() {
    const val = parseInt(customDurationInput, 10);
    if (!val || val < 1 || val > 90) {
      toast.error("Ingresa un número entre 1 y 90.");
      return;
    }
    const seg = activeSegment ?? "lost";
    selectDuration(val, seg);
    setCustomDurationInput("");
  }

  function selectVisits(n: number) {
    disableLastActions();
    userSays(`${n} visitas`);
    const disc = analysisData?.insights.recommendations.suggestedDiscountFrequent ?? 10;
    aiSays(
      `Excelente. Después de **${n} visitas**, tus clientes recibirán una recompensa. ¿También quieres enviarles un mensaje con un descuento especial?`,
      [
        {
          label: `Sí, ${disc}% de descuento`,
          onClick: () => {
            disableLastActions();
            userSays(`Sí, ${disc}% de descuento`);
            setSelectedDiscount(disc);
            aiSays("¿Por cuánto tiempo tendrá vigencia el descuento?", buildDurationActions("frequent"));
            setStep("frequent-duration");
          },
        },
        {
          label: "Solo actualizar las visitas",
          variant: "outline",
          onClick: () => {
            disableLastActions();
            userSays("Solo actualizar las visitas requeridas");
            aiSays("Actualizando configuración de lealtad...");
            setStep("loyalty-visits");
            loyaltyMutation.mutate({ visitsRequired: n });
          },
        },
      ]
    );
    setStep("frequent-discount");
  }

  function promptCustomVisits() {
    disableLastActions();
    aiSays("Escribe el número de visitas requeridas (entre 2 y 50):");
    setCustomVisitsInput("");
    setStep("frequent-visits");
  }

  function submitCustomVisits() {
    const val = parseInt(customVisitsInput, 10);
    if (!val || val < 2 || val > 50) {
      toast.error("Ingresa un número entre 2 y 50.");
      return;
    }
    selectVisits(val);
    setCustomVisitsInput("");
  }

  function handleReset() {
    setStep("welcome");
    setAnalysisData(null);
    setActiveSegment(null);
    setSelectedDiscount(null);
    setSelectedDuration(null);
    msgId = 0;
    setMessages([
      {
        id: nextId(),
        from: "ai",
        content:
          "¡Hola de nuevo! ¿Qué quieres analizar ahora?",
        actions: [
          {
            label: "Resumen rápido",
            icon: <BarChart3 className="h-3.5 w-3.5" />,
            onClick: () => handleAnalyze(),
          },
          {
            label: "Análisis de actividad",
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            variant: "outline",
            onClick: () => handleServiceAnalysisRequest(),
          },
        ],
      },
    ]);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const showCustomDiscountInput =
    (step === "lost-discount" || step === "new-discount") &&
    messages.at(-1)?.from === "ai" &&
    messages.at(-1)?.content.includes("porcentaje");

  const showCustomDurationInput =
    (step === "lost-duration" || step === "new-duration" || step === "frequent-duration") &&
    messages.at(-1)?.from === "ai" &&
    messages.at(-1)?.content.includes("número de días");

  const showCustomVisitsInput =
    step === "frequent-visits" &&
    messages.at(-1)?.from === "ai" &&
    messages.at(-1)?.content.includes("número de visitas");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-4 md:px-6">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => navigate({ to: "/dashboard/$businessId", params: { businessId } })}
          aria-label="Volver al panel"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-signal)]">
          <Bot className="h-5 w-5 text-[color:var(--color-ink)]" aria-hidden />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-[color:var(--color-ink)]">
            Asistente IA
          </p>
          <p className="text-xs text-[color:var(--color-ink-soft)]">Powered by NVIDIA NIM</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 md:px-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}
          >
            <div className={cn("max-w-[85%]", msg.from === "ai" && "flex gap-2.5")}>
              {msg.from === "ai" && (
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-signal)]">
                  <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-ink)]" aria-hidden />
                </span>
              )}
              <div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.from === "user"
                      ? "rounded-tr-sm bg-[var(--color-ink)] text-white"
                      : "rounded-tl-sm bg-[var(--color-cream)] text-[color:var(--color-ink)]",
                    msg.isLoading && "flex items-center gap-2"
                  )}
                >
                  {msg.isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{msg.content}</span>
                    </>
                  ) : (
                    <MessageContent content={msg.content} />
                  )}
                </div>

                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.actions.map((action, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={action.variant === "outline" ? "outline" : "default"}
                        className={cn(
                          "h-8 gap-1.5 rounded-full text-xs",
                          action.variant !== "outline" &&
                            "bg-[var(--color-signal)] text-[color:var(--color-ink)] hover:bg-[var(--color-signal)]/90"
                        )}
                        onClick={action.onClick}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Custom inputs */}
        {showCustomDiscountInput && (
          <div className="flex justify-end">
            <div className="flex max-w-[85%] gap-2">
              <Input
                type="number"
                min={1}
                max={80}
                placeholder="Ej: 12"
                value={customDiscountInput}
                onChange={(e) => setCustomDiscountInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCustomDiscount()}
                className="h-9 w-28 rounded-xl text-sm"
                autoFocus
              />
              <Button
                size="sm"
                className="h-9 rounded-xl bg-[var(--color-signal)] text-[color:var(--color-ink)] hover:bg-[var(--color-signal)]/90"
                onClick={submitCustomDiscount}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {showCustomDurationInput && (
          <div className="flex justify-end">
            <div className="flex max-w-[85%] gap-2">
              <Input
                type="number"
                min={1}
                max={90}
                placeholder="Ej: 21"
                value={customDurationInput}
                onChange={(e) => setCustomDurationInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCustomDuration()}
                className="h-9 w-28 rounded-xl text-sm"
                autoFocus
              />
              <Button
                size="sm"
                className="h-9 rounded-xl bg-[var(--color-signal)] text-[color:var(--color-ink)] hover:bg-[var(--color-signal)]/90"
                onClick={submitCustomDuration}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {showCustomVisitsInput && (
          <div className="flex justify-end">
            <div className="flex max-w-[85%] gap-2">
              <Input
                type="number"
                min={2}
                max={50}
                placeholder="Ej: 8"
                value={customVisitsInput}
                onChange={(e) => setCustomVisitsInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCustomVisits()}
                className="h-9 w-28 rounded-xl text-sm"
                autoFocus
              />
              <Button
                size="sm"
                className="h-9 rounded-xl bg-[var(--color-signal)] text-[color:var(--color-ink)] hover:bg-[var(--color-signal)]/90"
                onClick={submitCustomVisits}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
// Renders **bold**, bullet lists, and newlines from the AI content strings.

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}
