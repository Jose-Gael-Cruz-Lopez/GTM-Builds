import { Edit2, Archive, Send, MessageCircle, Users } from 'lucide-react'
import type { Campaign } from '@/lib/api/campaigns'
import { Button } from '@/components/ui/button'
import { CampaignStatsPanel } from '@/components/campaigns/CampaignStatsPanel'
import { segmentLabel } from '@/components/campaigns/segment-utils'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  draft: { label: 'Borrador', className: 'bg-[var(--status-warn)]/15 text-[var(--status-warn)]' },
  active: { label: 'Activa', className: 'bg-[var(--status-good)]/15 text-[var(--status-good)]' },
  sent: { label: 'Enviada', className: 'bg-[var(--data-blue)]/15 text-[var(--data-blue)]' },
  archived: { label: 'Archivada', className: 'bg-[var(--ink-soft)]/15 text-[var(--ink-soft)]' },
} as const

export function CampaignCard({
  businessId,
  campaign,
  audienceCount,
  onActivate,
  onArchive,
  onEdit,
  onWhatsApp,
}: {
  businessId: string
  campaign: Campaign
  audienceCount: number
  onActivate: () => void
  onArchive: () => void
  onEdit: () => void
  onWhatsApp: () => void
}) {
  const status = STATUS_CONFIG[campaign.status]

  return (
    <article className="card flex flex-col overflow-hidden p-0 shadow-[var(--shadow-card)]">
      <div className="border-b bg-[var(--surface-soft)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              status.className,
            )}
          >
            {status.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[var(--ink-soft)]">
            <Users className="h-3 w-3" />
            {segmentLabel[campaign.target_segment]} · {audienceCount}
          </span>
          {campaign.expected_lift && (
            <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--health)]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink)]">
              {campaign.expected_lift}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        <h3 className="font-display text-xl font-semibold leading-tight tracking-tight text-[var(--ink)]">
          {campaign.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed whitespace-pre-wrap text-[var(--ink-soft)]">
          {campaign.message_template}
        </p>

        {campaign.status === 'sent' && (
          <CampaignStatsPanel businessId={businessId} campaignId={campaign.id} />
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit2 className="h-3 w-3" /> Editar
          </Button>
          {campaign.status === 'draft' && (
            <Button size="sm" onClick={onActivate}>
              <Send className="h-3 w-3" /> Activar
            </Button>
          )}
          {campaign.status !== 'archived' && (
            <Button size="sm" variant="outline" onClick={onWhatsApp}>
              <MessageCircle className="h-3 w-3" /> Enviar por WhatsApp
            </Button>
          )}
          {campaign.status !== 'archived' && (
            <Button size="sm" variant="ghost" onClick={onArchive}>
              <Archive className="h-3 w-3" /> Archivar
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
