import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * RadialCountdown — Sidewave-style ring that animates from full to empty.
 * Switches stroke to celebrate-red and pulses when seconds <= warnAt.
 */
export function RadialCountdown({
  seconds,
  total = 90,
  size = 280,
  stroke = 6,
  warnAt = 15,
  children,
  className,
}: {
  seconds: number;
  total?: number;
  size?: number;
  stroke?: number;
  warnAt?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, seconds / total));
  const dashOffset = circumference * (1 - pct);
  const warn = seconds <= warnAt;
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!warn) return;
    const id = setInterval(() => setPulse((p) => !p), 700);
    return () => clearInterval(id);
  }, [warn]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(245, 232, 216, 0.15)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={warn ? "var(--color-celebrate)" : "var(--color-health)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 320ms ease",
            filter: warn && pulse ? "drop-shadow(0 0 12px var(--color-celebrate))" : "none",
          }}
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">{children}</div>
    </div>
  );
}
