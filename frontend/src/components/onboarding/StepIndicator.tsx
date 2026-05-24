import { Sparkles, QrCode, Megaphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "brand" | "reward" | "finish";

const STEPS: Array<{ key: Step; icon: typeof Sparkles; label: string }> = [
  { key: "brand", icon: Sparkles, label: "Marca" },
  { key: "reward", icon: QrCode, label: "Recompensa" },
  { key: "finish", icon: Megaphone, label: "Compartir" },
];

interface StepIndicatorProps {
  current: Step;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Progreso del onboarding" className="mt-10">
      <ol className="flex items-start justify-center">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;

          return (
            <li key={step.key} className="flex items-start">
              {i > 0 && (
                <div
                  aria-hidden
                  className={cn(
                    "mt-6 h-0.5 w-10 sm:w-16",
                    i <= currentIdx ? "bg-[var(--color-ink)]" : "bg-[var(--border)]",
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-2 px-1">
                <div
                  className={cn(
                    "relative grid h-12 w-12 place-items-center rounded-full border-2 transition-all duration-300",
                    isDone &&
                      "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-cream)]",
                    isActive &&
                      "border-[var(--color-signal)] bg-[var(--color-cream)] text-[var(--color-ink)] shadow-[var(--shadow-soft)]",
                    !isDone &&
                      !isActive &&
                      "border-[var(--border)] bg-[var(--surface)] text-[color:var(--color-ink-soft)]",
                    isActive && "animate-[step-dot-pulse_2.4s_ease-in-out_infinite]",
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden />
                  )}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full border-2 border-[var(--color-signal)] opacity-40 animate-[step-dot-pulse_2.4s_ease-in-out_infinite]"
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive
                      ? "text-[color:var(--color-ink)]"
                      : "text-[color:var(--color-ink-soft)]",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <style>{`
        @keyframes step-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.15; }
        }
      `}</style>
    </nav>
  );
}

export { STEPS as ONBOARDING_STEPS };
export type { Step as OnboardingStep };
