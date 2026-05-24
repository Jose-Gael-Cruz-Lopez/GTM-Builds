import { Link, useRouter } from '@tanstack/react-router'
import { NotFoundGlyph, IsoScene } from '@/components/ui/iso-scene'

/** Per-route error boundary — editorial fallback with retry. */
export function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error)
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-paper)] px-4">
      <IsoScene
        title="Algo salió mal"
        description="No pudimos cargar esta página. Intenta de nuevo o vuelve al inicio."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                router.invalidate()
                reset()
              }}
              className="btn-signal text-sm"
            >
              Reintentar
            </button>
            <Link to="/" className="btn-secondary text-sm">
              Ir al inicio
            </Link>
          </div>
        }
      >
        <NotFoundGlyph />
      </IsoScene>
    </div>
  )
}
