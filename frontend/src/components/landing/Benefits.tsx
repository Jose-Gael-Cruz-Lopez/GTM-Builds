import { Zap, BarChart3, Bell, Users } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Cero hardware",
    desc: "Funciona en cualquier teléfono o tablet. Solo necesitas imprimir tu QR.",
  },
  {
    icon: Users,
    title: "Conoce a tus clientes",
    desc: "Construye una base de datos real con nombre, cumpleaños y frecuencia de visita.",
  },
  {
    icon: Bell,
    title: "Campañas automáticas",
    desc: "Reactiva clientes inactivos con mensajes que se envían solos por WhatsApp.",
  },
  {
    icon: BarChart3,
    title: "Reportes en tiempo real",
    desc: "Mide recompra, ticket promedio y el ROI exacto de cada recompensa.",
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="bg-primary-soft/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Por qué NexoLeal
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              La tarjeta de cartón está muerta. Tus clientes también la perdieron.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Reemplaza el sello con tinta por un sistema que además te dice
              quién es tu cliente, cuánto gasta y cuándo regresará.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {b.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
