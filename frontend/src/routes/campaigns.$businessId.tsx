import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Sparkles, Wand2, Loader2, ArrowLeft } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { campaignsApi, type GroupedCampaigns } from "@/lib/api/campaigns"
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
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: `/campaigns/${params.businessId}` },
      })
    }
  },
  component: CampaignsPage,
  head: () => ({ meta: [{ title: "Campañas · NexoLeal" }] }),
})

const EMPTY_GROUPED: GroupedCampaigns = {
  draft: [],
  active: [],
  sent: [],
  archived: [],
}

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

  const grouped = (list.data && !Array.isArray(list.data.campaigns)
    ? (list.data.campaigns as GroupedCampaigns)
    : EMPTY_GROUPED)
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
              Borradores <Badge variant="secondary" className="ml-2">{grouped.draft.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Activas <Badge variant="secondary" className="ml-2">{grouped.active.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sent">
              Enviadas <Badge variant="secondary" className="ml-2">{grouped.sent.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archivadas <Badge variant="secondary" className="ml-2">{grouped.archived.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {(['draft', 'active', 'sent', 'archived'] as const).map((bucket) => (
            <TabsContent key={bucket} value={bucket} className="mt-6">
              {grouped[bucket].length === 0 && (
                <p className="muted-text text-sm">Nada por aquí todavía.</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {grouped[bucket].map((c) => (
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
