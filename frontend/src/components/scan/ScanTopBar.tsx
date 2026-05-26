import { ArrowLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

interface ScanTopBarProps {
  businessName: string;
  settingsHref?: string;
  onSettingsClick?: () => void;
  backHref?: string;
  className?: string;
}

export function ScanTopBar({
  businessName,
  settingsHref,
  onSettingsClick,
  backHref,
  className,
}: ScanTopBarProps) {
  const { d } = useLocale();
  const iconButtonClass = cn(
    "inline-flex h-14 min-w-14 items-center justify-center rounded-[var(--radius-sm)]",
    "text-[color:var(--color-scanner-warm)] transition-colors",
    "hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-signal)]",
  );

  return (
    <header className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3", className)}>
      <div className="flex items-center">
        {backHref ? (
          <a href={backHref} className={iconButtonClass} aria-label="Volver al dashboard">
            <ArrowLeft className="h-6 w-6" aria-hidden />
          </a>
        ) : (
          <span className="font-display text-sm font-semibold tracking-tight text-[color:var(--color-cream)]">
            NexoLeal
          </span>
        )}
      </div>

      <p
        className="truncate text-center text-sm text-[color:var(--color-scanner-warm)]"
        title={businessName}
      >
        {businessName}
      </p>

      <div className="flex justify-end">
        {settingsHref ? (
          <a href={settingsHref} className={iconButtonClass} aria-label={d.scan.settingsLabel}>
            <Settings className="h-6 w-6" aria-hidden />
          </a>
        ) : (
          <button
            type="button"
            className={iconButtonClass}
            aria-label={d.scan.staffKeyLabel}
            onClick={onSettingsClick}
          >
            <Settings className="h-6 w-6" aria-hidden />
          </button>
        )}
      </div>
    </header>
  );
}
