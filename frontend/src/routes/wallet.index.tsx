import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { clientsApi } from "@/lib/api/clients"
import { ApiError } from "@/lib/api-client"
import { LoyaltyCardPreview } from "@/components/wallet/LoyaltyCardPreview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const Route = createFileRoute("/wallet/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: '/wallet' } })
  },
  component: WalletIndex,
  head: () => ({ meta: [{ title: "Mi monedero · NexoLeal" }] }),
})

function WalletIndex() {
  const qc = useQueryClient()

  const cards = useQuery({
    queryKey: ['wallet', 'cards'],
    queryFn: () => clientsApi.listLoyaltyCards(),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') return false
      return failureCount < 2
    },
  })

  const needsBootstrap =
    cards.error instanceof ApiError && cards.error.code === 'NOT_FOUND'

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-black">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">NexoLeal</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="page-title mb-2">Mi monedero</h1>
        <p className="muted-text mb-6">Tus tarjetas de lealtad en un solo lugar.</p>

        {cards.isLoading && <div className="card p-6 animate-pulse h-32" />}
        {cards.data?.cards.length === 0 && (
          <div className="card p-8 text-center">
            <p className="muted-text">
              Aún no tienes tarjetas. Visita un negocio que use NexoLeal para empezar.
            </p>
          </div>
        )}
        <div className="space-y-4">
          {cards.data?.cards.map((c) => (
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
      </main>

      <ProfileBootstrapDialog
        open={needsBootstrap}
        onRegistered={() => {
          qc.invalidateQueries({ queryKey: ['wallet', 'cards'] })
        }}
      />
    </div>
  )
}

interface ProfileBootstrapDialogProps {
  open: boolean
  onRegistered: () => void
}

function ProfileBootstrapDialog({ open, onRegistered }: ProfileBootstrapDialogProps) {
  const [fullName, setFullName] = useState('')

  const register = useMutation({
    mutationFn: (name: string) => clientsApi.register({ fullName: name }),
    onSuccess: () => {
      toast.success('¡Perfil creado!')
      onRegistered()
    },
    onError: (e: ApiError) => {
      toast.error(e.message)
    },
  })

  const trimmed = fullName.trim()
  const canSubmit = trimmed.length >= 2 && !register.isPending

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Completa tu perfil</DialogTitle>
          <DialogDescription>
            Necesitamos tu nombre para crear tu monedero de lealtad. Solo te lo
            pediremos una vez.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSubmit) return
            register.mutate(trimmed)
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. María González"
              autoComplete="name"
              autoFocus
              disabled={register.isPending}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {register.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
