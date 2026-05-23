# 05 — Client Wallet + QR Generation

**Wave**: 3 (parallel with 04, 06, 07; after Wave 2)
**Working dir**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

End-customers need a wallet to see their loyalty progress and generate a QR token for the staff to scan. Two routes:

- `/wallet` — list of all loyalty cards (one per business the client is enrolled in)
- `/wallet/$businessId` — single card with full progress bar + a QR generator

`qrcode.react` was installed in Wave 1.

## Prerequisites

- Wave 1: `apiFetch`, `clientsApi`, `tokensApi`, `useSession`, `qrcode.react` installed
- Wave 2: working signup + login so a user can have a session

## Tasks

### 1. Create `/wallet/index.tsx`

`frontend/src/routes/wallet.index.tsx` (TanStack file-based: `.index` = `/wallet`).

```tsx
import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { clientsApi } from "@/lib/api/clients"
import { LoyaltyCardPreview } from "@/components/wallet/LoyaltyCardPreview"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export const Route = createFileRoute("/wallet/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: '/wallet' } })
  },
  component: WalletIndex,
  head: () => ({ meta: [{ title: "Mi monedero · NexoLeal" }] }),
})

function WalletIndex() {
  const cards = useQuery({
    queryKey: ['wallet', 'cards'],
    queryFn: () => clientsApi.listLoyaltyCards(),
  })

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-black">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">NexoLeal</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="page-title mb-2">Mi monedero</h1>
        <p className="muted-text mb-6">Tus tarjetas de lealtad en un solo lugar.</p>

        {cards.isLoading && <div className="card p-6 animate-pulse h-32" />}
        {cards.data?.cards.length === 0 && (
          <div className="card p-8 text-center">
            <p className="muted-text">
              Aún no tienes tarjetas. Visita un negocio que use NexoLeal para empezar.
            </p>
          </div>
        )}
        <div className="space-y-4">
          {cards.data?.cards.map((c) => (
            <Link
              key={c.businessId}
              to="/wallet/$businessId"
              params={{ businessId: c.businessId }}
              className="block"
            >
              <LoyaltyCardPreview card={c} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
```

### 2. Create `/wallet/$businessId.tsx`

`frontend/src/routes/wallet.$businessId.tsx`. The single-card detail page with the QR generator.

Core behavior:

- Fetch loyalty: `clientsApi.getLoyalty(businessId)` → renders progress.
- "Generar QR" button → `tokensApi.generate({ businessId })` → render the returned `token` as a `<QRCodeSVG />`.
- The QR is valid for `ttlSeconds` (90). Show a countdown. When 0, hide the QR and show "Generar nuevo QR".
- After a successful scan (which the user has no direct signal for), the QR token is consumed server-side. Provide a manual "Refrescar progreso" button that re-fetches loyalty.

```tsx
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

  // Countdown
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
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }
  if (!loyalty.data) return null

  const { business, loyalty: l } = loyalty.data

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
          <button onClick={() => navigate({ to: '/wallet' })} className="inline-flex items-center gap-1 text-sm text-muted">
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

          {/* Progress */}
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
              Te faltan {l.stampsRemaining} sellos para tu recompensa: <strong>{l.rewardDescription}</strong>
            </p>
          </div>

          {/* QR area */}
          <div className="mt-8 border-t pt-6">
            {token ? (
              <div className="grid place-items-center gap-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <QRCodeSVG value={token} size={220} level="M" />
                </div>
                <p className="muted-text text-xs">
                  Muestra este código al staff. Expira en{" "}
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
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
                  ) : (
                    "Generar mi QR"
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
```

### 3. Create `LoyaltyCardPreview` component

`frontend/src/components/wallet/LoyaltyCardPreview.tsx`. A compact card showing business name + a horizontal sellos progress bar.

```tsx
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
```

### 4. Client profile bootstrap (one-time on first wallet visit)

The backend's `GET /clients/me` returns 404 if the client hasn't been registered yet. Handle this gracefully:

In the `useQuery` for `cards`, on `AUTH_FORBIDDEN` or 404, prompt the user with a single-field form to set their full name. On submit, call `clientsApi.register({ fullName })` then retry. Wrap the form in a modal (shadcn `<Dialog>`).

## Files this prompt creates or modifies

- **Created**:
  - `frontend/src/routes/wallet.index.tsx`
  - `frontend/src/routes/wallet.$businessId.tsx`
  - `frontend/src/components/wallet/LoyaltyCardPreview.tsx`

## Done when

- `/wallet` shows all loyalty cards for the logged-in client.
- `/wallet/<businessId>` shows progress + a working "Generar mi QR" button.
- Clicking the button hits `/tokens/generate`, receives a token, and renders a QR.
- The countdown ticks every second; QR disappears at 0.
- After the staff scans (test via scanner in 06), pressing "Refrescar" updates the progress bar.
- `npx tsc --noEmit` passes.

## Things to avoid

- DO NOT cache the QR token — each scan must use a fresh token. Always regenerate.
- DO NOT decode/parse the token in the frontend — it's an opaque base64url payload.
- DO NOT show the raw token string to the user (just the QR).
- DO NOT call `tokensApi.generate` inside `useEffect` on mount — only on user click.
