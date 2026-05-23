import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { supabase } from "@/integrations/supabase/client"
import { clientsApi } from "@/lib/api/clients"
import { tokensApi } from "@/lib/api/tokens"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ApiError } from "@/lib/api-client"
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react"

export const Route = createFileRoute("/wallet/$businessId")({
  beforeLoad: async ({ params }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: `/wallet/${params.businessId}` } })
  },
  component: WalletDetail,
  head: () => ({ meta: [{ title: "Mi tarjeta · NexoLeal" }] }),
})

function WalletDetail() {
  const { businessId } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const loyalty = useQuery({
    queryKey: ['wallet', 'loyalty', businessId],
    queryFn: () => clientsApi.getLoyalty(businessId),
  })

  const generate = useMutation({
    mutationFn: () => tokensApi.generate({ businessId }),
    onSuccess: (d) => {
      setToken(d.token)
      setExpiresAt(new Date(d.expiresAt))
      setSecondsLeft(d.ttlSeconds)
    },
    onError: (e: ApiError) => {
      if (e.code === 'AUTH_INVALID' || e.code === 'AUTH_MISSING') {
        navigate({ to: '/login' })
        return
      }
      toast.error(e.message)
    },
  })

  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => {
      const remain = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000))
      setSecondsLeft(remain)
      if (remain === 0) {
        setToken(null)
        setExpiresAt(null)
        clearInterval(id)
      }
    }, 250)
    return () => clearInterval(id)
  }, [expiresAt])

  if (loyalty.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  if (!loyalty.data) return null

  const { business, loyalty: l } = loyalty.data

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
          <button
            onClick={() => navigate({ to: '/wallet' })}
            className="inline-flex items-center gap-1 text-sm text-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['wallet', 'loyalty', businessId] })}
            className="text-muted hover:text-foreground"
            aria-label="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold">{business.name}</h2>
          <p className="muted-text text-sm capitalize">{business.category}</p>

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <span className="muted-text text-sm">Sellos</span>
              <span className="font-display text-2xl font-bold">
                {l.stampCount} / {l.stampsRequired}
              </span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] transition-all"
                style={{ width: `${l.progressPercent}%` }}
              />
            </div>
            <p className="muted-text mt-2 text-xs">
              Te faltan {l.stampsRemaining} sellos para tu recompensa:{' '}
              <strong>{l.rewardDescription}</strong>
            </p>
          </div>

          <div className="mt-8 border-t pt-6">
            {token ? (
              <div className="grid place-items-center gap-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <QRCodeSVG value={token} size={220} level="M" />
                </div>
                <p className="muted-text text-xs">
                  Muestra este código al staff. Expira en{' '}
                  <strong>{secondsLeft}s</strong>.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={generate.isPending}
                  onClick={() => generate.mutate()}
                >
                  {generate.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generando...
                    </>
                  ) : (
                    'Generar mi QR'
                  )}
                </Button>
                <p className="muted-text mt-2 text-xs">
                  Genera un código único cada vez que vayas al negocio.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="muted-text text-xs">
            Total de visitas: {l.totalVisits} · Recompensas redimidas: {l.totalRewards}
          </p>
        </div>
      </main>
    </div>
  )
}
