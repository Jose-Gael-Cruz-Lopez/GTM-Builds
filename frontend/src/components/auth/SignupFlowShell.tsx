import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useRevealOnce } from "@/hooks/use-reveal-once";
import { useLocale } from "@/contexts/LocaleContext";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

interface SignupFlowShellProps {
  stepKey: string;
  stepNumber: number;
  totalSteps: number;
  stepLabel: string;
  headline: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export function SignupFlowShell({
  stepKey,
  stepNumber,
  totalSteps,
  stepLabel,
  headline,
  subtitle,
  children,
  onBack,
  showBack,
}: SignupFlowShellProps) {
  const { d } = useLocale();
  const { ref, revealed } = useRevealOnce<HTMLElement>({ threshold: 0.08 });
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div data-surface="editorial" className="auth-flow">
      <div className="auth-flow-progress" aria-hidden>
        <span className="auth-flow-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <header className="auth-flow-header">
        <Link to="/" className="auth-flow-brand">
          <Sparkles className="h-4 w-4 text-[var(--signal-citrine)]" aria-hidden />
          NexoLeal
        </Link>
        <div className="flex items-center gap-3">
          <span className="auth-flow-counter">
            {String(stepNumber).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>
          <LocaleSwitcher variant="pill" />
        </div>
      </header>

      <main ref={ref} data-revealed={revealed} className="auth-flow-main">
        <div className="auth-flow-copy">
          <p className="auth-flow-eyebrow soft-rise">{stepLabel}</p>
          <h1 key={`${stepKey}-headline`} className="auth-flow-headline font-display">
            <span className="rise-mask block">
              <span className="rise-line">{headline}</span>
            </span>
          </h1>
          <p key={`${stepKey}-sub`} className="auth-flow-sub soft-rise delay-1">
            {subtitle}
          </p>
        </div>

        <div key={stepKey} className="auth-flow-panel soft-rise delay-2">
          {showBack && onBack ? (
            <button type="button" onClick={onBack} className="auth-flow-back">
              ← {d.common.back}
            </button>
          ) : null}
          {children}
        </div>
      </main>

      <footer className="auth-flow-footer">{d.authSplit.footer}</footer>
    </div>
  );
}
