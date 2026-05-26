import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { businessesApi } from "@/lib/api/businesses";
import { clearAuthIntent, clearAuthSource, onboardingSearch, readAuthIntent, readAuthSource } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Confirmando · NexoLeal" }] }),
});

function AuthCallback() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Iniciando sesión…");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Supabase auto-exchanges the hash on the client. Wait briefly for it.
      await new Promise((r) => setTimeout(r, 400));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      const source = readAuthSource();
      clearAuthSource();

      if (!data.session) {
        clearAuthIntent();
        toast.error("No pudimos iniciar sesión. Inténtalo de nuevo.");
        navigate({ to: source === "signup" ? "/signup" : "/login" });
        return;
      }

      const intent = readAuthIntent();
      clearAuthIntent();

      // Resume pending business creation if any.
      const pending = localStorage.getItem("nexoleal:pending-business");
      if (pending) {
        try {
          const parsed = JSON.parse(pending) as {
            name: string;
            category: string;
            plan: "free" | "pro";
          };
          setMsg("Creando tu negocio…");
          const created = await businessesApi.create({
            name: parsed.name,
            category: parsed.category as never,
            plan: parsed.plan,
          });
          localStorage.setItem("nexoleal:current-business-id", created.business.id);
          localStorage.removeItem("nexoleal:pending-business");
          toast.success("Cuenta confirmada");
          navigate({
            to: "/onboarding",
            search: onboardingSearch({
              businessId: created.business.id,
              businessName: parsed.name,
              category: parsed.category,
            }),
          });
          return;
        } catch (err) {
          console.error(err);
          toast.error(
            "Cuenta confirmada, pero no pudimos crear tu negocio. Inténtalo desde tu panel.",
          );
        }
      }

      // Otherwise, role-aware redirect.
      const owned = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", data.session.user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (intent === "business" || source === "signup") {
        if (owned.data?.id) {
          navigate({ to: "/dashboard/$businessId", params: { businessId: owned.data.id } });
        } else {
          navigate({ to: "/signup", search: { step: "business" } });
        }
        return;
      }

      if (owned.data?.id) {
        navigate({ to: "/dashboard/$businessId", params: { businessId: owned.data.id } });
      } else {
        navigate({ to: "/wallet" });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg-paper)]">
      <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-signal)]" />
      <p className="text-sm text-[color:var(--color-ink-soft)]">{msg}</p>
    </div>
  );
}
