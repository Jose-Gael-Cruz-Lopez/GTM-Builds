import { useEffect } from 'react'
import { tokens } from '@/lib/theme'

/**
 * CelebrateConfetti — La Revoltosa palette burst.
 * Lightweight DOM-based fallback (no dependency) for stamp unlocks.
 * Renders 24 colored dots that fan outward, then unmounts via parent.
 */
export function CelebrateConfetti({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return
    // No-op: pure CSS animation handles the show.
  }, [active])

  if (!active) return null

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
              // CSS custom props consumed by the keyframe
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
        @media (prefers-reduced-motion: reduce) {
          [class*="confetti"] { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  )
}
