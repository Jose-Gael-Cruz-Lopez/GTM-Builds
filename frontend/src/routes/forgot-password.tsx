import { RouteError } from "@/components/RouteError";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AuthSplit } from "@/components/auth/AuthSplit";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Recuperar contraseña · NexoLeal" }] }),
});

const schema = z.object({ email: z.string().trim().email("Email inválido") });

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse({ email });
    if (!p.success) {
      toast.error("Email inválido");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error("No pudimos enviar el correo", { description: error.message });
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
    <AuthSplit
      headline="¿Olvidaste tu contraseña?"
      subtitle="Te enviamos un enlace para crear una nueva en segundos."
    >
      <h2 className="display-md">Recuperar acceso</h2>
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
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace"}
          </Button>
          <p className="text-center text-xs">
            <Link to="/login" className="underline text-[color:var(--color-ink-soft)]">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      ) : (
        <div className="surface-paper mt-6 p-6 text-center">
          <h3 className="font-display text-xl">Te enviamos un enlace.</h3>
          <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
            Revisa <strong>{email}</strong>. Si no llega, intenta de nuevo en {cooldown}s.
          </p>
          <Button type="button" disabled={cooldown > 0} onClick={onSubmit} className="mt-4 w-full">
            Reenviar {cooldown > 0 ? `(${cooldown}s)` : ""}
          </Button>
        </div>
      )}
    </AuthSplit>
  );
}
