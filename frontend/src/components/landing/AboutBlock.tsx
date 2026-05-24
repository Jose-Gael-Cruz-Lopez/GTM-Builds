import { useRevealOnce } from "@/hooks/use-reveal-once";

const DIARY = [
  {
    title:
      "Cómo un café de barrio recuperó el 40% de sus clientes con fidelidad en WhatsApp",
    date: "15 de mayo, 2026",
    img: "/landing/diary/d1.jpg",
    alt: "Café de barrio con clientes habituales",
    href: "#diario",
  },
  {
    title:
      "Cuatro errores comunes al lanzar un programa de puntos (y cómo evitarlos)",
    date: "2 de mayo, 2026",
    img: "/landing/diary/d2.jpg",
    alt: "Mostrador de negocio con tarjeta de fidelidad",
    href: "#diario",
  },
];

export function AboutBlock() {
  const { ref } = useRevealOnce<HTMLDivElement>({ threshold: 0.25 });

  return (
    <section
      id="producto"
      aria-label="Sobre NexoLeal"
      style={{
        background: "var(--paper)",
        padding:
          "clamp(4rem, 10vw, 9rem) clamp(1.5rem, 5vw, 5rem) clamp(4rem, 8vw, 7rem)",
      }}
    >
      <div
        ref={ref}
        className="mx-auto grid gap-x-12 gap-y-12"
        style={{
          maxWidth: "min(1280px, 92vw)",
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "3rem",
          }}
        >
          {/* Layout: stack on mobile, two columns on desktop */}
          <div className="md:grid md:gap-x-12" style={{ gridTemplateColumns: "62% 1fr" }}>
            {/* Left: kicker + paragraph */}
            <div>
              <div
                className="soft-rise"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "1.5rem",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                  marginBottom: "2rem",
                }}
              >
                <div>NexoLeal<sup style={{ fontSize: "0.6em" }}>®</sup></div>
                <div>Est.</div>
                <div>2025</div>
              </div>

              {/* Inset image floated left with shape-outside */}
              <img
                src="/landing/about/inset.jpg"
                alt="Cliente mostrando su tarjeta de sellos en el celular"
                width={160}
                height={220}
                loading="lazy"
                decoding="async"
                className="soft-rise"
                style={{
                  float: "left",
                  width: "clamp(110px, 16vw, 180px)",
                  height: "auto",
                  marginRight: "1.25rem",
                  marginBottom: "0.5rem",
                  borderRadius: "4px",
                  shapeOutside: "margin-box",
                }}
              />

              <p
                className="font-display"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "var(--display-md)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                  textWrap: "pretty",
                  margin: 0,
                }}
              >
                <span className="rise-mask inline">
                  <span className="rise-line">
                    Construimos NexoLeal para los negocios que recuerdan el
                    nombre de cada cliente.
                  </span>
                </span>{" "}
                <span className="rise-mask inline">
                  <span className="rise-line">
                    La fidelidad no se compra con descuentos: se gana con
                    atención.
                  </span>
                </span>{" "}
                <span className="rise-mask inline">
                  <span className="rise-line">
                    Cada flujo, cada mensaje y cada recompensa fue diseñado
                    para que volver sea la opción más natural.
                  </span>
                </span>
              </p>
              <div style={{ clear: "both" }} />
            </div>

            {/* Right: diary cards */}
            <div
              className="md:flex md:flex-col md:gap-4 mt-12 md:mt-0"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  textAlign: "right",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                  marginBottom: "0.5rem",
                }}
              >
                Diario reciente <span aria-hidden="true">↓</span>
              </div>
              {DIARY.map((d) => (
                <DiaryCard key={d.title} {...d} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiaryCard({
  title,
  date,
  img,
  alt,
  href,
}: {
  title: string;
  date: string;
  img: string;
  alt: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="soft-rise block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: "var(--paper-warm)",
        borderRadius: "18px",
        border: "1px solid var(--hair)",
        overflow: "hidden",
        textDecoration: "none",
        color: "var(--ink)",
        transition: "transform 220ms var(--ease-editorial), box-shadow 220ms",
        boxShadow: "0 1px 0 var(--hair)",
        // @ts-expect-error css var
        "--tw-ring-color": "var(--ink)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow =
          "0 12px 28px -16px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 0 var(--hair)";
      }}
    >
      <img
        src={img}
        alt={alt}
        width={880}
        height={605}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "16 / 11",
          objectFit: "cover",
          display: "block",
        }}
      />
      <div style={{ padding: "1rem 1.125rem 1.25rem" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "1.0625rem",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: "0.5rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            color: "var(--ink-soft)",
          }}
        >
          {date}
        </div>
      </div>
    </a>
  );
}
