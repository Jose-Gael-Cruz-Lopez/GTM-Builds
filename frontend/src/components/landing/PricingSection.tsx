import { Link } from "@tanstack/react-router";
import { useRevealOnce } from "@/hooks/use-reveal-once";
import { useLocale } from "@/contexts/LocaleContext";

export function PricingSection() {
  const { ref } = useRevealOnce<HTMLDivElement>({ threshold: 0.2 });
  const { d } = useLocale();
  const { pricing } = d.landing;

  const plans = [pricing.free, pricing.pro];

  return (
    <section
      id="precios"
      aria-label={pricing.ariaLabel}
      style={{
        background: "var(--paper)",
        padding: "clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 5rem) clamp(4rem, 8vw, 7rem)",
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
          {pricing.eyebrow}
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
            maxWidth: "20ch",
            margin: 0,
          }}
        >
          {pricing.title}
        </h2>

        <div className="grid gap-6 md:grid-cols-2" style={{ marginTop: "2.5rem" }}>
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`soft-rise ${index === 0 ? "delay-1" : "delay-2"}`}
              style={{
                background: plan.highlighted ? "var(--ink)" : "var(--paper-warm)",
                color: plan.highlighted ? "var(--paper)" : "var(--ink)",
                border: plan.highlighted ? "1.5px solid var(--ink)" : "1px solid var(--hair)",
                borderRadius: "20px",
                padding: "1.75rem 1.5rem 1.625rem",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  opacity: plan.highlighted ? 0.7 : 1,
                  color: plan.highlighted ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "2.25rem",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  marginTop: "0.75rem",
                }}
              >
                {plan.price}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.5,
                  marginTop: "0.75rem",
                  opacity: plan.highlighted ? 0.75 : 1,
                  color: plan.highlighted ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {plan.desc}
              </p>
              <ul
                style={{
                  margin: "1.25rem 0 0",
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  flex: 1,
                }}
              >
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.875rem",
                      lineHeight: 1.45,
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <span aria-hidden="true" style={{ opacity: 0.5 }}>
                      ·
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1.5rem",
                  background: plan.highlighted ? "var(--paper)" : "var(--ink)",
                  color: plan.highlighted ? "var(--ink)" : "var(--paper)",
                  padding: "0.875rem 1.5rem",
                  borderRadius: "9999px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  border: plan.highlighted ? "1.5px solid var(--paper)" : "1.5px solid var(--ink)",
                  textDecoration: "none",
                  // @ts-expect-error css var
                  "--tw-ring-color": "var(--ink)",
                }}
              >
                {pricing.cta}
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
