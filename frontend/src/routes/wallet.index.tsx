import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, ArrowRight, User } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { clientsApi } from '@/lib/api/clients'
import { ApiError } from '@/lib/api-client'
import { LoyaltyCardPreview } from '@/components/wallet/LoyaltyCardPreview'
import { AppShell } from '@/components/layout/AppShell'
import { IsoScene, EmptyWalletGlyph } from '@/components/ui/iso-scene'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export const Route = createFileRoute('/wallet/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: '/wallet' } })
  },
  component: WalletIndex,
  head: () => ({ meta: [{ title: 'Mi cartera · NexoLeal' }] }),
})

function WalletIndex() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [nameOpen, setNameOpen] = useState(false)
  const [fullName, setFullName] = useState('')

  const cards = useQuery({
    queryKey: ['wallet', 'cards'],
    queryFn: () => clientsApi.listLoyaltyCards(),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') return false
      return failureCount < 2
    },
  })

  const needsBootstrap = cards.error instanceof ApiError && cards.error.code === 'NOT_FOUND'

  const bootstrap = useMutation({
    mutationFn: (name: string) => clientsApi.register({ fullName: name }),
    onSuccess: () => {
      setNameOpen(false)
      qc.invalidateQueries({ queryKey: ['wallet', 'cards'] })
      toast.success('¡Bienvenido a NexoLeal!')
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  if (cards.isLoading) {
    return (
      <AppShell variant="dark">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-signal)]" />
        </div>
      </AppShell>
    )
  }

  if (needsBootstrap) {
    return (
      <AppShell variant="dark">
        <div className="mx-auto max-w-md px-4 py-12">
          <h1 className="display-md text-[color:var(--color-cream)]">Configura tu cartera</h1>
          <p className="mt-2 text-sm text-[color:var(--color-cream)]/70">Cuéntanos cómo te llamas para crear tu perfil.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (fullName.trim()) bootstrap.mutate(fullName.trim()) }} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name" className="text-[color:var(--color-cream)]/80">Nombre completo</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
            </div>
            <Button type="submit" disabled={bootstrap.isPending} className="btn-signal w-full">
              {bootstrap.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
            </Button>
          </form>
        </div>
      </AppShell>
    )
  }

  const list = cards.data?.cards ?? []
  const firstName = list[0]?.businessName ? '' : ''

  return (
    <AppShell variant="dark">
      <div className="mx-auto max-w-md px-4 py-8 pb-24">
        <p className="eyebrow text-[color:var(--color-cream)]/60">Mi cartera</p>
        <h1 className="display-lg mt-2 text-[color:var(--color-cream)]">
          {list.length > 0 ? 'Tus programas de lealtad' : 'Aún no perteneces a ningún programa.'}
        </h1>

        {list.length === 0 ? (
          <div className="mt-8">
            <IsoScene
              title="Empieza tu primera carta"
              description="Pídele al negocio su enlace o QR de invitación, o pega aquí su código."
              className="bg-[var(--color-cream)]"
            >
              <EmptyWalletGlyph />
            </IsoScene>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const id = joinCode.includes('/join/')
                  ? joinCode.split('/join/')[1].replace(/\/$/, '')
                  : joinCode.trim()
                if (!id) return
                navigate({ to: '/join/$businessId', params: { businessId: id } })
              }}
              className="mt-6 space-y-3"
            >
              <Label htmlFor="code" className="text-[color:var(--color-cream)]/80">¿Tienes un código?</Label>
              <Input
                id="code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="ID del negocio o enlace de invitación"
                className="bg-[var(--color-bg-elevated)] text-[color:var(--color-cream)]"
              />
              <Button type="submit" className="btn-signal w-full">
                Unirme <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {list.map((c) => (
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
        )}
      </div>

      {/* Bottom action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-[rgba(13,13,13,0.85)] px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link to="/wallet/profile" className="inline-flex items-center gap-2 text-sm text-[color:var(--color-cream)]/80">
            <User className="h-4 w-4" /> Mi perfil
          </Link>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              navigate({ to: '/' })
            }}
            className="text-xs text-[color:var(--color-cream)]/60 underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cuéntanos tu nombre</DialogTitle>
            <DialogDescription>Aparecerá cuando el staff escanee tu QR.</DialogDescription>
          </DialogHeader>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
          <DialogFooter>
            <Button onClick={() => bootstrap.mutate(fullName)} disabled={bootstrap.isPending || !fullName.trim()}>
              {bootstrap.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
