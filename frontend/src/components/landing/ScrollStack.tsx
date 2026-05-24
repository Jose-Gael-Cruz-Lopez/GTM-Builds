import { useEffect, useRef, useState } from "react";
import { useCasePanels } from "@/lib/landing-assets";
import { ScrollStackPanel } from "./ScrollStackPanel";

export function ScrollStack() {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let raf = 0;
    let pending = false;

    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = window.requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // How far we've scrolled into the stack (0..1)
        const total = el.offsetHeight - vh;
        const scrolled = Math.max(0, Math.min(total, -rect.top));
        const idx = Math.min(
          useCasePanels.length - 1,
          Math.floor((scrolled / Math.max(1, total)) * useCasePanels.length),
        );
        setActiveIndex(idx);
        pending = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      aria-label="Casos de uso de NexoLeal"
      id="casos"
      style={{
        position: "relative",
        // 5 sticky panels × 100svh each
        height: `${useCasePanels.length * 100}svh`,
      }}
    >
      {useCasePanels.map((panel, i) => (
        <ScrollStackPanel
          key={panel.index}
          panel={panel}
          isLast={i === useCasePanels.length - 1}
        />
      ))}

      {/* Right-side panel indicator */}
      <div
        aria-hidden="true"
        className="hidden md:flex flex-col gap-2"
        style={{
          position: "fixed",
          right: "1.25rem",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        {useCasePanels.map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                height: "8px",
                width: isActive ? "20px" : "8px",
                borderRadius: "9999px",
                background: isActive
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.45)",
                transition: "all 280ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
