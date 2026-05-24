import { useEffect, useRef, useState } from "react";

/**
 * Returns scroll progress [0..1] through the referenced element.
 * 0 when the element's top sits at the viewport bottom; 1 when its bottom
 * reaches the viewport top. Uses a single rAF loop that runs only while the
 * element is on-screen (gated by IntersectionObserver).
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let onScreen = false;
    let rafId = 0;

    const compute = () => {
      if (!onScreen) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + vh;
      const raw = (vh - rect.top) / total;
      const clamped = Math.max(0, Math.min(1, raw));
      setProgress(clamped);
      rafId = window.requestAnimationFrame(compute);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!onScreen) {
              onScreen = true;
              rafId = window.requestAnimationFrame(compute);
            }
          } else {
            onScreen = false;
            if (rafId) {
              window.cancelAnimationFrame(rafId);
              rafId = 0;
            }
          }
        }
      },
      { threshold: [0, 0.01, 0.99, 1] },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return { ref, progress };
}
