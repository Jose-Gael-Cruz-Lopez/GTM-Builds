import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
}

export function Sparkline({ data, className }: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="var(--color-data-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
