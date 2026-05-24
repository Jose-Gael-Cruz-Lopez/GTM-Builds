import { useEffect, useRef } from "react";
import { cloudItems, type CloudItem } from "@/lib/landing-assets";

export function FloatingCloud() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" && "matchMedia" in window
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
    if (reduced) return;

    let raf = 0;
    let pending = false;
    let mx = 0;
    let my = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1..1
      my = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (!pending) {
        pending = true;
        raf = window.requestAnimationFrame(() => {
          el.style.setProperty("--mx", mx.toFixed(3));
          el.style.setProperty("--my", my.toFixed(3));
          pending = false;
        });
      }
    };

    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        // initialize parallax CSS vars
        // @ts-expect-error css vars
        "--mx": 0,
        "--my": 0,
      }}
    >
      {cloudItems.map((item, i) => (
        <CloudImage key={item.id} item={item} eager={i < 6} />
      ))}
    </div>
  );
}

function CloudImage({ item, eager }: { item: CloudItem; eager: boolean }) {
  const parallaxPx = item.parallax * 18;
  return (
    <span
      className="absolute block"
      style={{
        top: item.top,
        left: item.left,
        width: item.w,
        height: item.h,
        transform: `translate(-50%, -50%) translate(calc(var(--mx, 0) * ${parallaxPx}px), calc(var(--my, 0) * ${parallaxPx}px))`,
        willChange: "transform",
        transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <img
        src={item.src}
        alt=""
        width={item.w}
        height={item.h}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="cloud-item block"
        style={{
          width: "100%",
          height: "100%",
          opacity: 0.85,
          // @ts-expect-error css vars
          "--dx": `${item.dx}px`,
          "--dy": `${item.dy}px`,
          "--rot": `${item.rot}deg`,
          "--drift-dur": `${item.driftSeconds}s`,
          "--drift-delay": `${item.driftDelay}s`,
          transformOrigin: "center",
        }}
      />
    </span>
  );
}
