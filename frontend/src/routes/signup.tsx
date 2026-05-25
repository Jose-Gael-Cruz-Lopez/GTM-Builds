import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { businessesApi } from "@/lib/api/businesses";
import { onboardingSearch } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { SignupFlowShell } from "@/components/auth/SignupFlowShell";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories";

const searchSchema = z.object({
  plan: z.enum(["free", "pro"]).optional(),
  step: z.enum(["business"]).optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: (s) => searchSchema.parse(s),
  beforeLoad: async ({ search }) => {
    if (search.step === "business" && typeof window !== "undefined") {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: SignupPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Crear cuenta · NexoLeal" }] }),
});

const step1Schema = z
  .object({
    email: z.string().trim().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden",
  });

const step2Schema = z.object({
  businessName: z.string().trim().min(2, "Demasiado corto"),
  category: z.string().min(1, "Elige una categoría"),
  plan: z.enum(["free", "pro"]),
});

function SignupPage() {
  const navigate = useNavigate();
  const { plan: initialPlan, step: stepParam } = Route.useSearch();
  const [step, setStep] = useState<1 | 2 | "await">(stepParam === "business" ? 2 : 1);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    businessName: "",
    category: "cafe",
    plan: initialPlan ?? "free",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const businessStepOnly = stepParam === "business";
  const totalSteps = businessStepOnly ? 1 : 2;
  const stepNumber = step === 1 ? 1 : 2;

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const p = step1Schema.safeParse(form);
    if (!p.success) {
      const map: Record<string, string> = {};
      p.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      setErrors(map);
      return;
    }
    setStep(2);
  };

  const createBusinessAndContinue = async () => {
    const created = await businessesApi.create({
      name: form.businessName,
      category: form.category as never,
      plan: form.plan,
    });
    localStorage.setItem("nexoleal:current-business-id", created.business.id);
    toast.success("Negocio creado");
    navigate({
      to: "/onboarding",
      search: onboardingSearch({
        businessId: created.business.id,
        businessName: form.businessName,
        category: form.category,
      }),
    });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const p = step2Schema.safeParse(form);
    if (!p.success) {
      const map: Record<string, string> = {};
      p.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      setErrors(map);
      return;
    }
    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && stepParam === "business") {
        await createBusinessAndContinue();
        return;
      }

      const { data: signUpData, error: signErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signErr) throw signErr;

      if (!signUpData.user) {
        throw new Error("No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos.");
      }

      if (!signUpData.session) {
        localStorage.setItem(
          "nexoleal:pending-business",
          JSON.stringify({ name: form.businessName, category: form.category, plan: form.plan }),
        );
        setStep("await");
        return;
      }

      await createBusinessAndContinue();
    } catch (err) {
      console.error(err);
      const message = (err as Error).message ?? "";
      const description = message.toLowerCase().includes("rate limit")
        ? "No podemos enviar el correo de confirmación ahora mismo (límite del proveedor de correo). Espera unos minutos e inténtalo otra vez."
        : message;
      toast.error("No pudimos crear tu cuenta", { description });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "await") {
    return (
      <SignupFlowShell
        stepKey="await"
        stepNumber={2}
        totalSteps={2}
        stepLabel="Confirma tu cuenta"
        headline="Revisa tu correo."
        subtitle="Un clic en el enlace y terminamos de crear tu negocio."
      >
        <div className="auth-flow-await">
          <div className="auth-flow-await-icon">
            <Mail className="h-6 w-6" />
          </div>
          <p className="mt-5 font-display text-xl">Te enviamos un enlace</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
            Abre el correo en <strong className="text-[var(--ink)]">{form.email}</strong> y confirma
            tu cuenta. Cuando regreses, tu negocio se creará automáticamente.
          </p>
        </div>
      </SignupFlowShell>
    );
  }

  const copy =
    step === 1
      ? {
          stepKey: "account",
          stepLabel: "Paso 1 · Cuenta",
          headline: "Empecemos.",
          subtitle: "Entra con Google en un clic. Sin contraseñas, sin fricción.",
        }
      : {
          stepKey: "business",
          stepLabel: businessStepOnly ? "Tu negocio" : "Paso 2 · Tu negocio",
          headline: "Cuéntanos de tu negocio.",
          subtitle: "Así se verá en la cartera digital de tus clientes.",
        };

  return (
    <SignupFlowShell
      stepKey={copy.stepKey}
      stepNumber={businessStepOnly ? 1 : stepNumber}
      totalSteps={totalSteps}
      stepLabel={copy.stepLabel}
      headline={copy.headline}
      subtitle={copy.subtitle}
      showBack={step === 2 && !businessStepOnly}
      onBack={() => setStep(1)}
    >
      {step === 1 ? (
        <div>
          <GoogleSignInButton intent="business" label="Continuar con Google" variant="flow" />

          <div className="auth-flow-divider">
            <span>o</span>
          </div>

          {!showEmailForm ? (
            <button
              type="button"
              className="auth-flow-btn auth-flow-btn-full auth-flow-btn-ghost"
              onClick={() => setShowEmailForm(true)}
            >
              Usar email y contraseña
            </button>
          ) : (
            <form onSubmit={goStep2} className="space-y-4">
              <div className="auth-flow-field">
                <label htmlFor="email" className="auth-flow-label">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="auth-flow-input"
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-[color:var(--color-status-risk)]">{errors.email}</p>
                )}
              </div>
              <div className="auth-flow-field">
                <label htmlFor="password" className="auth-flow-label">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="auth-flow-input"
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-xs text-[color:var(--color-status-risk)]">{errors.password}</p>
                )}
              </div>
              <div className="auth-flow-field">
                <label htmlFor="confirm" className="auth-flow-label">
                  Confirmar contraseña
                </label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="auth-flow-input"
                  aria-invalid={!!errors.confirm}
                />
                {errors.confirm && (
                  <p className="text-xs text-[color:var(--color-status-risk)]">{errors.confirm}</p>
                )}
              </div>
              <button
                type="submit"
                className="auth-flow-btn auth-flow-btn-full auth-flow-btn-primary mt-2"
              >
                Continuar
              </button>
            </form>
          )}

          <p className="auth-flow-footnote">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-5">
          <div className="auth-flow-field">
            <label htmlFor="businessName" className="auth-flow-label">
              Nombre del negocio
            </label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="La Barbería Sur"
              className="auth-flow-input"
              aria-invalid={!!errors.businessName}
            />
            {errors.businessName && (
              <p className="text-xs text-[color:var(--color-status-risk)]">{errors.businessName}</p>
            )}
          </div>

          <div className="auth-flow-field">
            <span className="auth-flow-label">Categoría</span>
            <div className="auth-flow-chips">
              {BUSINESS_CATEGORY_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={`${c.value}-${c.label}`}
                  data-active={form.category === c.value}
                  className="auth-flow-chip"
                  onClick={() => setForm({ ...form, category: c.value })}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="auth-flow-field">
            <span className="auth-flow-label">Plan</span>
            <div className="auth-flow-plans">
              {(["free", "pro"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  data-active={form.plan === p}
                  className="auth-flow-plan"
                  onClick={() => setForm({ ...form, plan: p })}
                >
                  <p className="auth-flow-plan-title">{p}</p>
                  <p className="auth-flow-plan-desc">
                    {p === "free" ? "Hasta 100 clientes" : "Ilimitado + IA"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-flow-actions">
            <button
              type="submit"
              disabled={submitting}
              className="auth-flow-btn auth-flow-btn-full auth-flow-btn-primary inline-flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear negocio →"}
            </button>
          </div>
        </form>
      )}
    </SignupFlowShell>
  );
}
