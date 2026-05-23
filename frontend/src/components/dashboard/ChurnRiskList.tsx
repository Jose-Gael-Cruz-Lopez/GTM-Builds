import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ChurnRiskResponse, ChurnRiskClient } from "@/lib/api/analytics";

export interface ChurnRiskListProps {
  data?: ChurnRiskResponse;
  isLoading: boolean;
  campaignsHref?: string;
}

const STATUS_LABEL: Record<ChurnRiskClient["status"], string> = {
  active: "Activo",
  at_risk: "En riesgo",
  lost: "Perdido",
};

const STATUS_VARIANT: Record<
  ChurnRiskClient["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "secondary",
  at_risk: "default",
  lost: "destructive",
};

export function ChurnRiskList({ data, isLoading, campaignsHref }: ChurnRiskListProps) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b px-5 py-4">
        <div>
          <h3 className="font-display font-semibold">Clientes en riesgo</h3>
          <p className="muted-text text-xs">
            Top 10 clientes ordenados por probabilidad de no volver.
          </p>
        </div>
        {campaignsHref ? (
          <a
            href={campaignsHref}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Megaphone className="h-4 w-4" />
            <span>Generar campaña</span>
          </a>
        ) : null}
      </div>

      {isLoading ? (
        <ChurnSkeleton />
      ) : !data || data.clients.length === 0 ? (
        <div className="grid place-items-center px-5 py-12 text-center text-sm muted-text">
          <p>Ningún cliente en riesgo por ahora. ¡Buen trabajo!</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Cliente</TableHead>
              <TableHead className="text-right">Días sin visita</TableHead>
              <TableHead className="text-right">Visitas totales</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="pr-5">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...data.clients]
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 10)
              .map((client) => (
                <TableRow key={client.clientId}>
                  <TableCell className="pl-5">
                    <div className="font-medium text-foreground">{client.fullName}</div>
                    {client.phone ? (
                      <div className="text-xs muted-text">{client.phone}</div>
                    ) : client.email ? (
                      <div className="text-xs muted-text">{client.email}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {client.daysSinceVisit === null ? "—" : client.daysSinceVisit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {client.totalVisits}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {Math.round(client.riskScore)}
                  </TableCell>
                  <TableCell className="pr-5">
                    <Badge variant={STATUS_VARIANT[client.status]}>
                      {STATUS_LABEL[client.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function ChurnSkeleton() {
  return (
    <div className="space-y-3 px-5 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-xl bg-muted/15 p-3"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted/30" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted/30" />
        </div>
      ))}
    </div>
  );
}
