import { Megaphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ChurnRiskResponse, ChurnRiskClient } from '@/lib/api/analytics'
import { AnalyticsEmptyState } from '@/components/dashboard/AnalyticsEmptyState'

export interface ChurnRiskListProps {
  data?: ChurnRiskResponse
  isLoading: boolean
  businessId: string
}

const STATUS_LABEL: Record<ChurnRiskClient['status'], string> = {
  active: 'Activo',
  at_risk: 'En riesgo',
  lost: 'Perdido',
}

const STATUS_TONE: Record<ChurnRiskClient['status'], 'good' | 'warn' | 'risk'> = {
  active: 'good',
  at_risk: 'warn',
  lost: 'risk',
}

export function ChurnRiskList({ data, isLoading, businessId }: ChurnRiskListProps) {
  const campaignsHref = `/campaigns/${businessId}?action=generate`
  const bulkCampaignHref = `/campaigns/${businessId}?action=generate&segment=at_risk`

  return (
    <section className="surface-paper overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[color:var(--color-border)] px-5 py-4">
        <div>
          <h3 className="font-display font-semibold">Clientes en riesgo</h3>
          <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
            Top 10 clientes ordenados por probabilidad de no volver.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={bulkCampaignHref}
            className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[color:var(--color-border)] bg-[var(--color-cream)] px-4 py-2 text-sm font-medium transition hover:shadow-[var(--shadow-soft)]"
          >
            <Megaphone className="h-4 w-4" aria-hidden />
            Generar campaña para todos
          </a>
          <a href={campaignsHref} className="btn-signal inline-flex items-center gap-2 text-sm">
            <Megaphone className="h-4 w-4" aria-hidden />
            Generar campaña
          </a>
        </div>
      </div>

      {isLoading ? (
        <ChurnSkeleton />
      ) : !data || data.clients.length === 0 ? (
        <AnalyticsEmptyState
          title="Ningún cliente en riesgo por ahora"
          description="¡Buen trabajo! Sigue fidelizando a tus clientes activos."
          className="border-0 bg-transparent py-12"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5 text-[color:var(--color-ink-soft)]">Cliente</TableHead>
              <TableHead className="text-right text-[color:var(--color-ink-soft)]">
                Días sin visita
              </TableHead>
              <TableHead className="text-right text-[color:var(--color-ink-soft)]">
                Visitas totales
              </TableHead>
              <TableHead className="text-right text-[color:var(--color-ink-soft)]">Score</TableHead>
              <TableHead className="pr-5 text-[color:var(--color-ink-soft)]">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...data.clients]
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 10)
              .map((client) => (
                <TableRow key={client.clientId} className="hover:bg-[var(--color-cream)]/40">
                  <TableCell className="pl-5">
                    <div className="font-medium text-[color:var(--color-ink)]">
                      {client.fullName}
                    </div>
                    {client.phone ? (
                      <div className="text-xs text-[color:var(--color-ink-soft)]">
                        {client.phone}
                      </div>
                    ) : client.email ? (
                      <div className="text-xs text-[color:var(--color-ink-soft)]">
                        {client.email}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {client.daysSinceVisit === null ? '—' : client.daysSinceVisit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{client.totalVisits}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {Math.round(client.riskScore)}
                  </TableCell>
                  <TableCell className="pr-5">
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-[color:var(--color-border)] bg-[var(--color-bg-paper)]"
                    >
                      <StatusDot tone={STATUS_TONE[client.status]} />
                      {STATUS_LABEL[client.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

function ChurnSkeleton() {
  return (
    <div className="space-y-3 px-5 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-[var(--radius)] bg-[var(--color-cream)]/60 p-3"
        >
          <div className="h-4 w-40 shimmer rounded" />
          <div className="h-4 w-12 shimmer rounded" />
          <div className="h-4 w-12 shimmer rounded" />
          <div className="h-4 w-12 shimmer rounded" />
          <div className="h-6 w-20 shimmer rounded-full" />
        </div>
      ))}
    </div>
  )
}
