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
