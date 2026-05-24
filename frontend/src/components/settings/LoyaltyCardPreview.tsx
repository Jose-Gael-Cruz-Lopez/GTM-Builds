import { Sparkles } from 'lucide-react'
import { tokens } from '@/lib/theme'

interface LoyaltyCardPreviewProps {
  businessName: string
  stampsRequired: number
  rewardDescription: string
  primaryColor?: string
  logoUrl?: string
}

export function LoyaltyCardPreview({
  businessName,
  stampsRequired,
  rewardDescription,
  primaryColor = tokens.color.signal,
  logoUrl,
}: LoyaltyCardPreviewProps) {
  const filled = Math.min(3, stampsRequired)

  return (
    <div
      className="surface-card mx-auto max-w-xs overflow-hidden p-5"
      style={{ borderTop: `4px solid ${primaryColor}` }}
      aria-label="Vista previa de la tarjeta de lealtad"
    >
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ background: primaryColor }}
          >
            <Sparkles className="h-5 w-5 text-[color:var(--color-ink)]" />
          </div>
        )}
        <div>
          <p className="font-display text-sm font-semibold">{businessName || 'Tu negocio'}</p>
          <p className="text-xs text-[color:var(--color-ink-soft)]">{rewardDescription || 'Tu recompensa'}</p>
        </div>
      </div>

      <div
        className="mt-4 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(stampsRequired, 10)}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: Math.min(stampsRequired, 10) }).map((_, i) => (
          <div key={i} className={`stamp-cell text-xs font-semibold ${i < filled ? 'filled' : ''}`}>
            {i < filled ? '★' : ''}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-[color:var(--color-ink-soft)]">
        {stampsRequired} sellos · vista previa
      </p>
    </div>
  )
}
