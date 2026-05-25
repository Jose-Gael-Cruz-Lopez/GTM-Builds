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
  const words = text.split(" ");
  if (words.length <= 6) return [text];
  if (words.length <= 10) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }
  const a = Math.ceil(words.length / 3);
  const b = Math.ceil((words.length * 2) / 3);
  return [words.slice(0, a).join(" "), words.slice(a, b).join(" "), words.slice(b).join(" ")];
}

export function ScrollStackPanel({
  panel,
  panelIndex,
  panelCount,
  isLast = false,
}: {
  panel: UseCasePanel;
  panelIndex: number;
  panelCount: number;
  isLast?: boolean;
}) {
  const { ref: revealRef } = useRevealOnce<HTMLDivElement>({ threshold: 0.35 });
  const lines = splitHeadlineIntoLines(panel.headline);

  const contentZIndex = panelCount - panelIndex + 100;

  return (
    <>
      <div
        className="scroll-stack-panel-bg-outer"
        data-panel-index={panelIndex}
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          overflow: "hidden",
          zIndex: panelIndex + 1,
        }}
      >
        <div className="scroll-stack-panel-bg-slide">
          <div className="scroll-stack-panel-bg" aria-hidden="true">
            <div className="scroll-stack-panel-bg-image ken-burns">
              <img
                src={panel.bgImage}
                alt=""
                width={1600}
                height={1000}
                loading={panelIndex <= 1 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
            <div className="scroll-stack-panel-bg-veil" />
            <div className="scroll-stack-panel-bg-veil-bottom" />
          </div>
        </div>
      </div>

      <div
        className="scroll-stack-panel-content-outer"
        data-panel-index={panelIndex}
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          marginTop: "-100svh",
          zIndex: contentZIndex,
          pointerEvents: "none",
        }}
      >
        <div ref={revealRef} className="scroll-stack-panel-content">
          <div className="scroll-stack-hairline scroll-stack-meta" aria-hidden="true" />

          <div className="scroll-stack-index-cluster scroll-stack-meta">
            <div className="scroll-stack-eyebrow">Hecho para volver</div>
            <div className="scroll-stack-index">{panel.index}</div>
            <div
              className="scroll-stack-chip inline-flex items-center gap-1.5"
              style={{ background: CHIP_BG[panel.chipTone] }}
            >
              <img src={panel.iconSvg} alt="" width={14} height={14} aria-hidden="true" />
              {panel.chipLabel}
            </div>
          </div>

          <div className="scroll-stack-headline-block scroll-stack-headline-layer">
            <h2 className="scroll-stack-headline font-display">
              {lines.map((line, i) => (
                <span key={i} className="rise-mask block">
                  <span className="rise-line">{line}</span>
                </span>
              ))}
            </h2>

            <div
              className="soft-rise delay-1 inline-flex items-center"
              style={{ marginTop: "2rem" }}
            >
              <a href={panel.ctaHref} className="scroll-stack-cta" aria-label={panel.ctaLabel}>
                <span className="scroll-stack-cta-icon" aria-hidden="true">
                  <img src={panel.iconSvg} alt="" width={26} height={26} />
                </span>
                <span className="scroll-stack-cta-label">{panel.ctaLabel}</span>
              </a>
            </div>
          </div>

          {panel.pdfCard && (
            <a
              href={panel.pdfCard.href}
              download
              className="scroll-stack-pdf scroll-stack-headline-layer soft-rise delay-2"
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="scroll-stack-pdf-title">{panel.pdfCard.title}</div>
                <div className="scroll-stack-pdf-link">
                  Descargar <span aria-hidden="true">↓</span>
                </div>
              </div>
              <div
                className="scroll-stack-pdf-icon"
                style={{
                  background: `color-mix(in oklab, ${CHIP_BG[panel.chipTone]} 32%, #ffffff 68%)`,
                }}
                aria-hidden="true"
              >
                <img src={panel.pdfCard.miniSvg} alt="" width={36} height={36} />
              </div>
            </a>
          )}

          {!isLast && (
            <div className="scroll-stack-wayfinder scroll-stack-headline-layer">
              <ScrollToExplore tone="light" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
