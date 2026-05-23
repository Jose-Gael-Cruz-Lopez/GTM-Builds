import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "En 3 meses subí la recompra semanal un 42%. Mis clientes ya no pierden la tarjeta porque la llevan en el celular, y yo veo en tiempo real quién no ha vuelto en 20 días para invitarlo con un descuento.",
    name: "Daniel Reyes",
    role: "Dueño · Estudio Navaja",
    city: "Barbería · Guadalajara",
    initials: "DR",
  },
  {
    quote:
      "Antes regalábamos croquetas sin saber a quién. Ahora cada cliente tiene su historial, sabemos qué mascota tiene y le mandamos un recordatorio cuando se le va a acabar el alimento. El ticket promedio subió 28%.",
    name: "Lucía Martín",
    role: "Fundadora · PataFeliz",
    city: "Tienda de mascotas · Monterrey",
    initials: "LM",
  },
];

export function Testimonials() {
  return (
    <section id="testimonios" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Testimonios
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Negocios reales, resultados reales
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-8"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <Quote className="h-7 w-7 text-accent" />
              <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <span
                  className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  {t.initials}
                </span>
                <div>
                  <div className="font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                  <div className="text-xs text-muted-foreground">{t.city}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
