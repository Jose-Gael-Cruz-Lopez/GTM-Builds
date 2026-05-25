import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";
import { Sparkline } from "@/components/dashboard/Sparkline";

export interface KpiTileProps {
  title: string;
  value: string | number;
  href?: string;
  delta?: number | null;
  deltaLabel?: string;
  healthChip?: boolean;
  healthLabel?: string;
  sparklineData?: number[];
  statusTone?: "good" | "warn" | "risk" | "health" | "neutral";
  isLoading?: boolean;
}

export function KpiTile({
  title,
  value,
  href,
  delta,
  deltaLabel,
  healthChip,
  healthLabel = "Saludable",
  sparklineData,
  statusTone = "neutral",
  isLoading = false,
}: KpiTileProps) {
  const prevValue = useRef<string | number | null>(null);
  const [valuePulse, setValuePulse] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (prevValue.current !== null && prevValue.current !== value) {
      setValuePulse(true);
      const timer = window.setTimeout(() => setValuePulse(false), 500);
      prevValue.current = value;
      return () => window.clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value, isLoading]);

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-[color:var(--color-ink-soft)]">
          <StatusDot tone={statusTone} />
          {title}
        </div>
        {healthChip ? (
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[color-mix(in_srgb,var(--color-health)_22%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink)]">
            <StatusDot tone="health" />
            {healthLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          {isLoading ? (
            <div className="flex h-9 items-center">
              <Loader2
                className="h-6 w-6 animate-spin text-[color:var(--color-ink-soft)]"
                aria-label="Cargando"
              />
            </div>
          ) : (
            <p
              key={String(value)}
              className={cn(
                "font-display text-3xl font-bold tabular-nums text-[color:var(--color-ink)] transition-opacity duration-500",
                valuePulse && "opacity-60",
              )}
            >
              {value}
            </p>
          )}
          {delta !== undefined && delta !== null ? (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                delta >= 0
                  ? "text-[color:var(--color-status-good)]"
                  : "text-[color:var(--color-status-risk)]",
              )}
            >
              {delta >= 0 ? (
                <ArrowUp className="h-3 w-3" aria-hidden />
              ) : (
                <ArrowDown className="h-3 w-3" aria-hidden />
              )}
              {Math.abs(delta)}% {deltaLabel ?? "vs ayer"}
            </p>
          ) : null}
        </div>
        {sparklineData && sparklineData.length > 1 ? (
          <Sparkline data={sparklineData} className="h-10 w-20" />
        ) : null}
      </div>
    </>
  );

  const className =
    "surface-paper block p-5 transition-transform duration-[var(--duration)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lifted)]";

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function KpiTileSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-cream)] p-5 shadow-[var(--shadow-soft)]">
      <div className="h-3 w-28 shimmer rounded" />
      <div className="mt-4 h-9 w-20 shimmer rounded" />
      <div className="mt-2 h-3 w-16 shimmer rounded" />
    </div>
  );
}
