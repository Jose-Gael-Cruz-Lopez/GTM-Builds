import { useEffect, useRef } from "react";
import { useCasePanels } from "@/lib/landing-assets";
import { ScrollStackPanel } from "./ScrollStackPanel";

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function ScrollStack() {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const dotsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let pending = false;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = Math.max(1, el.offsetHeight - vh);
      const scrolled = Math.max(0, Math.min(total, -rect.top));
      const panelCount = useCasePanels.length;
      const stackVisible = rect.top < vh;
      const stackPinned = rect.top <= 0;

      const rawEnters = Array.from({ length: panelCount }, (_, i) => {
        if (!stackPinned) return i === 0 ? 1 : 0;
        if (i === 0) return 1;
        return Math.max(0, Math.min(1, (scrolled - (i - 1) * vh) / vh));
      });

      const wipeEnters = rawEnters.map((raw, i) =>
        i === 0 ? 1 : reducedMotion ? (raw >= 1 ? 1 : 0) : easeOutQuart(raw),
      );

      let idx = 0;
      for (let i = panelCount - 1; i >= 0; i -= 1) {
        if (rawEnters[i] >= 0.999) {
          idx = i;
          break;
        }
      }

      if (dotsRef.current) {
        const dots = dotsRef.current.querySelectorAll("span");
        dots.forEach((dot, i) => {
          dot.classList.toggle("is-active", i === idx);
        });
      }

      for (let i = 0; i < panelCount; i += 1) {
        const bgEl = el.querySelector<HTMLElement>(
          `.scroll-stack-panel-bg-outer[data-panel-index="${i}"]`,
        );
        const contentEl = el.querySelector<HTMLElement>(
          `.scroll-stack-panel-content-outer[data-panel-index="${i}"]`,
        );
        if (!bgEl || !contentEl) continue;

        const bgSlide = bgEl.querySelector<HTMLElement>(".scroll-stack-panel-bg-slide");
        const bgImage = bgEl.querySelector<HTMLElement>(".scroll-stack-panel-bg-image");

        if (!stackVisible) {
          if (bgSlide) bgSlide.style.transform = "translate3d(0, 100%, 0)";
          if (bgImage) bgImage.style.transform = "scale(1.04)";
          bgEl.style.filter = "none";
          contentEl.style.setProperty("--meta-opacity", "0");
          contentEl.style.setProperty("--headline-opacity", "0");
          contentEl.style.pointerEvents = "none";
          continue;
        }

        const wipe = stackPinned ? (wipeEnters[i] ?? 0) : i === 0 ? 1 : 0;
        const nextWipe = stackPinned && i < panelCount - 1 ? (wipeEnters[i + 1] ?? 0) : 0;
        const nextRaw = stackPinned && i < panelCount - 1 ? (rawEnters[i + 1] ?? 0) : 0;

        if (bgSlide) {
          if (i === 0) {
            bgSlide.style.transform = "translate3d(0, 0, 0)";
          } else if (!stackPinned) {
            bgSlide.style.transform = "translate3d(0, 100%, 0)";
          } else {
            bgSlide.style.transform = reducedMotion
              ? wipe >= 1
                ? "translate3d(0, 0, 0)"
                : "translate3d(0, 100%, 0)"
              : `translate3d(0, ${(1 - wipe) * 100}%, 0)`;
          }
        }

        if (stackPinned && i < panelCount - 1 && nextRaw > 0) {
          bgEl.style.filter = `brightness(${1 - nextRaw * 0.28})`;
        } else {
          bgEl.style.filter = "none";
        }

        if (bgImage) {
          const scale = stackPinned ? 1.04 - wipe * 0.04 : i === 0 ? 1 : 1.04;
          bgImage.style.transform = reducedMotion ? "none" : `scale(${scale})`;
        }

        const metaEnter = i === 0 ? 1 : smoothstep(0.1, 0.42, wipe);
        const metaExit = i < panelCount - 1 ? 1 - smoothstep(0.62, 0.96, nextWipe) : 1;
        const metaOpacity = Math.max(0, Math.min(1, metaEnter * metaExit));

        const headEnter = i === 0 ? 1 : smoothstep(0.55, 0.9, wipe);
        const headExit = i < panelCount - 1 ? 1 - smoothstep(0.62, 0.96, nextWipe) : 1;
        const headlineOpacity = Math.max(0, Math.min(1, headEnter * headExit));

        contentEl.style.setProperty("--meta-opacity", String(metaOpacity));
        contentEl.style.setProperty("--headline-opacity", String(headlineOpacity));
        contentEl.style.pointerEvents =
          headlineOpacity > 0.35 || metaOpacity > 0.35 ? "auto" : "none";
      }

      pending = false;
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      aria-label="Casos de uso de NexoLeal"
      id="casos"
      className="scroll-stack"
      style={{ height: `${useCasePanels.length * 100}svh` }}
    >
      {useCasePanels.map((panel, i) => (
        <ScrollStackPanel
          key={panel.index}
          panel={panel}
          panelIndex={i}
          panelCount={useCasePanels.length}
          isLast={i === useCasePanels.length - 1}
        />
      ))}

      <div ref={dotsRef} className="scroll-stack-dots" aria-hidden="true">
        {useCasePanels.map((_, i) => (
          <span key={i} className={i === 0 ? "is-active" : undefined} />
        ))}
      </div>
    </section>
  );
}
