import { RouteError } from "@/components/RouteError";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { useLocale } from "@/contexts/LocaleContext";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Recuperar contraseña · NexoLeal" }] }),
});

function ForgotPasswordPage() {
  const { d } = useLocale();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const schema = useMemo(
    () => z.object({ email: z.string().trim().email(d.forgotPassword.emailInvalid) }),
    [d],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse({ email });
    if (!p.success) {
      toast.error(d.forgotPassword.emailInvalid);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(d.forgotPassword.errorSend, { description: error.message });
      return;
    }
    setSent(true);
    setCooldown(60);
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <AuthSplit headline={d.forgotPassword.headline} subtitle={d.forgotPassword.subtitle}>
      <h2 className="display-md">{d.forgotPassword.title}</h2>
      {!sent ? (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full btn-signal">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : d.forgotPassword.submit}
          </Button>
          <p className="text-center text-xs">
            <Link to="/login" className="underline text-[color:var(--color-ink-soft)]">
              {d.forgotPassword.backToLogin}
            </Link>
          </p>
        </form>
      ) : (
        <div className="surface-paper mt-6 p-6 text-center">
          <h3 className="font-display text-xl">{d.forgotPassword.sentTitle}</h3>
          <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
            {d.forgotPassword.sentBodyPre} <strong>{email}</strong>
            {d.forgotPassword.sentBodyMid} {cooldown}
            {d.forgotPassword.sentBodyPost}
          </p>
          <Button
            type="button"
            disabled={cooldown > 0}
            onClick={onSubmit}
            className="mt-4 w-full"
          >
            {d.forgotPassword.resend} {cooldown > 0 ? `(${cooldown}s)` : ""}
          </Button>
        </div>
      )}
    </AuthSplit>
  );
}
