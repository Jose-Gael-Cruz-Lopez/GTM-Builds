import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { KeyRound, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { businessesApi, type StaffKeySummary } from '@/lib/api/businesses'
import { getStaffKeySuffix } from '@/lib/business-profile-storage'
import { ApiError } from '@/lib/api-client'
import { CreateStaffKeyDialog } from './CreateStaffKeyDialog'

interface StaffSettingsTabProps {
  businessId: string
}

function formatWhen(iso: string | null): string {
  if (!iso) return 'Nunca'
  const d = new Date(iso)
  return `${format(d, 'd MMM yyyy', { locale: es })} · ${formatDistanceToNow(d, { addSuffix: true, locale: es })}`
}

export function StaffSettingsTab({ businessId }: StaffSettingsTabProps) {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<StaffKeySummary | null>(null)

  const keys = useQuery({
    queryKey: ['business', businessId, 'staff-keys'],
    queryFn: () => businessesApi.listStaffKeys(businessId),
  })

  const revoke = useMutation({
    mutationFn: (keyId: string) => businessesApi.deleteStaffKey(businessId, keyId),
    onSuccess: () => {
      toast.success('Clave revocada')
      qc.invalidateQueries({ queryKey: ['business', businessId, 'staff-keys'] })
      setRevokeTarget(null)
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  const rows = keys.data?.staffKeys ?? []

  return (
    <section className="surface-paper p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Staff y dispositivos</h2>
          <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            Claves para el escáner en mostrador. Cada dispositivo necesita la suya.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Crear nueva clave
        </Button>
      </div>

      {keys.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-ink-soft)]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-xl border border-dashed py-12 text-center">
          <KeyRound className="h-8 w-8 text-[color:var(--color-ink-soft)]" />
          <p className="mt-3 text-sm text-[color:var(--color-ink-soft)]">
            Aún no hay claves. Crea una para conectar tu primer dispositivo.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etiqueta</TableHead>
                <TableHead>Clave</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead>Último uso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const suffix = getStaffKeySuffix(row.id)
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {suffix ? `••••${suffix}` : '••••••••'}
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--color-ink-soft)]">
                      {formatWhen(row.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--color-ink-soft)]">
                      {formatWhen(row.last_used_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.is_active ? 'default' : 'secondary'}>
                        {row.is_active ? 'Activa' : 'Revocada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[color:var(--color-status-risk)] hover:text-[color:var(--color-status-risk)]"
                          onClick={() => setRevokeTarget(row)}
                        >
                          <Trash2 className="h-4 w-4" /> Revocar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateStaffKeyDialog
        businessId={businessId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ['business', businessId, 'staff-keys'] })}
      />

      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar esta clave?</AlertDialogTitle>
            <AlertDialogDescription>
              El dispositivo &quot;{revokeTarget?.label}&quot; dejará de poder registrar visitas de inmediato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revoke.isPending}
              onClick={() => revokeTarget && revoke.mutate(revokeTarget.id)}
            >
              Revocar clave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
