import { ShieldCheck, Clock, CreditCard } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function FinalCTA() {
  return (
    <section id="cta" className="px-4 py-20 sm:px-6 sm:py-28">
      <div
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl p-10 text-center sm:p-16"
        style={{
          background: "var(--gradient-hero)",
          boxShadow: "var(--shadow-lifted)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative">
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl font-semibold tracking-tight text-primary-foreground sm:text-5xl">
            Tu próximo cliente frecuente está a un escaneo de distancia.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Crea tu programa de lealtad digital en menos de 5 minutos y empieza a recibir clientes
            recurrentes esta misma semana.
          </p>

          <div className="mt-8 flex justify-center">
            <GoogleSignInButton
              intent="business"
              label="Crear cuenta con Google"
              className="h-14 bg-background px-8 text-base font-semibold text-foreground hover:bg-background/90"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Sin tarjeta de crédito
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" /> Configuración en 5 min
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Cancela cuando quieras
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
