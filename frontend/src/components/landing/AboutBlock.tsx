import { useRevealOnce } from "@/hooks/use-reveal-once";
import { useLocale } from "@/contexts/LocaleContext";

export function AboutBlock() {
  const { ref } = useRevealOnce<HTMLDivElement>({ threshold: 0.25 });
  const { d } = useLocale();
  const { howItWorks } = d.landing;

  return (
    <section
      id="producto"
      aria-label={d.landing.aboutAriaLabel}
      style={{
        background: "var(--paper)",
        padding: "clamp(4rem, 10vw, 9rem) clamp(1.5rem, 5vw, 5rem) clamp(4rem, 8vw, 7rem)",
      }}
    >
      <div ref={ref} className="mx-auto" style={{ maxWidth: "min(960px, 92vw)" }}>
        <span
          className="soft-rise"
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
            marginBottom: "1.25rem",
          }}
        >
          {howItWorks.eyebrow}
        </span>

        <h2
          className="font-display soft-rise"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "var(--display-lg)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            maxWidth: "22ch",
            margin: 0,
          }}
        >
          {howItWorks.title}
        </h2>

        <p
          className="soft-rise delay-1"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1.0625rem",
            lineHeight: 1.6,
            color: "var(--ink-soft)",
            maxWidth: "52ch",
            margin: "1.5rem 0 0",
          }}
        >
          {howItWorks.subtitle}
        </p>

        <ol
          className="grid gap-6 md:grid-cols-3"
          style={{ marginTop: "3rem", listStyle: "none", padding: 0 }}
        >
          {howItWorks.steps.map((step, index) => (
            <li
              key={step.title}
              className={`soft-rise ${index === 0 ? "" : index === 1 ? "delay-1" : "delay-2"}`}
              style={{
                background: "var(--paper-warm)",
                border: "1px solid var(--hair)",
                borderRadius: "18px",
                padding: "1.5rem 1.375rem 1.625rem",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "1.75rem",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "var(--ink-soft)",
                  opacity: 0.35,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "1.125rem",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  margin: "0.75rem 0 0",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.55,
                  color: "var(--ink-soft)",
                  margin: "0.625rem 0 0",
                }}
              >
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
