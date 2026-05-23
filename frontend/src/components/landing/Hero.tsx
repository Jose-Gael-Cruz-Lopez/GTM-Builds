import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, QrCode, Stamp, Gift } from "lucide-react";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-soft)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[480px] w-[680px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-hero)" }}
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-28">
        <div className="lg:col-span-7">


          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Convierte visitas casuales en{" "}
            <span className="relative whitespace-nowrap">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                clientes frecuentes.
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            NexoLeal es el programa de fidelización 100% digital para PYMES.
            Tus clientes acumulan sellos con un QR y vuelven más seguido.
            Una sola plataforma para gestionar tu programa, sin complicaciones ni costos ocultos.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="h-12 px-6 text-base" asChild>
              <Link to="/signup">
                Crea la cuenta de tu negocio
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base"
            >
              <PlayCircle className="mr-1 h-4 w-4" />
              Ver demo
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Prueba 30
              días gratis
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Sin tarjeta
              de crédito
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Configuras
              en 5 minutos
            </span>
          </div>
        </div>

        {/* Mockup */}
        <div className="relative lg:col-span-5">
          <div className="relative mx-auto max-w-sm">
            {/* Phone card */}
            <div
              className="relative rounded-[2rem] border border-border bg-card p-3"
              style={{ boxShadow: "var(--shadow-lifted)" }}
            >
              <div
                className="rounded-[1.5rem] p-6 text-primary-foreground"
                style={{ background: "var(--gradient-hero)" }}
              >
                <div className="flex items-center justify-between text-xs opacity-80">
                  <span>Café Aurora</span>
                  <span>Tarjeta digital</span>
                </div>
                <div className="mt-6 font-display text-2xl font-semibold">
                  Hola, Marina
                </div>
                <div className="mt-1 text-sm opacity-80">
                  1 sello más para tu café gratis
                </div>

                <div className="mt-6 grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const filled = i < 9;
                    return (
                      <div
                        key={i}
                        className={`flex aspect-square items-center justify-center rounded-lg border ${
                          filled
                            ? "border-white/40 bg-white/20"
                            : "border-white/20 bg-white/5"
                        }`}
                      >
                        {filled && <Stamp className="h-4 w-4" />}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl bg-white/10 p-3 backdrop-blur">
                  <div className="text-xs">
                    <div className="opacity-80">Próxima recompensa</div>
                    <div className="font-medium">Café americano gratis</div>
                  </div>
                  <Gift className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Floating QR */}
            <div
              className="absolute -bottom-6 -left-6 hidden rotate-[-6deg] rounded-2xl border border-border bg-card p-4 sm:block"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent-soft text-accent-foreground">
                  <QrCode className="h-6 w-6" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">
                    Crea tu QR
                  </div>
                  <div className="text-muted-foreground">Enseña este código al pagar.</div>
                </div>
              </div>
            </div>

            {/* Floating metric */}
            <div
              className="absolute -right-4 -top-4 rotate-[4deg] rounded-2xl border border-border bg-card px-4 py-3"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Recompra
              </div>
              <div className="font-display text-xl font-semibold text-foreground">
                +38% retención
              </div>
              <div className="text-[10px] text-accent-foreground">
                vs. mes anterior
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
