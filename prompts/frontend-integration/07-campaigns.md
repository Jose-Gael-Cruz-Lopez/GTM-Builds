# 07 — Campaigns Manager

**Wave**: 3 (parallel with 04, 05, 06; after Wave 2)
**Working dir**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

Business owners need a UI to:
- Generate 3 AI-drafted campaigns at once via `POST /businesses/:id/campaigns/generate` (NVIDIA NIM).
- List existing campaigns grouped by status (`draft`, `active`, `sent`, `archived`).
- Activate a draft (`POST /businesses/:id/campaigns/:campaignId/activate`).
- Edit a campaign's title / message / etc. (`PATCH`).
- Archive a campaign.

The page lives at `/campaigns/$businessId` and requires admin auth.

## Prerequisites

- Wave 1: `apiFetch`, `campaignsApi`
- Wave 2: working login

## Tasks

### 1. Create `/campaigns/$businessId` route

`frontend/src/routes/campaigns.$businessId.tsx`.

```tsx
import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Sparkles, Wand2, Loader2, ArrowLeft, Send, Edit2, Archive } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { campaignsApi } from "@/lib/api/campaigns"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ApiError } from "@/lib/api-client"
import { CampaignCard } from "@/components/campaigns/CampaignCard"
import { CampaignEditDialog } from "@/components/campaigns/CampaignEditDialog"

export const Route = createFileRoute("/campaigns/$businessId")({
  beforeLoad: async ({ params }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: `/campaigns/${params.businessId}` } })
  },
  component: CampaignsPage,
  head: () => ({ meta: [{ title: "Campañas · NexoLeal" }] }),
})

function CampaignsPage() {
  const { businessId } = Route.useParams()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<string | null>(null)

  const list = useQuery({
    queryKey: ['business', businessId, 'campaigns'],
    queryFn: () => campaignsApi.list(businessId),
  })

  const generate = useMutation({
    mutationFn: () => campaignsApi.generate(businessId),
    onSuccess: (d) => {
      toast.success(
        d.generatedBy === 'fallback'
          ? 'Generamos 3 plantillas. (IA no disponible — usamos fallback)'
          : `¡3 campañas generadas con ${d.model}!`
      )
      qc.invalidateQueries({ queryKey: ['business', businessId, 'campaigns'] })
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  const activate = useMutation({
    mutationFn: (campaignId: string) => campaignsApi.activate(businessId, campaignId),
    onSuccess: () => {
      toast.success('Campaña activada')
      qc.invalidateQueries({ queryKey: ['business', businessId, 'campaigns'] })
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  const archive = useMutation({
    mutationFn: (campaignId: string) =>
      campaignsApi.update(businessId, campaignId, { status: 'archived' }),
    onSuccess: () => {
      toast.success('Archivada')
      qc.invalidateQueries({ queryKey: ['business', businessId, 'campaigns'] })
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  const grouped = list.data?.campaigns
  const total = list.data?.total ?? 0

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link
            to="/dashboard/$businessId"
            params={{ businessId }}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Panel
          </Link>
          <div className="flex items-center gap-2 text-black">
            <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            <span className="font-display font-semibold">Campañas</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Campañas de reactivación</h1>
            <p className="muted-text mt-1">
              {total === 0
                ? 'Aún no has generado campañas. Empieza con un clic.'
                : `${total} campaña${total === 1 ? '' : 's'} en total.`}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generando con IA...</>
            ) : (
              <><Wand2 className="h-4 w-4" /> Generar 3 campañas con IA</>
            )}
          </Button>
        </div>

        <Tabs defaultValue="draft" className="mt-8">
          <TabsList>
            <TabsTrigger value="draft">
              Borradores <Badge variant="secondary" className="ml-2">{grouped?.draft.length ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Activas <Badge variant="secondary" className="ml-2">{grouped?.active.length ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sent">
              Enviadas <Badge variant="secondary" className="ml-2">{grouped?.sent.length ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archivadas <Badge variant="secondary" className="ml-2">{grouped?.archived.length ?? 0}</Badge>
            </TabsTrigger>
          </TabsList>

          {(['draft', 'active', 'sent', 'archived'] as const).map((bucket) => (
            <TabsContent key={bucket} value={bucket} className="mt-6">
              {(!grouped || grouped[bucket].length === 0) && (
                <p className="muted-text text-sm">Nada por aquí todavía.</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {grouped?.[bucket].map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onActivate={() => activate.mutate(c.id)}
                    onArchive={() => archive.mutate(c.id)}
                    onEdit={() => setEditing(c.id)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {editing && (
          <CampaignEditDialog
            businessId={businessId}
            campaignId={editing}
            onClose={() => setEditing(null)}
          />
        )}
      </main>
    </div>
  )
}
```

### 2. Create `CampaignCard` component

`frontend/src/components/campaigns/CampaignCard.tsx`:

```tsx
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Edit2, Archive } from "lucide-react"

interface Campaign {
  id: string
  title: string
  message_template: string
  target_segment: 'at_risk' | 'lost' | 'all' | 'frequent'
  send_timing: string
  expected_lift: string
  status: 'draft' | 'active' | 'sent' | 'archived'
}

const segmentLabel: Record<Campaign['target_segment'], string> = {
  at_risk: 'En riesgo',
  lost: 'Perdidos',
  all: 'Todos',
  frequent: 'Frecuentes',
}

export function CampaignCard({
  campaign,
  onActivate,
  onArchive,
  onEdit,
}: {
  campaign: Campaign
  onActivate: () => void
  onArchive: () => void
  onEdit: () => void
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-semibold leading-tight">{campaign.title}</h3>
        <Badge variant="outline">{segmentLabel[campaign.target_segment]}</Badge>
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap">{campaign.message_template}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs muted-text">
        <div>
          <dt className="uppercase tracking-wider">Cuándo enviar</dt>
          <dd className="mt-1 text-foreground">{campaign.send_timing}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider">Lift esperado</dt>
          <dd className="mt-1 text-foreground">{campaign.expected_lift}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        {campaign.status === 'draft' && (
          <Button size="sm" onClick={onActivate}>
            <Send className="h-3 w-3" /> Activar
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit2 className="h-3 w-3" /> Editar
        </Button>
        {campaign.status !== 'archived' && (
          <Button size="sm" variant="ghost" onClick={onArchive}>
            <Archive className="h-3 w-3" /> Archivar
          </Button>
        )}
      </div>
    </div>
  )
}
```

### 3. Create `CampaignEditDialog` component

`frontend/src/components/campaigns/CampaignEditDialog.tsx`. Use shadcn `<Dialog>` and a small form with title + messageTemplate + sendTiming + expectedLift fields. On submit, call `campaignsApi.update(...)`, invalidate the campaigns query, close.

Pre-fill from `campaignsApi.get(businessId, campaignId)` (`useQuery` with the campaignId).

### 4. Variable hint

In the dialog, show a small "Variables disponibles" hint listing `{name}`, `{days}`, `{businessName}`, `{stamps}` — these are the placeholder syntax the NIM client uses.

## Files this prompt creates or modifies

- **Created**:
  - `frontend/src/routes/campaigns.$businessId.tsx`
  - `frontend/src/components/campaigns/CampaignCard.tsx`
  - `frontend/src/components/campaigns/CampaignEditDialog.tsx`

## Done when

- "/campaigns/$businessId" loads and shows 4 tabs (drafts, active, sent, archived).
- Clicking "Generar 3 campañas con IA" hits `/campaigns/generate`, returns 3 drafts, and they appear in the drafts tab.
- The toast message reflects `generatedBy` (real NIM vs fallback).
- Activating a draft moves it from "drafts" tab to "active".
- Editing a campaign opens the dialog, saves changes via `PATCH`, and the card updates.
- Archiving a campaign moves it to "archived".
- `npx tsc --noEmit` passes.

## Things to avoid

- DO NOT show the raw `message_template` in a `<pre>` block — use `whitespace-pre-wrap` on a normal `<p>` so it wraps naturally on narrow screens.
- DO NOT call `campaignsApi.generate` more than once per click — it's strict-rate-limited (10/min).
- DO NOT auto-activate generated drafts — keep "draft" status and let the user choose.
- DO NOT change `nvidia-nim` / `fallback` labels — they come from the backend and the UI just reflects them.
