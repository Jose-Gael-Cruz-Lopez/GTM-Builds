import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { routeMeta } from "@/lib/route-meta";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { SignupFlowShell } from "@/components/auth/SignupFlowShell";
import { useLocale } from "@/contexts/LocaleContext";

const searchSchema = z.object({
  redirect: z.string().optional(),
  reason: z.string().optional(),
  reset: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s) => searchSchema.parse(s),
  component: LoginPage,
  errorComponent: RouteError,
  head: () =>
    routeMeta("Iniciar sesión · NexoLeal", "Accede a tu panel de lealtad con Google o email."),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect, reset } = Route.useSearch();
  const { d } = useLocale();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(d.login.emailInvalid),
        password: z.string().min(6, d.login.passwordMin),
      }),
    [d],
  );

  useEffect(() => {
    if (reset === "ok") {
      toast.success(d.login.resetSuccess);
    }
  }, [reset, d]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      setErrors(map);
      return;
    }
    setSubmitting(true);
    const { error, data } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(d.login.errorTitle, { description: error.message });
      return;
    }

    const ownedRes = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", data.user!.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (redirect) {
      navigate({ to: redirect as never });
      return;
    }
    if (ownedRes.data?.id) {
      navigate({ to: "/dashboard/$businessId", params: { businessId: ownedRes.data.id } });
    } else {
      navigate({ to: "/wallet" });
    }
  };

  return (
    <SignupFlowShell
      stepKey="login"
      stepNumber={1}
      totalSteps={1}
      stepLabel={d.login.accessStep}
      headline={d.login.headline}
      subtitle={d.login.subtitle}
    >
      <GoogleSignInButton intent="business" source="login" label={d.signup.googleContinue} variant="flow" />

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
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="auth-flow-input pr-10"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                aria-label={showPassword ? d.login.hidePassword : d.login.showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[color:var(--color-status-risk)]">{errors.password}</p>
            )}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-[var(--ink-soft)] underline underline-offset-2"
              >
                {d.login.forgotPassword}
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="auth-flow-btn auth-flow-btn-full auth-flow-btn-primary inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : d.login.submitArrow}
          </button>
        </form>
      )}

      <p className="auth-flow-footnote">
        {d.login.newHere} <Link to="/signup">{d.login.createAccount}</Link>
      </p>
    </SignupFlowShell>
  );
}
