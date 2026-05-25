import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { routeMeta } from "@/lib/route-meta";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AuthSplit } from "@/components/auth/AuthSplit";
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
    routeMeta(
      "Iniciar sesión · NexoLeal",
      "Accede a tu panel de lealtad o monedero digital de NexoLeal.",
    ),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect, reset } = Route.useSearch();
  const { d } = useLocale();

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
    <AuthSplit headline={d.login.headline} subtitle={d.login.subtitle}>
      <h2 className="display-md">{d.login.title}</h2>
      <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
        {d.login.newHere}{" "}
        <Link to="/signup" className="font-medium text-[color:var(--color-ink)] underline">
          {d.login.createAccount}
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-[color:var(--color-status-risk)]">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="password">{d.login.passwordLabel}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
              aria-label={showPassword ? d.login.hidePassword : d.login.showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-[color:var(--color-status-risk)]">
              {errors.password}
            </p>
          )}
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-[color:var(--color-ink-soft)] underline"
            >
              {d.login.forgotPassword}
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full btn-signal">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : d.login.submit}
        </Button>
      </form>
    </AuthSplit>
  );
}
