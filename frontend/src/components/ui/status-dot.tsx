import { cn } from '@/lib/utils'

type Tone = 'good' | 'warn' | 'risk' | 'health' | 'neutral'

const toneClass: Record<Tone, string> = {
  good: 'bg-[var(--color-status-good)]',
  warn: 'bg-[var(--color-status-warn)]',
  risk: 'bg-[var(--color-status-risk)]',
  health: 'bg-[var(--color-health)]',
  neutral: 'bg-[var(--color-ink-soft)]',
}

const toneLabel: Record<Tone, string> = {
  good: 'Estado: activo',
  warn: 'Estado: en riesgo',
  risk: 'Estado: perdido',
  health: 'Saludable',
  neutral: 'Neutral',
}

export function StatusDot({ tone = 'neutral', className, label }: { tone?: Tone; className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <span className={cn('inline-block h-2 w-2 rounded-full', toneClass[tone])} aria-hidden />
      <span className="sr-only">{label ?? toneLabel[tone]}</span>
    </span>
  )
}
