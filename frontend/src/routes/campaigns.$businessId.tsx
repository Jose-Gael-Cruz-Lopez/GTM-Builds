import { RouteError } from "@/components/RouteError";
import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { routeMeta } from "@/lib/route-meta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Sparkles, Wand2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { campaignsApi, type Campaign, type GroupedCampaigns } from "@/lib/api/campaigns";
import { analyticsApi } from "@/lib/api/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignEditDialog } from "@/components/campaigns/CampaignEditDialog";
import { CampaignGenerationSheet } from "@/components/campaigns/CampaignGenerationSheet";
import { CampaignAudiencePreviewDialog } from "@/components/campaigns/CampaignAudiencePreviewDialog";
import { CampaignMarkSentDialog } from "@/components/campaigns/CampaignMarkSentDialog";
import { CampaignEmptyState } from "@/components/campaigns/CampaignEmptyState";
import { getSegmentCount } from "@/components/campaigns/segment-utils";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  tab: z.enum(["all", "draft", "active", "sent", "archived"]).optional().default("all"),
});

type Tab = z.infer<typeof searchSchema>["tab"];

export const Route = createFileRoute("/campaigns/$businessId")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ params }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: `/campaigns/${params.businessId}` },
      });
    }
  },
  component: CampaignsPage,
  errorComponent: RouteError,
  head: () =>
    routeMeta(
      "Campañas · NexoLeal",
      "Genera campañas de reactivación con IA y envía mensajes a tus clientes.",
    ),
});

const EMPTY_GROUPED: GroupedCampaigns = {
  draft: [],
  active: [],
  sent: [],
  archived: [],
};

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "draft", label: "Borradores" },
  { value: "active", label: "Activas" },
  { value: "sent", label: "Enviadas" },
  { value: "archived", label: "Archivadas" },
];

function CampaignsPage() {
  const { businessId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [activating, setActivating] = useState<Campaign | null>(null);
  const [markSentId, setMarkSentId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["business", businessId, "campaigns"],
    queryFn: () => campaignsApi.list(businessId),
  });

  const clients = useQuery({
    queryKey: ["business", businessId, "analytics", "clients"],
    queryFn: () => analyticsApi.clients(businessId),
  });

  const churn = useQuery({
    queryKey: ["business", businessId, "analytics", "churn-risk"],
    queryFn: () => analyticsApi.churnRisk(businessId),
  });

  const activate = useMutation({
    mutationFn: (campaignId: string) => campaignsApi.activate(businessId, campaignId),
    onSuccess: () => {
      toast.success("Campaña activada");
      setActivating(null);
      qc.invalidateQueries({ queryKey: ["business", businessId, "campaigns"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: (campaignId: string) =>
      campaignsApi.update(businessId, campaignId, { status: "archived" }),
    onSuccess: () => {
      toast.success("Archivada");
      qc.invalidateQueries({ queryKey: ["business", businessId, "campaigns"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const markSent = useMutation({
    mutationFn: (campaignId: string) =>
      campaignsApi.update(businessId, campaignId, {
        status: "sent",
        sentAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Campaña marcada como enviada");
      setMarkSentId(null);
      qc.invalidateQueries({ queryKey: ["business", businessId, "campaigns"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const grouped =
    list.data && !Array.isArray(list.data.campaigns)
      ? (list.data.campaigns as GroupedCampaigns)
      : EMPTY_GROUPED;
  const total = list.data?.total ?? 0;

  const tabCounts: Record<Tab, number> = {
    all: total,
    draft: grouped.draft.length,
    active: grouped.active.length,
    sent: grouped.sent.length,
    archived: grouped.archived.length,
  };

  const visibleCampaigns: Campaign[] =
    tab === "all"
      ? [...grouped.draft, ...grouped.active, ...grouped.sent, ...grouped.archived]
      : grouped[tab];

  const setTab = (next: Tab) => {
    navigate({
      to: "/campaigns/$businessId",
      params: { businessId },
      search: { tab: next },
      replace: true,
    });
  };

  const openWhatsApp = (campaign: Campaign) => {
    const text = encodeURIComponent(campaign.message_template);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    setMarkSentId(campaign.id);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-paper)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link
            to="/dashboard/$businessId"
            params={{ businessId }}
            className="inline-flex items-center gap-1 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4" /> Panel
          </Link>
          <div className="flex items-center gap-2 text-[var(--ink)]">
            <Sparkles className="h-4 w-4 text-[var(--signal)]" />
            <span className="font-display font-semibold">Campañas</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
              Campañas
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {total === 0
                ? "Conecta con tus clientes y mide el impacto de cada mensaje."
                : `${total} campaña${total === 1 ? "" : "s"} en total.`}
            </p>
          </div>
          <Button size="lg" onClick={() => setSheetOpen(true)}>
            <Wand2 className="h-4 w-4" /> Generar con IA
          </Button>
        </div>

        <div
          role="tablist"
          aria-label="Filtrar campañas"
          className="mt-8 flex flex-wrap gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-white p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] focus-visible:ring-offset-2",
                tab === t.value
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]",
              )}
            >
              {t.label}
              <Badge
                variant="secondary"
                className={cn("h-5 min-w-5 px-1.5", tab === t.value && "bg-white/20 text-white")}
              >
                {tabCounts[t.value]}
              </Badge>
            </button>
          ))}
        </div>

        {list.isLoading ? (
          <p className="mt-8 text-sm text-[var(--ink-soft)]">Cargando campañas...</p>
        ) : total === 0 ? (
          <CampaignEmptyState onGenerate={() => setSheetOpen(true)} />
        ) : visibleCampaigns.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--ink-soft)]">Nada por aquí todavía.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {visibleCampaigns.map((c) => (
              <CampaignCard
                key={c.id}
                businessId={businessId}
                campaign={c}
                audienceCount={getSegmentCount(c.target_segment, clients.data, churn.data)}
                onActivate={() => setActivating(c)}
                onArchive={() => archive.mutate(c.id)}
                onEdit={() => setEditing(c.id)}
                onWhatsApp={() => openWhatsApp(c)}
              />
            ))}
          </div>
        )}

        <CampaignGenerationSheet
          businessId={businessId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onEdit={(id) => {
            setSheetOpen(false);
            setEditing(id);
          }}
          onActivate={(campaign) => {
            setSheetOpen(false);
            setActivating(campaign);
          }}
        />

        {editing && (
          <CampaignEditDialog
            businessId={businessId}
            campaignId={editing}
            onClose={() => setEditing(null)}
          />
        )}

        {activating && (
          <CampaignAudiencePreviewDialog
            businessId={businessId}
            campaign={activating}
            open
            onClose={() => setActivating(null)}
            onConfirm={() => activate.mutate(activating.id)}
            confirming={activate.isPending}
          />
        )}

        {markSentId && (
          <CampaignMarkSentDialog
            open
            onClose={() => setMarkSentId(null)}
            onConfirm={() => markSent.mutate(markSentId)}
            confirming={markSent.isPending}
          />
        )}
      </main>
    </div>
  );
}
