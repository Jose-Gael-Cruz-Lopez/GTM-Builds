import { Link } from "@tanstack/react-router";
import { useRevealOnce } from "@/hooks/use-reveal-once";

export function ConsumerJoin() {
  const { ref, revealed } = useRevealOnce<HTMLElement>({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      aria-label="Sección para clientes"
      style={{
        background: "var(--bg-base)",
        padding: "6rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "min(1100px, 92vw)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "3rem",
          alignItems: "center",
        }}
      >
        {/* Copy */}
        <div
          className={revealed ? "soft-rise" : "opacity-0"}
          style={{ transitionDelay: "100ms" }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--signal)",
            }}
          >
            ¿Eres cliente?
          </span>
          <h2
            className="font-display"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--cream)",
              margin: "0.75rem 0 0",
            }}
          >
            Tu recompensa
            <br />
            te espera.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "rgba(245, 232, 216, 0.55)",
              maxWidth: "38ch",
              margin: "1.25rem 0 0",
            }}
          >
            Regístrate con tu número en segundos. Acumula visitas, desbloquea descuentos y
            comparte tu código con amigos para ganar más.
          </p>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <Link
              to="/user/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--signal)",
                color: "var(--ink)",
                padding: "0.875rem 1.5rem",
                borderRadius: "9999px",
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                textDecoration: "none",
              }}
            >
              Únete ahora
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              to="/user/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "transparent",
                color: "rgba(245, 232, 216, 0.6)",
                padding: "0.875rem 1.25rem",
                borderRadius: "9999px",
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                fontWeight: 400,
                textDecoration: "none",
                border: "1px solid rgba(245, 232, 216, 0.12)",
              }}
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Visual card mockup */}
        <div
          className={revealed ? "soft-rise" : "opacity-0"}
          style={{
            transitionDelay: "220ms",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "320px",
              background: "var(--bg-elevated)",
              borderRadius: "24px",
              padding: "2rem",
              border: "1px solid rgba(245,232,216,0.06)",
              boxShadow: "0 32px 64px -16px rgba(0,0,0,0.5)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(245,232,216,0.35)",
                marginBottom: "1.25rem",
              }}
            >
              Muestra este código al staff
            </p>

            <div
              style={{
                background: "var(--bg-base)",
                borderRadius: "16px",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: "var(--signal)",
                  margin: 0,
                }}
              >
                XK9·F4A
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.7rem",
                  color: "rgba(245,232,216,0.3)",
                  marginTop: "0.5rem",
                }}
              >
                Se renueva en 67 s
              </p>
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { label: "Tu código de invitación", value: "REF-551-7842" },
                { label: "Sellos acumulados", value: "4 / 10" },
                { label: "Próxima recompensa", value: "Café gratis" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(245,232,216,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.75rem",
                      color: "rgba(245,232,216,0.4)",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--cream)",
                      fontWeight: 500,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
