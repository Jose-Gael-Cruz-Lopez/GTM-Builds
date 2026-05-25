import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { useLocale } from "@/contexts/LocaleContext";

const searchSchema = z.object({
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

function SignupPage() {
  const navigate = useNavigate();
  const { step: stepParam } = Route.useSearch();
  const { d } = useLocale();
  const [step, setStep] = useState<1 | 2 | "await">(stepParam === "business" ? 2 : 1);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    businessName: "",
    category: "cafe",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const businessStepOnly = stepParam === "business";
  const totalSteps = businessStepOnly ? 1 : 2;
  const stepNumber = step === 1 ? 1 : 2;

  const step1Schema = useMemo(
    () =>
      z
        .object({
          email: z.string().trim().email(d.signup.emailInvalid),
          password: z.string().min(8, d.signup.passwordMin),
          confirm: z.string(),
        })
        .refine((data) => data.password === data.confirm, {
          path: ["confirm"],
          message: d.signup.confirmMismatch,
        }),
    [d],
  );

  const step2Schema = useMemo(
    () =>
      z.object({
        businessName: z.string().trim().min(2, d.signup.businessNameShort),
        category: z.string().min(1, d.signup.categoryRequired),
      }),
    [d],
  );

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
      plan: "free",
    });
    localStorage.setItem("nexoleal:current-business-id", created.business.id);
    toast.success(d.signup.businessCreated);
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
        throw new Error(d.signup.errorCreate);
      }

      if (!signUpData.session) {
        localStorage.setItem(
          "nexoleal:pending-business",
          JSON.stringify({ name: form.businessName, category: form.category, plan: "free" }),
        );
        setStep("await");
        return;
      }

      await createBusinessAndContinue();
    } catch (err) {
      console.error(err);
      const message = (err as Error).message ?? "";
      const description = message.toLowerCase().includes("rate limit")
        ? d.signup.errorRateLimit
        : message;
      toast.error(d.signup.errorCreate, { description });
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
        stepLabel={d.signup.confirmStepLabel}
        headline={d.signup.awaitHeadline}
        subtitle={d.signup.awaitSubtitle}
      >
        <div className="auth-flow-await">
          <div className="auth-flow-await-icon">
            <Mail className="h-6 w-6" />
          </div>
          <p className="mt-5 font-display text-xl">{d.signup.awaitTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
            {d.signup.awaitBodyPre}{" "}
            <strong className="text-[var(--ink)]">{form.email}</strong> {d.signup.awaitBodyPost}
          </p>
        </div>
      </SignupFlowShell>
    );
  }

  return (
    <SignupFlowShell
      stepKey={step === 1 ? "account" : "business"}
      stepNumber={businessStepOnly ? 1 : stepNumber}
      totalSteps={totalSteps}
      stepLabel={
        step === 1
          ? d.signup.step1Title
          : businessStepOnly
            ? d.signup.businessStepLabel
            : d.signup.step2Title
      }
      headline={step === 1 ? d.signup.headline1 : d.signup.headline2}
      subtitle={step === 1 ? d.signup.subtitle1 : d.signup.subtitle2}
      showBack={step === 2 && !businessStepOnly}
      onBack={() => setStep(1)}
    >
      {step === 1 ? (
        <div>
          <GoogleSignInButton intent="business" label={d.signup.googleContinue} variant="flow" />

          <div className="auth-flow-divider">
            <span>{d.common.orDivider}</span>
          </div>

          {!showEmailForm ? (
            <button
              type="button"
              className="auth-flow-btn auth-flow-btn-full auth-flow-btn-ghost"
              onClick={() => setShowEmailForm(true)}
            >
              {d.signup.useEmailPassword}
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
                  {d.login.passwordLabel}
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
                  {d.signup.confirmLabel}
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
                {d.signup.continueBtn}
              </button>
            </form>
          )}

          <p className="auth-flow-footnote">
            {d.signup.alreadyHaveAccount}{" "}
            <Link to="/login">{d.signup.goToLogin}</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-5">
          <div className="auth-flow-field">
            <label htmlFor="businessName" className="auth-flow-label">
              {d.signup.businessNameLabel}
            </label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder={d.signup.businessNamePlaceholder}
              className="auth-flow-input"
              aria-invalid={!!errors.businessName}
            />
            {errors.businessName && (
              <p className="text-xs text-[color:var(--color-status-risk)]">{errors.businessName}</p>
            )}
          </div>

          <div className="auth-flow-field">
            <span className="auth-flow-label">{d.signup.categoryLabel}</span>
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

          <div className="auth-flow-actions">
            <button
              type="submit"
              disabled={submitting}
              className="auth-flow-btn auth-flow-btn-full auth-flow-btn-primary inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                d.signup.createBtnArrow
              )}
            </button>
          </div>
        </form>
      )}
    </SignupFlowShell>
  );
}
