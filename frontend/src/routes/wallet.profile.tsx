import { RouteError } from "@/components/RouteError"
import { createFileRoute, redirect, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createFileRoute('/wallet/profile')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: '/wallet/profile' } })
  },
  component: WalletProfile,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Mi perfil · NexoLeal' }] }),
})

function WalletProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setFullName((data.user?.user_metadata?.full_name as string) ?? '')
      setEmail(data.user?.email ?? '')
      setLoading(false)
    })
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
    setSaving(false)
    if (error) {
      toast.error('No pudimos guardar', { description: error.message })
      return
    }
    toast.success('Perfil actualizado')
  }

  return (
    <AppShell variant="dark" showNav={false}>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(13,13,13,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link to="/wallet" className="inline-flex items-center gap-1 text-sm text-[color:var(--color-cream)]/70">
            <ArrowLeft className="h-4 w-4" /> Mi cartera
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <p className="eyebrow text-[color:var(--color-cream)]/60">Mi perfil</p>
        <h1 className="display-md mt-2 text-[color:var(--color-cream)]">Tu información</h1>

        {loading ? (
          <div className="mt-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <form onSubmit={save} className="mt-6 space-y-4 rounded-2xl bg-[var(--color-bg-elevated)] p-5">
            <div>
              <Label htmlFor="name" className="text-[color:var(--color-cream)]/80">Nombre completo</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-[var(--color-bg-base)] text-[color:var(--color-cream)]" />
            </div>
            <div>
              <Label htmlFor="email" className="text-[color:var(--color-cream)]/80">Email</Label>
              <Input id="email" value={email} disabled className="bg-[var(--color-bg-base)] text-[color:var(--color-cream)]/60" />
            </div>
            <Button type="submit" disabled={saving} className="btn-signal w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
            </Button>
          </form>
        )}

        <div className="mt-10 rounded-2xl border border-[color:var(--color-status-risk)]/30 bg-[var(--color-bg-elevated)] p-5">
          <p className="font-display text-base text-[color:var(--color-cream)]">Zona de peligro</p>
          <p className="mt-1 text-xs text-[color:var(--color-cream)]/60">Cerrar sesión te llevará al inicio. Tus cartas seguirán guardadas.</p>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut()
              navigate({ to: '/' })
            }}
            className="mt-4 inline-flex items-center gap-2 border-[color:var(--color-status-risk)]/40 bg-transparent text-[color:var(--color-cream)] hover:bg-[var(--color-status-risk)]/10"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </main>
    </AppShell>
  )
}
