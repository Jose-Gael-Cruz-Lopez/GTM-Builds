import { useMemo } from "react";
import { tokens } from "@/lib/theme";
import { prefersReducedMotion } from "@/lib/prefers-reduced-motion";

/** La Revoltosa-style bubbles — panel-scoped only, not full-screen. */
export function RewardParticles() {
  const reduced = prefersReducedMotion();

  const bubbles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 17) % 84)}%`,
        size: 6 + (i % 4) * 4,
        delay: (i % 5) * 0.15,
        duration: 1.8 + (i % 3) * 0.4,
      })),
    [],
  );

  if (reduced) {
    return (
      <div
        className="pointer-events-none absolute inset-0 bg-[color:var(--color-celebrate)]/15 animate-[fade-celebrate_200ms_ease-out_forwards]"
        aria-hidden
      />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute bottom-0 rounded-full opacity-70 animate-[scan-bubble-rise_var(--dur)_ease-out_var(--delay)_forwards]"
          style={
            {
              left: b.left,
              width: b.size,
              height: b.size,
              background:
                b.id % 3 === 0
                  ? tokens.color.celebrate
                  : b.id % 3 === 1
                    ? tokens.color.scannerWarm
                    : tokens.color.signal,
              "--dur": `${b.duration}s`,
              "--delay": `${b.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
