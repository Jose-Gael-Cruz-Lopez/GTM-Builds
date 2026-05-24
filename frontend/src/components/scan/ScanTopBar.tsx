import { Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScanTopBarProps {
  businessName: string
  settingsHref?: string
  onSettingsClick?: () => void
  className?: string
}

export function ScanTopBar({
  businessName,
  settingsHref,
  onSettingsClick,
  className,
}: ScanTopBarProps) {
  const settingsClass = cn(
    "inline-flex h-14 min-w-14 items-center justify-center rounded-[var(--radius-sm)]",
    "text-[color:var(--color-scanner-warm)] transition-colors",
    "hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-signal)]",
  )

  return (
    <header
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3",
        className,
      )}
    >
      <span className="font-display text-sm font-semibold tracking-tight text-[color:var(--color-cream)]">
        NexoLeal
      </span>

      <p
        className="truncate text-center text-sm text-[color:var(--color-scanner-warm)]"
        title={businessName}
      >
        {businessName}
      </p>

      <div className="flex justify-end">
        {settingsHref ? (
          <a href={settingsHref} className={settingsClass} aria-label="Configuración">
            <Settings className="h-6 w-6" aria-hidden />
          </a>
        ) : (
          <button
            type="button"
            className={settingsClass}
            aria-label="Configurar llave de staff"
            onClick={onSettingsClick}
          >
            <Settings className="h-6 w-6" aria-hidden />
          </button>
        )}
      </div>
    </header>
  )
}
