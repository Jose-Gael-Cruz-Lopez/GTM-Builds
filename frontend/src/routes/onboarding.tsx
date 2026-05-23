import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Loader2,
  Megaphone,
  QrCode,
  Sparkles,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { businessesApi } from "@/lib/api/businesses";
import { ApiError } from "@/lib/api-client";

const searchSchema = z.object({
  businessId: z.string().uuid().optional(),
  business: z.string().trim().max(120).optional(),
  type: z.string().trim().max(60).optional(),
});

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (!search.businessId) {
      throw redirect({ to: "/signup" });
    }
  },
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "Configura tu negocio · NexoLeal" },
      {
        name: "description",
        content:
          "Configura tu programa de lealtad en 3 pasos: personaliza tu marca, crea tu primera recompensa y genera tu QR.",
      },
    ],
  }),
});

type Step = "brand" | "reward" | "finish";

const STEPS: Array<{
  key: Step;
  icon: typeof Sparkles;
  title: string;
  description: string;
}> = [
  {
    key: "brand",
    icon: Sparkles,
    title: "Personaliza tu marca",
    description:
      "Sube tu logo y elige los colores que verán tus clientes al escanear el QR.",
  },
  {
    key: "reward",
    icon: QrCode,
    title: "Crea tu primera recompensa",
    description:
      "Define cuántas visitas o compras se necesitan para ganar una recompensa.",
  },
  {
    key: "finish",
    icon: Megaphone,
    title: "Imprime y comparte tu QR",
    description:
      "Descarga tu código QR único y empieza a sumar clientes frecuentes hoy mismo.",
  },
];

const STEP_INDEX: Record<Step, number> = {
  brand: 0,
  reward: 1,
  finish: 2,
};

function OnboardingPage() {
  const { businessId, business, type } = Route.useSearch();
  const [step, setStep] = useState<Step>("brand");
  const currentIdx = STEP_INDEX[step];

  const [stampsRequired, setStampsRequired] = useState(10);
  const [rewardDescription, setRewardDescription] = useState("Servicio gratis");

  const updateConfig = useMutation({
    mutationFn: () =>
      businessesApi.updateLoyaltyConfig(businessId!, {
        stampsRequired,
        rewardDescription,
      }),
    onSuccess: () => {
      toast.success("Recompensa configurada");
      setStep("finish");
    },
    onError: (e) => {
      const message =
        e instanceof ApiError
          ? e.message
          : "No pudimos guardar tu recompensa. Intenta de nuevo.";
      toast.error(message);
    },
  });

  const staffKeyQuery = useQuery({
    queryKey: ["business", businessId, "first-staff-key"],
    queryFn: () =>
      businessesApi.createStaffKey(businessId!, { label: "Default device" }),
    enabled: step === "finish",
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (staffKeyQuery.data?.headerValue) {
      try {
        localStorage.setItem(
          "nexoleal:staff-key",
          staffKeyQuery.data.headerValue,
        );
      } catch {
        // localStorage may be unavailable (private mode); silently ignore.
      }
    }
  }, [staffKeyQuery.data]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-black">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">NexoLeal</span>
          </Link>
          <span className="text-sm text-muted">Onboarding</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="badge mb-4">¡Bienvenido!</div>
        <h1 className="page-title">
          {business ? `Hola, ${business} 👋` : "Configuremos tu negocio"}
        </h1>
        <p className="muted-text mt-3 text-lg">
          {type
            ? `Vamos a dejar listo tu programa de lealtad para tu ${type.toLowerCase()} en 3 pasos rápidos.`
            : "Vamos a dejar listo tu programa de lealtad en 3 pasos rápidos."}
        </p>

        <ol className="mt-10 space-y-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <li
                key={s.key}
                className={`card flex items-start gap-4 p-5 transition ${
                  isActive ? "ring-2 ring-[var(--ring)]" : ""
                } ${isDone ? "opacity-70" : ""}`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    isDone
                      ? "bg-[var(--secondary)] text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-[var(--surface-2)] text-muted"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Paso {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                  <p className="muted-text text-sm">{s.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-10">
          {step === "brand" && (
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold">
                Personaliza tu marca
              </h2>
              <p className="muted-text mt-1 text-sm">
                Pronto podrás subir tu logo y ajustar los colores de tu programa.
                Por ahora seguimos con la configuración esencial — siempre puedes
                volver a este paso desde el panel.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="ghost" asChild>
                  <Link to="/">Salir al inicio</Link>
                </Button>
                <Button size="lg" onClick={() => setStep("reward")}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "reward" && (
            <form
              className="card p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (updateConfig.isPending) return;
                updateConfig.mutate();
              }}
            >
              <h2 className="font-display text-xl font-semibold">
                Crea tu primera recompensa
              </h2>
              <p className="muted-text mt-1 text-sm">
                Define cuántas visitas necesita un cliente para ganar y la
                recompensa que recibirá.
              </p>

              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stamps">Visitas necesarias</Label>
                    <span className="text-sm font-semibold tabular-nums">
                      {stampsRequired}
                    </span>
                  </div>
                  <Slider
                    id="stamps"
                    min={1}
                    max={30}
                    step={1}
                    value={[stampsRequired]}
                    onValueChange={(v) => setStampsRequired(v[0] ?? 10)}
                  />
                  <p className="muted-text text-xs">
                    Recomendamos entre 8 y 12 visitas para tu primera recompensa.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward">Recompensa</Label>
                  <Input
                    id="reward"
                    value={rewardDescription}
                    onChange={(e) => setRewardDescription(e.target.value)}
                    placeholder="Ej. Servicio gratis"
                    maxLength={120}
                    required
                  />
                  <p className="muted-text text-xs">
                    Lo que el cliente recibe al completar las visitas. Máximo
                    120 caracteres.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("brand")}
                  disabled={updateConfig.isPending}
                >
                  Volver
                </Button>
                <Button type="submit" size="lg" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
                    </>
                  ) : (
                    <>
                      Guardar y continuar <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === "finish" && (
            <div className="card border-[var(--secondary)] bg-[color-mix(in_srgb,var(--secondary)_8%,white)] p-6">
              <CheckCircle2 className="h-10 w-10 text-[var(--secondary)]" />
              <h2 className="mt-3 font-display text-xl font-semibold">
                ¡Tu negocio está listo!
              </h2>
              <p className="muted-text mt-1 text-sm">
                Guarda esta llave del staff. Es lo que tu personal usará para
                escanear códigos QR desde la caja.
              </p>

              {staffKeyQuery.isLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generando tu
                  llave…
                </div>
              )}

              {staffKeyQuery.isError && (
                <p className="mt-4 text-sm text-destructive">
                  No pudimos generar la llave del staff. Recarga esta página
                  para intentarlo de nuevo.
                </p>
              )}

              {staffKeyQuery.data?.headerValue && (
                <>
                  <div className="mt-4 rounded-lg border border-dashed bg-[var(--surface-2)] p-3">
                    <code className="text-xs break-all">
                      {staffKeyQuery.data.headerValue}
                    </code>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const value = staffKeyQuery.data?.headerValue ?? "";
                      void navigator.clipboard.writeText(value);
                      toast.success("Copiado al portapapeles");
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copiar llave
                  </Button>
                </>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href={`/dashboard/${businessId ?? ""}`}>Ir al panel</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/scan">Probar el escáner</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
