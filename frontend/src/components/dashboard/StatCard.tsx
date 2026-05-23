export type StatCardTone = "default" | "success" | "warning" | "brand";

export interface StatCardProps {
  title: string;
  value: number | string;
  tone?: StatCardTone;
  hint?: string;
}

const TONE_CLASS: Record<StatCardTone, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  brand: "text-[var(--primary)]",
};

export function Card({ title, value, tone = "default", hint }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="text-sm muted-text">{title}</div>
      <div className={`mt-2 font-display text-3xl font-bold ${TONE_CLASS[tone]}`}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs muted-text">{hint}</div> : null}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-muted/30" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted/30" />
    </div>
  );
}
