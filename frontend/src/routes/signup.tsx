import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { businessesApi } from "@/lib/api/businesses";
import { onboardingSearch } from "@/lib/auth";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories";
import { useLocale } from "@/contexts/LocaleContext";

const searchSchema = z.object({
  plan: z.enum(["free", "pro"]).optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: (s) => searchSchema.parse(s),
  component: SignupPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Crear cuenta · NexoLeal" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { plan: initialPlan } = Route.useSearch();
  const { d } = useLocale();

  const [step, setStep] = useState<1 | 2 | "await">(1);
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
        plan: z.enum(["free", "pro"]),
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
          JSON.stringify({ name: form.businessName, category: form.category, plan: form.plan }),
        );
        setStep("await");
        return;
      }

      const created = await businessesApi.create({
        name: form.businessName,
        category: form.category as never,
        plan: form.plan,
      });
      localStorage.setItem("nexoleal:current-business-id", created.business.id);
      toast.success(d.signup.accountCreated);
      navigate({
        to: "/onboarding",
        search: onboardingSearch({
          businessId: created.business.id,
          businessName: form.businessName,
          category: form.category,
        }),
      });
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
      <AuthSplit headline={d.signup.awaitHeadline} subtitle={d.signup.awaitSubtitle}>
        <div className="surface-paper p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-cream)]">
            <Mail className="h-6 w-6 text-[color:var(--color-ink)]" />
          </div>
          <h2 className="mt-6 font-display text-2xl">{d.signup.awaitTitle}</h2>
          <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
            {d.signup.awaitBodyPre} <strong>{form.email}</strong> {d.signup.awaitBodyPost}
          </p>
        </div>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      headline={step === 1 ? d.signup.headline1 : d.signup.headline2}
      subtitle={step === 1 ? d.signup.subtitle1 : d.signup.subtitle2}
    >
      <div className="mb-6 flex gap-2">
        <span
          className={`h-1 flex-1 rounded-full ${step !== 1 ? "bg-[var(--color-ink)]" : "bg-[var(--color-signal)]"}`}
        />
        <span
          className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-[var(--color-signal)]" : "bg-[var(--color-border)]"}`}
        />
      </div>

      {step === 1 ? (
        <form onSubmit={goStep2} className="space-y-4">
          <h2 className="display-md">{d.signup.step1Title}</h2>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-[color:var(--color-status-risk)]">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">{d.login.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-[color:var(--color-status-risk)]">
                {errors.password}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="confirm">{d.signup.confirmLabel}</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              aria-invalid={!!errors.confirm}
            />
            {errors.confirm && (
              <p className="mt-1 text-xs text-[color:var(--color-status-risk)]">{errors.confirm}</p>
            )}
          </div>
          <Button type="submit" className="w-full btn-signal">
            {d.signup.continueBtn}
          </Button>
          <p className="text-center text-xs text-[color:var(--color-ink-soft)]">
            {d.signup.alreadyHaveAccount}{" "}
            <Link to="/login" className="underline">
              {d.signup.goToLogin}
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <h2 className="display-md">{d.signup.step2Title}</h2>
          <div>
            <Label htmlFor="businessName">{d.signup.businessNameLabel}</Label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder={d.signup.businessNamePlaceholder}
            />
            {errors.businessName && (
              <p className="mt-1 text-xs text-[color:var(--color-status-risk)]">
                {errors.businessName}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="category">{d.signup.categoryLabel}</Label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              {BUSINESS_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{d.signup.planLabel}</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["free", "pro"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setForm({ ...form, plan: p })}
                  className={`rounded-xl border px-4 py-3 text-left transition ${form.plan === p ? "border-[var(--color-signal)] bg-[var(--color-cream)]" : "border-[color:var(--color-border)]"}`}
                >
                  <p className="font-display text-lg capitalize">{p}</p>
                  <p className="text-xs text-[color:var(--color-ink-soft)]">
                    {p === "free" ? d.signup.planFreeDesc : d.signup.planProDesc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              {d.signup.backBtn}
            </Button>
            <Button type="submit" disabled={submitting} className="btn-signal flex-1">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : d.signup.createBtn}
            </Button>
          </div>
        </form>
      )}
    </AuthSplit>
  );
}
