import { useRevealOnce } from "@/hooks/use-reveal-once";
import { useLocale } from "@/contexts/LocaleContext";

type Showcase = {
  chipLabel: string;
  chipTone: "coral" | "sage";
  name: string;
  visual: string;
  visualAlt: string;
  swatches: string[];
  extra: number;
  href: string;
};

const CHIP_BG = {
  coral: "var(--chip-coral)",
  sage: "var(--chip-sage)",
};

export function RecentAddings() {
  const { d } = useLocale();

  const SHOWCASES: Showcase[] = [
    {
      chipLabel: d.landing.showcases.cafeteria.chipLabel,
      chipTone: "coral",
      name: d.landing.showcases.cafeteria.name,
      visual: "/landing/cloud/loyalty-card.svg",
      visualAlt: "Tarjeta de sellos NexoLeal",
      swatches: ["#f5e8d8", "#1a1a18", "#f5c518", "#e7f26a"],
      extra: 4,
      href: "/wallet/demo",
    },
    {
      chipLabel: d.landing.showcases.retail.chipLabel,
      chipTone: "sage",
      name: d.landing.showcases.retail.name,
      visual: "/landing/cloud/qr-code.svg",
      visualAlt: "QR de mostrador NexoLeal",
      swatches: ["#f0ede6", "#1a1a18", "#c9d9b8", "#e2b79a"],
      extra: 3,
      href: "/join/demo",
    },
  ];

  return (
    <section
      id="precios"
      aria-label={d.landing.recentAddingsAriaLabel}
      style={{
        background: "var(--paper)",
        padding: "clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 5rem) clamp(4rem, 8vw, 7rem)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "min(1280px, 92vw)" }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
            marginBottom: "2rem",
          }}
        >
          {d.landing.recentAddingsAriaLabel} <span aria-hidden="true">↓</span>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
            gap: "clamp(1.5rem, 4vw, 3rem)",
          }}
        >
          {SHOWCASES.map((s) => (
            <ShowcaseTile
              key={s.name}
              {...s}
              colorsLabel={d.landing.colors}
              exploreLabel={d.landing.explore}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseTile(props: Showcase & { colorsLabel: string; exploreLabel: string }) {
  const { ref } = useRevealOnce<HTMLDivElement>({ threshold: 0.2 });
  return (
    <div ref={ref}>
      {/* Top row: chip + name */}
      <div
        className="soft-rise"
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}
      >
        <span
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--hair)",
            padding: "0.3rem 0.75rem",
            borderRadius: "9999px",
            fontFamily: "var(--font-sans)",
            fontSize: "0.7rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "9999px",
              background: CHIP_BG[props.chipTone],
              display: "inline-block",
            }}
          />
          {props.chipLabel}
        </span>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "1.125rem",
            letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}
        >
          {props.name}
        </div>
      </div>

      {/* Featured visual tile */}
      <div
        className="soft-rise delay-1 flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, var(--paper-warm) 0%, var(--paper) 100%)",
          borderRadius: "24px",
          aspectRatio: "4 / 3",
          padding: "2rem",
          position: "relative",
          boxShadow: "0 1px 0 var(--hair), 0 24px 60px -32px rgba(26, 26, 24, 0.18)",
        }}
      >
        <img
          src={props.visual}
          alt={props.visualAlt}
          width={360}
          height={270}
          loading="lazy"
          decoding="async"
          style={{
            width: "min(60%, 360px)",
            height: "auto",
            display: "block",
          }}
        />
      </div>

      {/* Bottom row: swatches + CTA */}
      <div
        className="soft-rise delay-2 flex flex-wrap items-end justify-between gap-4"
        style={{ marginTop: "1.25rem" }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.7rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "0.5rem",
            }}
          >
            {props.colorsLabel}
          </div>
          <div className="flex items-center gap-2">
            {props.swatches.map((c) => (
              <span
                key={c}
                aria-label={c}
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: "9999px",
                  background: c,
                  border: "1px solid var(--hair)",
                }}
              />
            ))}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.7rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                padding: "0.25rem 0.5rem",
                border: "1px solid var(--hair)",
                borderRadius: "9999px",
              }}
            >
              +{props.extra}
            </span>
          </div>
        </div>
        <a
          href={props.href}
          className="inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            padding: "0.625rem 1.25rem",
            borderRadius: "9999px",
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textDecoration: "none",
            // @ts-expect-error css var
            "--tw-ring-color": "var(--ink)",
          }}
        >
          {props.exploreLabel} <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
