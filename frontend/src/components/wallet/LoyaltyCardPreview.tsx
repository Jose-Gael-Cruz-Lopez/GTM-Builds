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

export function LoyaltyCardPreview({ card }: CardProps) {
  return (
    <div className="card p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">{card.businessName}</h3>
          <p className="muted-text text-sm capitalize">{card.businessCategory}</p>
        </div>
        <span className="text-xs muted-text">
          {card.stampCount}/{card.stampsRequired}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className="h-full bg-[var(--primary)]" style={{ width: `${card.progressPercent}%` }} />
      </div>
      <p className="muted-text mt-2 text-xs">
        Recompensa: <strong>{card.rewardDescription}</strong>
      </p>
    </div>
  )
}
