import { Sparkles } from 'lucide-react'
import { StatusDot } from '@/components/ui/status-dot'

interface OnboardingCardPreviewProps {
  businessName: string
  businessCategory: string
  rewardDescription: string
  stampsRequired: number
  logoUrl: string | null
  primaryColor: string
  tagline: string
}

export function OnboardingCardPreview({
  businessName,
  businessCategory,
  rewardDescription,
  stampsRequired,
  logoUrl,
  primaryColor,
  tagline,
}: OnboardingCardPreviewProps) {
  const demoStamps = Math.min(3, Math.max(1, Math.floor(stampsRequired / 3)))

  return (
    <div className="relative">
      <p className="eyebrow mb-3 text-center">Vista previa · Cartera del cliente</p>
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] p-1"
        style={{
          background: `linear-gradient(145deg, ${primaryColor}33, var(--cream))`,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="surface-card relative overflow-hidden p-5 text-[color:var(--color-ink)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-xl border border-[var(--border)] object-cover"
                />
              ) : (
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--color-ink)]"
                  style={{ backgroundColor: `${primaryColor}44` }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
              )}
              <div>
                <p className="text-xs capitalize text-[color:var(--color-ink-soft)]">
                  {businessCategory}
                </p>
                <h3 className="font-display text-lg leading-tight">{businessName}</h3>
                {tagline ? (
                  <p className="mt-0.5 text-xs text-[color:var(--color-ink-soft)]">{tagline}</p>
                ) : null}
              </div>
            </div>
            <span className="inline-flex items-center text-xs text-[color:var(--color-ink-soft)]">
              <StatusDot tone="good" className="mr-1" />
              Activo
            </span>
          </div>

          <div className="mt-4 grid grid-cols-8 gap-1.5">
            {Array.from({ length: Math.min(stampsRequired, 16) }).map((_, i) => (
              <div
                key={i}
                className={`stamp-cell ${i < demoStamps ? 'filled' : ''}`}
                style={
                  i < demoStamps
                    ? {
                        background: primaryColor,
                        borderColor: primaryColor,
                        color: 'var(--color-ink)',
                      }
                    : undefined
                }
              >
                {i < demoStamps ? <Sparkles className="h-3 w-3" /> : null}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t border-[color:var(--color-border)] pt-3">
            <p className="text-xs text-[color:var(--color-ink-soft)]">
              {demoStamps}/{stampsRequired} sellos
            </p>
            <p className="font-display text-sm">{rewardDescription}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
