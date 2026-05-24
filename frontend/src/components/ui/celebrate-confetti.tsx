import { useEffect } from 'react'
import { tokens } from '@/lib/theme'
import { prefersReducedMotion } from '@/lib/prefers-reduced-motion'

/**
 * CelebrateConfetti — La Revoltosa palette burst.
 * Under reduced-motion: simple 200ms opacity fade only.
 */
export function CelebrateConfetti({ active }: { active: boolean }) {
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (!active) return
  }, [active])

  if (!active) return null

  if (reduced) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[120] bg-[color:var(--color-celebrate)]/20 animate-[fade-celebrate_200ms_ease-out_forwards]"
        aria-hidden
      />
    )
  }

  const palette = [tokens.color.celebrate, tokens.color.cream, tokens.color.signal, tokens.color.health]
  const pieces = Array.from({ length: 28 })

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center" aria-hidden>
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2
        const distance = 180 + Math.random() * 140
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        const color = palette[i % palette.length]
        const size = 8 + Math.random() * 6
        const delay = Math.random() * 80
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: color,
              animation: `confetti-burst 900ms cubic-bezier(.22,1,.36,1) ${delay}ms forwards`,
              ['--tx' as never]: `${x}px`,
              ['--ty' as never]: `${y}px`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes confetti-burst {
          0%   { transform: translate(0,0) scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 0; }
        }
        @keyframes fade-celebrate {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
