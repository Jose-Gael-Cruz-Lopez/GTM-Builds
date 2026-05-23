import { Store, QrCode, Megaphone } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Store,
    title: "Registra tu negocio",
    desc: "Crea tu cuenta en 2 minutos, sube tu logo y define la recompensa que motivará a tus clientes a volver.",
  },
  {
    n: "02",
    icon: QrCode,
    title: "Tus clientes escanean un QR",
    desc: "Coloca tu código en la caja. Cada visita acumula un sello digital, sin apps que descargar ni plásticos.",
  },
  {
    n: "03",
    icon: Megaphone,
    title: "Premia y reactiva en automático",
    desc: "NexoLeal envía recordatorios por WhatsApp y SMS cuando un cliente está por ganar premio o lleva tiempo sin volver.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Cómo funciona
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Empieza a fidelizar en 3 pasos
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sin hardware, sin contratos, sin que tu equipo tenga que aprender un
            sistema complicado.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="group relative rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-5xl font-semibold text-primary/15">
                    {s.n}
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent-foreground transition-colors group-hover:bg-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>

                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-border md:block"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
