import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogOut, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { supabase } from '@/integrations/supabase/client'
import { businessesApi } from '@/lib/api/businesses'
import { useOwnedBusiness } from '@/hooks/use-owned-business'

export function AccountSettingsTab() {
  const navigate = useNavigate()
  const { businessId } = useOwnedBusiness()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
      setNewEmail(data.user?.email ?? '')
      setLoading(false)
    })
  }, [])

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) {
      toast.error('No pudimos cambiar la contraseña', { description: error.message })
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Contraseña actualizada')
  }

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim() || newEmail === email) return
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setSavingEmail(false)
    if (error) {
      toast.error('No pudimos cambiar el email', { description: error.message })
      return
    }
    toast.success('Revisa tu bandeja para confirmar el nuevo email')
  }

  const signOutEverywhere = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut({ scope: 'global' })
      localStorage.removeItem('nexoleal:current-business-id')
      localStorage.removeItem('nexoleal:staff-key')
      navigate({ to: '/login' })
    } finally {
      setSigningOut(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== 'ELIMINAR') return
    setDeleting(true)
    try {
      if (businessId) {
        await businessesApi.update(businessId, { isActive: false }).catch(() => undefined)
      }
      await supabase.auth.signOut({ scope: 'global' })
      localStorage.clear()
      toast.success('Cuenta cerrada. Contacta soporte si necesitas borrado total de datos.')
      navigate({ to: '/' })
    } catch {
      toast.error('No pudimos completar la eliminación')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
      setDeleteConfirm('')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-ink-soft)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="surface-paper p-6">
        <h2 className="font-display text-lg font-semibold">Cambiar contraseña</h2>
        <form onSubmit={changePassword} className="mt-4 max-w-md space-y-4">
          <div>
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" disabled={savingPassword || !newPassword}>
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar contraseña'}
          </Button>
        </form>
      </section>

      <section className="surface-paper p-6">
        <h2 className="font-display text-lg font-semibold">Cambiar email</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Email actual: <span className="font-medium text-[color:var(--color-ink)]">{email}</span>
        </p>
        <form onSubmit={changeEmail} className="mt-4 max-w-md space-y-4">
          <div>
            <Label htmlFor="new-email">Nuevo email</Label>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" disabled={savingEmail || newEmail === email} className="gap-2">
            {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Guardar email
          </Button>
        </form>
      </section>

      <section className="surface-paper p-6">
        <h2 className="font-display text-lg font-semibold">Sesiones</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Cierra sesión en todos los dispositivos donde iniciaste con esta cuenta.
        </p>
        <Button variant="outline" className="mt-4 gap-2" onClick={signOutEverywhere} disabled={signingOut}>
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Cerrar sesión en todos lados
        </Button>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[color:var(--color-status-risk)]/30 bg-[color:var(--color-status-risk)]/5 p-6">
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-status-risk)]">
          Eliminar cuenta
        </h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Esta acción cierra tu sesión y pausa tus negocios. Es irreversible desde la app.
        </p>
        <Button variant="destructive" className="mt-4 gap-2" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" /> Eliminar mi cuenta
        </Button>
      </section>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteConfirm('') }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Escribe <strong>ELIMINAR</strong> para confirmar. Perderás acceso al panel de propietario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="ELIMINAR"
            aria-label="Confirmación de eliminación de cuenta"
            className="font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirm !== 'ELIMINAR' || deleting}
              onClick={deleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
