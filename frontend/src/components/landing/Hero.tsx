import { Link } from "@tanstack/react-router";
import { FloatingCloud } from "./FloatingCloud";
import { ScrollToExplore } from "./ScrollToExplore";
import { useRevealOnce } from "@/hooks/use-reveal-once";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function Hero() {
  const { ref } = useRevealOnce<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section
      className="relative overflow-hidden"
      style={{
        height: "100dvh",
        minHeight: "100svh",
        background: "var(--paper)",
        position: "relative",
        zIndex: 2,
      }}
      aria-label="Inicio"
    >
      <FloatingCloud />

      <div
        ref={ref}
        className="relative z-10 mx-auto flex flex-col items-center justify-center text-center"
        style={{
          minHeight: "100svh",
          padding: "8rem 1.5rem 6rem",
          maxWidth: "min(1200px, 92vw)",
        }}
      >
        <span
          className="soft-rise"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
            marginBottom: "2.25rem",
          }}
        >
          NexoLeal · Fidelidad para tu negocio
        </span>

        <h1
          className="font-display"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "var(--display-xl)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            maxWidth: "18ch",
            textWrap: "balance",
            margin: 0,
          }}
        >
          <span className="rise-mask block">
            <span className="rise-line">Hecho para volver.</span>
          </span>
          <span className="rise-mask block">
            <span className="rise-line">Una y otra vez.</span>
          </span>
        </h1>

        <p
          className="soft-rise delay-1"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1.0625rem",
            lineHeight: 1.55,
            color: "var(--ink-soft)",
            maxWidth: "46ch",
            margin: "1.75rem auto 0",
          }}
        >
          La plataforma de fidelidad y retención para cafés, salones y pequeños comercios en México.
          Sin apps. Sin tarjetas físicas. Solo conversaciones que vuelven.
        </p>

        <div
          className="soft-rise delay-2 flex flex-wrap items-center justify-center gap-3"
          style={{ marginTop: "2.5rem" }}
        >
          <GoogleSignInButton intent="business" label="Negocios" variant="hero" />
          <Link
            to="/user/dashboard"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255,255,255,0.92)",
              color: "var(--ink)",
              padding: "0.875rem 1.5rem",
              borderRadius: "9999px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.02em",
              border: "1px solid var(--hair)",
              textDecoration: "none",
              // @ts-expect-error css var
              "--tw-ring-color": "var(--ink)",
            }}
          >
            Clientes
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        <ScrollToExplore tone="dark" />
      </div>
    </section>
  );
}
