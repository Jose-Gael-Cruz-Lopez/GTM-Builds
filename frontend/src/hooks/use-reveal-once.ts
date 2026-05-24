import { useEffect, useRef, useState } from "react";

type Options = {
  threshold?: number;
  rootMargin?: string;
};

/**
 * One-shot intersection reveal hook for the editorial landing.
 * Sets `data-revealed="true"` on the referenced element the first time it
 * intersects, then disconnects. Respects prefers-reduced-motion: if reduced,
 * reveals immediately on mount without observing.
 */
export function useRevealOnce<T extends HTMLElement>(opts: Options = {}) {
  const { threshold = 0.2, rootMargin = "0px 0px -10% 0px" } = opts;
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reducedQuery =
      typeof window !== "undefined" && "matchMedia" in window
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    if (reducedQuery?.matches) {
      el.setAttribute("data-revealed", "true");
      setRevealed(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-revealed", "true");
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute("data-revealed", "true");
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, revealed };
}
