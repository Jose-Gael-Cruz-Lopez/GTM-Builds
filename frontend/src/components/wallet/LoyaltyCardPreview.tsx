import { Sparkles } from 'lucide-react'
import { StatusDot } from '@/components/ui/status-dot'

interface CardProps {
  card: {
    businessId: string
    businessName: string
    businessCategory: string
    stampCount: number
    stampsRequired: number
    progressPercent: number
    rewardDescription: string
    lastVisitAt: string | null
    status: 'active' | 'at_risk' | 'lost'
  }
}

const statusToTone: Record<CardProps['card']['status'], 'good' | 'warn' | 'risk'> = {
  active: 'good',
  at_risk: 'warn',
  lost: 'risk',
}

const statusLabel: Record<CardProps['card']['status'], string> = {
  active: 'Activo',
  at_risk: 'En riesgo',
  lost: 'Inactivo',
}

export function LoyaltyCardPreview({ card }: CardProps) {
  const filled = Math.min(card.stampCount, card.stampsRequired)
  const empties = Math.max(0, card.stampsRequired - filled)
  const cells = [...Array(filled).fill(true), ...Array(empties).fill(false)]
  // Cap visible stamps for very large programs.
  const visible = cells.slice(0, 16)

  return (
    <article className="surface-card relative overflow-hidden p-5 text-[color:var(--color-ink)] transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[color:var(--color-ink-soft)] capitalize">{card.businessCategory}</p>
          <h3 className="font-display text-lg leading-tight">{card.businessName}</h3>
        </div>
        <span className="inline-flex items-center text-xs text-[color:var(--color-ink-soft)]">
          <StatusDot tone={statusToTone[card.status]} className="mr-1" />
          {statusLabel[card.status]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-8 gap-1.5">
        {visible.map((f, i) => (
          <div key={i} className={`stamp-cell ${f ? 'filled' : ''}`}>
            {f ? <Sparkles className="h-3 w-3" /> : null}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-[color:var(--color-border)] pt-3">
        <p className="text-xs text-[color:var(--color-ink-soft)]">{card.stampCount}/{card.stampsRequired} sellos</p>
        <p className="font-display text-sm">{card.rewardDescription}</p>
      </div>
    </article>
  )
}
