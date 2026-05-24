import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { AuthSplit } from '@/components/auth/AuthSplit'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: 'Crear nueva contraseña · NexoLeal' }] }),
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts access_token in the URL hash on email redirect.
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      // The Supabase client picks it up automatically; just wait a tick.
      setTimeout(() => setReady(true), 200)
    } else {
      setReady(true)
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (pwd !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    setSubmitting(false)
    if (error) {
      toast.error('No pudimos actualizar tu contraseña', { description: error.message })
      return
    }
    navigate({ to: '/login', search: { reset: 'ok' } as never })
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <AuthSplit headline="Crea una nueva contraseña." subtitle="Tu cuenta seguirá lista cuando termines.">
      <h2 className="display-md">Nueva contraseña</h2>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="pwd">Nueva contraseña</Label>
          <Input id="pwd" type="password" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" disabled={submitting} className="w-full btn-signal">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar contraseña'}
        </Button>
      </form>
    </AuthSplit>
  )
}
