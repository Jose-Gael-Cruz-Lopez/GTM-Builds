import { ScrollToExplore } from "./ScrollToExplore";
import { useRevealOnce } from "@/hooks/use-reveal-once";
import type { UseCasePanel } from "@/lib/landing-assets";

const CHIP_BG: Record<UseCasePanel["chipTone"], string> = {
  coral: "var(--chip-coral)",
  sage: "var(--chip-sage)",
  clay: "var(--chip-clay)",
  mist: "var(--chip-mist)",
  stone: "var(--chip-stone)",
};

function splitHeadlineIntoLines(text: string): string[] {
  // Roughly split a long headline into 2-3 visual lines by word count.
  const words = text.split(" ");
  if (words.length <= 6) return [text];
  if (words.length <= 10) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }
  const a = Math.ceil(words.length / 3);
  const b = Math.ceil((words.length * 2) / 3);
  return [
    words.slice(0, a).join(" "),
    words.slice(a, b).join(" "),
    words.slice(b).join(" "),
  ];
}

export function ScrollStackPanel({
  panel,
  isLast = false,
}: {
  panel: UseCasePanel;
  isLast?: boolean;
}) {
  const { ref } = useRevealOnce<HTMLDivElement>({ threshold: 0.35 });
  const lines = splitHeadlineIntoLines(panel.headline);

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "100svh", position: "sticky", top: 0 }}
    >
      <div ref={ref} className="absolute inset-0">
        {/* Background image with ken-burns settle */}
        <div className="absolute inset-0 ken-burns" style={{ overflow: "hidden" }}>
          <img
            src={panel.bgImage}
            alt={panel.bgAlt}
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {/* Base veil for legibility */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: "var(--veil)" }}
        />

        {/* Lower legibility gradient */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(to bottom, transparent 38%, var(--veil-strong) 100%)",
          }}
        />

        {/* Veil clip-reveal layer (paper colored, animates clip-path) */}
        <div
          className="absolute inset-0 veil-layer pointer-events-none"
          aria-hidden="true"
          style={{ background: "var(--paper)", opacity: 0 }}
        />

        {/* Hairline divider at ~52% */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "52%",
            height: "1px",
            background: "rgba(255,255,255,0.45)",
          }}
        />

        {/* Lower-left index cluster */}
        <div
          className="absolute"
          style={{
            bottom: "38%",
            left: "clamp(1.5rem, 5vw, 5rem)",
            color: "rgba(255,255,255,0.92)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
              marginBottom: "0.5rem",
            }}
          >
            Hecho para volver
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              lineHeight: 1,
              marginBottom: "0.625rem",
            }}
          >
            {panel.index}
          </div>
          <div
            className="inline-flex items-center gap-1.5"
            style={{
              background: CHIP_BG[panel.chipTone],
              color: "var(--ink)",
              padding: "0.4rem 0.875rem",
              borderRadius: "9999px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.7rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            <img
              src={panel.iconSvg}
              alt=""
              width={14}
              height={14}
              style={{ display: "block" }}
              aria-hidden="true"
            />
            {panel.chipLabel}
          </div>
        </div>

        {/* Centered headline + CTA */}
        <div
          className="absolute left-1/2"
          style={{
            bottom: "16%",
            transform: "translateX(-50%)",
            width: "min(900px, 88vw)",
            textAlign: "center",
          }}
        >
          <h2
            className="font-display"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "var(--display-lg)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.96)",
              maxWidth: "22ch",
              margin: "0 auto",
              textWrap: "balance",
            }}
          >
            {lines.map((line, i) => (
              <span key={i} className="rise-mask block">
                <span className="rise-line">{line}</span>
              </span>
            ))}
          </h2>

          <div
            className="soft-rise delay-1 inline-flex items-center"
            style={{ marginTop: "2rem", gap: 0 }}
          >
            <a
              href={panel.ctaHref}
              className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                textDecoration: "none",
                // @ts-expect-error css var
                "--tw-ring-color": "var(--ink)",
                "--tw-ring-offset-color": "rgba(255,255,255,0.7)",
              }}
              aria-label={panel.ctaLabel}
            >
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "9999px",
                  background: "#ffffff",
                  border: "1px solid var(--ink)",
                  marginRight: "-12px",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <img
                  src={panel.iconSvg}
                  alt=""
                  width={26}
                  height={26}
                  style={{ display: "block" }}
                />
              </span>
              <span
                style={{
                  height: "56px",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 1.75rem 0 1.5rem",
                  borderRadius: "9999px",
                  background: "#ffffff",
                  color: "var(--ink)",
                  border: "1px solid var(--hair)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {panel.ctaLabel}
              </span>
            </a>
          </div>
        </div>

        {/* Bottom-right PDF card */}
        {panel.pdfCard && (
          <a
            href={panel.pdfCard.href}
            download
            className="absolute soft-rise delay-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              bottom: "1.5rem",
              right: "1.5rem",
              background: "#ffffff",
              borderRadius: "18px",
              padding: "1.125rem 1.25rem",
              width: "min(18rem, 80vw)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              boxShadow: "0 14px 40px -20px rgba(0,0,0,0.4)",
              color: "var(--ink)",
              textDecoration: "none",
              // @ts-expect-error css var
              "--tw-ring-color": "var(--ink)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "1.0625rem",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                {panel.pdfCard.title}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.75rem",
                  color: "var(--ink-soft)",
                  marginTop: "0.5rem",
                }}
              >
                Descargar <span aria-hidden="true">↓</span>
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                background: `color-mix(in oklab, ${CHIP_BG[panel.chipTone]} 32%, #ffffff 68%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <img src={panel.pdfCard.miniSvg} alt="" width={36} height={36} />
            </div>
          </a>
        )}

        {/* Scroll wayfinder (hidden on last panel) */}
        {!isLast && (
          <div
            className="absolute"
            style={{
              bottom: "1.5rem",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <ScrollToExplore tone="light" />
          </div>
        )}
      </div>
    </div>
  );
}
