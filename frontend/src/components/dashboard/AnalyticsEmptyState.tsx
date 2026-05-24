import { NotFoundGlyph } from '@/components/ui/iso-scene'
import { cn } from '@/lib/utils'

interface AnalyticsEmptyStateProps {
  title?: string
  description?: string
  className?: string
}

export function AnalyticsEmptyState({
  title = 'Aún no tenemos suficientes datos',
  description = 'Comparte tu enlace con clientes y vuelve pronto para ver tendencias y patrones.',
  className,
}: AnalyticsEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-cream)] px-6 py-12 text-center',
        className,
      )}
    >
      <div className="scale-90 opacity-90">
        <NotFoundGlyph />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-[color:var(--color-ink)]">
          {title}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-[color:var(--color-ink-soft)]">
          {description}
        </p>
      </div>
    </div>
  )
}

export function AnalyticsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-cream)] p-5 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      <div className="h-4 w-32 shimmer rounded" />
      <div className="mt-4 h-48 shimmer rounded-[var(--radius)]" />
    </div>
  )
}
