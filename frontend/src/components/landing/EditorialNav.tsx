import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const NAV_LINKS = [
  { label: "Producto", href: "#producto" },
  { label: "Casos", href: "#casos" },
  { label: "Precios", href: "#precios" },
  { label: "Diario", href: "#diario" },
];

export function EditorialNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 80);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50" style={{ padding: "1.25rem 1.5rem" }}>
        <nav className="flex items-center justify-between" aria-label="Principal">
          {/* Left cluster: wordmark + lang chip */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-baseline gap-0.5 font-display"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "1.5rem",
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              NexoLeal
              <sup style={{ fontSize: "0.65rem", marginLeft: "1px" }}>®</sup>
            </Link>
            <span
              aria-hidden="true"
              className="hidden sm:block"
              style={{
                width: "1px",
                height: "20px",
                background: "var(--hair)",
              }}
            />
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                padding: "0.25rem 0.5rem",
              }}
              aria-label="Idioma"
            >
              ES <span aria-hidden="true">▾</span>
            </button>
          </div>

          {/* Center cluster: link pill (desktop only) */}
          <div
            className="hidden md:flex items-center"
            style={{
              background: scrolled ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--hair)",
              borderRadius: "9999px",
              boxShadow: scrolled
                ? "0 4px 16px -8px rgba(0, 0, 0, 0.18)"
                : "0 1px 0 rgba(0, 0, 0, 0.04)",
              padding: "0.25rem",
              transition: "background 220ms, box-shadow 220ms",
            }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full focus:outline-none focus-visible:ring-2"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  padding: "0.5rem 1rem",
                  transition: "background 180ms, color 180ms",
                  // @ts-expect-error css var
                  "--tw-ring-color": "var(--ink)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--ink)";
                  e.currentTarget.style.color = "var(--paper)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--ink)";
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right cluster: lang dropdown (desktop) + mobile menu trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden md:inline-flex items-center gap-1"
              style={{
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--hair)",
                borderRadius: "9999px",
                padding: "0.5rem 0.875rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink)",
              }}
              aria-label="Cambiar idioma"
            >
              EN <span aria-hidden="true">▾</span>
            </button>
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.92)",
                border: "1px solid var(--hair)",
                color: "var(--ink)",
              }}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                {mobileOpen ? (
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <path
                      d="M3 7h14M3 13h14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "var(--paper)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Menú móvil"
        >
          <div className="flex flex-col h-full" style={{ padding: "5.5rem 1.5rem 2rem" }}>
            <nav className="flex flex-col gap-4" aria-label="Móvil">
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rise-mask"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: "var(--display-lg)",
                    lineHeight: 0.95,
                    color: "var(--ink)",
                    letterSpacing: "-0.025em",
                    animation: `line-rise 700ms ${i * 80}ms var(--ease-editorial) backwards`,
                  }}
                >
                  <span className="rise-line" style={{ animationDelay: `${i * 80}ms` }}>
                    {link.label}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
