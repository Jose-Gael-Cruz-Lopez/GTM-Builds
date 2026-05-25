import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Copy, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";

import { adminApi, isAdminRouteUnavailable } from "@/lib/admin-api";
import { requireSession } from "@/lib/auth-guards";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { useSession } from "@/hooks/use-session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IsoScene } from "@/components/ui/iso-scene";
import { StatusDot } from "@/components/ui/status-dot";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ClientStatus } from "@/integrations/supabase/types";

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(10).max(50).default(20),
  status: z.enum(["all", "active", "at_risk", "lost"]).default("all"),
  sort: z.enum(["last_visit", "total_visits", "stamps"]).default("last_visit"),
  q: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/$businessId/clients")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ params, location }) => {
    await requireSession(location.pathname || `/dashboard/${params.businessId}/clients`);
  },
  component: ClientsPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Clientes · NexoLeal" }] }),
});

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Activo",
  at_risk: "En riesgo",
  lost: "Perdido",
};

const STATUS_TONE: Record<ClientStatus, "good" | "warn" | "risk"> = {
  active: "good",
  at_risk: "warn",
  lost: "risk",
};

function ClientsPage() {
  const { businessId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { businessName, business } = useOwnedBusiness();
  const { user } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search.q ?? "");

  const ownerFirstName =
    user?.user_metadata?.full_name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "equipo";

  const list = useQuery({
    queryKey: ["business", businessId, "clients", search.page, search.limit, search.status],
    queryFn: () =>
      adminApi.listClients({
        businessId,
        page: search.page,
        limit: search.limit,
        status: search.status === "all" ? undefined : search.status,
      }),
    retry: false,
  });

  const unavailable = list.error && isAdminRouteUnavailable(list.error);

  const filtered = useMemo(() => {
    if (!list.data?.items) return [];
    let items = [...list.data.items];
    const q = (search.q ?? "").trim().toLowerCase();
    if (q) {
      items = items.filter((c) => c.fullName.toLowerCase().includes(q));
    }
    if (search.sort === "total_visits") {
      items.sort((a, b) => b.totalVisits - a.totalVisits);
    } else if (search.sort === "stamps") {
      items.sort((a, b) => b.stampCount - a.stampCount);
    }
    return items;
  }, [list.data, search.q, search.sort]);

  const selected = filtered.find((c) => c.clientId === selectedId);
  const selectedIndex = filtered.findIndex((c) => c.clientId === selectedId);

  const copyJoin = () => {
    const url = `${window.location.origin}/join/${businessId}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Enlace copiado"),
      () => toast.error("No pudimos copiar"),
    );
  };

  return (
    <DashboardShell
      businessId={businessId}
      businessName={businessName}
      plan={business?.plan ?? "free"}
      activeNav="clientes"
      ownerFirstName={ownerFirstName}
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Clientes</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Administra tu base de clientes y genera campañas personalizadas.
        </p>
      </div>

      {unavailable ? (
        <IsoScene
          title="Función en preparación"
          description="Estamos terminando esta vista. Mientras tanto, ve los datos resumidos en el panel principal."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <a href={`/dashboard/${businessId}`} className="btn-signal text-sm">
                Ir al panel
              </a>
              <a
                href="mailto:soporte@nexoleal.com?subject=Feedback%20clientes"
                className="btn-secondary text-sm"
              >
                Enviar feedback
              </a>
            </div>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-soft)]"
                aria-hidden
              />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate({ search: (prev) => ({ ...prev, q: searchInput, page: 1 }) });
                  }
                }}
                aria-label="Buscar clientes"
              />
            </div>
            <Select
              value={search.status}
              onValueChange={(status) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    status: status as typeof search.status,
                    page: 1,
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="at_risk">En riesgo</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={search.sort}
              onValueChange={(sort) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: sort as typeof search.sort,
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Ordenar">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_visit">Última visita</SelectItem>
                <SelectItem value="total_visits">Total visitas</SelectItem>
                <SelectItem value="stamps">Sellos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {list.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 shimmer rounded-[var(--radius)]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <IsoScene
              title="Aún no tienes clientes registrados"
              description="Comparte tu enlace de invitación para empezar."
              action={
                <Button type="button" onClick={copyJoin} className="gap-2">
                  <Copy className="h-4 w-4" aria-hidden />
                  Copiar enlace de invitación
                </Button>
              }
            />
          ) : (
            <>
              <div className="surface-paper overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Sellos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última visita</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((client, index) => (
                      <TableRow
                        key={client.clientId}
                        className="cursor-pointer hover:bg-[var(--color-cream)]/50"
                        onClick={() => setSelectedId(client.clientId)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-cream)] text-xs font-semibold">
                              C{index + 1}
                            </span>
                            <span className="font-medium">Cliente {index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">{client.stampCount}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <StatusDot tone={STATUS_TONE[client.status]} />
                            {STATUS_LABEL[client.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-[color:var(--color-ink-soft)]">
                          {client.lastVisitAt
                            ? formatDistanceToNow(new Date(client.lastVisitAt), {
                                addSuffix: true,
                                locale: es,
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {client.totalVisits}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Más acciones">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(client.clientId)}>
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a
                                  href={`/campaigns/${businessId}?action=generate&client=${client.clientId}`}
                                >
                                  Generar campaña personal
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={search.page <= 1}
                  onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page - 1 }) })}
                >
                  Anterior
                </Button>
                <span className="text-[color:var(--color-ink-soft)]">Página {search.page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!list.data?.hasNextPage}
                  onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) })}
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">Cliente {selectedIndex + 1}</SheetTitle>
              </SheetHeader>
              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-[color:var(--color-ink-soft)]">Estado</dt>
                  <dd className="mt-1 inline-flex items-center gap-1.5 font-medium">
                    <StatusDot tone={STATUS_TONE[selected.status]} />
                    {STATUS_LABEL[selected.status]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[color:var(--color-ink-soft)]">Sellos</dt>
                  <dd className="mt-1 font-medium tabular-nums">{selected.stampCount}</dd>
                </div>
                <div>
                  <dt className="text-[color:var(--color-ink-soft)]">Visitas totales</dt>
                  <dd className="mt-1 font-medium tabular-nums">{selected.totalVisits}</dd>
                </div>
              </dl>
              <a
                href={`/campaigns/${businessId}?action=generate&client=${selected.clientId}`}
                className="btn-signal mt-8 inline-flex w-full justify-center text-sm"
              >
                Generar campaña para este cliente
              </a>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}