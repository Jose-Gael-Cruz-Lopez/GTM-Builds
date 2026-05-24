import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

interface Props {
  headline: string
  subtitle?: string
  glyph?: React.ReactNode
  children: React.ReactNode
}

/**
 * Shared split-screen layout used by login/signup/forgot/reset.
 * Left = ink panel with serif headline + illustrated scene.
 * Right = paper panel with the form.
 */
export function AuthSplit({ headline, subtitle, glyph, children }: Props) {
  return (
    <div className="grid min-h-screen md:grid-cols-[60%_40%]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-bg-base)] p-12 text-[var(--color-cream)] md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(245, 197, 24, 0.15), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255, 45, 26, 0.12), transparent 50%)',
          }}
          aria-hidden
        />
        <Link to="/" className="relative flex items-center gap-2 font-display text-xl">
          <Sparkles className="h-5 w-5 text-[color:var(--color-signal)]" /> NexoLeal
        </Link>
        <div className="relative max-w-md">
          <p className="eyebrow text-[color:var(--color-cream)]/60">Lealtad digital</p>
          <h1 className="display-xl mt-3">{headline}</h1>
          {subtitle && <p className="mt-4 text-[color:var(--color-cream)]/75">{subtitle}</p>}
          {glyph && <div className="mt-10">{glyph}</div>}
        </div>
        <p className="relative text-xs text-[color:var(--color-cream)]/40">© NexoLeal · Hecho en México</p>
      </aside>

      <section className="flex items-center justify-center bg-[var(--color-bg-paper)] px-6 py-12 md:px-12">
        <div className="w-full max-w-md">
          {/* Mobile compact hero band */}
          <Link to="/" className="mb-8 flex items-center gap-2 font-display text-lg md:hidden">
            <Sparkles className="h-5 w-5 text-[color:var(--color-signal)]" /> NexoLeal
          </Link>
          {children}
        </div>
      </section>
    </div>
  )
}
