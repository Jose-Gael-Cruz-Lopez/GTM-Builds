import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Upload, Pause, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { businessesApi } from '@/lib/api/businesses'
import { BUSINESS_CATEGORY_OPTIONS } from '@/lib/business-categories'
import {
  loadBusinessProfileExtras,
  saveBusinessProfileExtras,
} from '@/lib/business-profile-storage'
import { supabase } from '@/integrations/supabase/client'
import { ApiError } from '@/lib/api-client'
import type { BusinessCategory } from '@/integrations/supabase/types'
import { useNavigate } from '@tanstack/react-router'
import { tokens } from '@/lib/theme'

interface GeneralSettingsTabProps {
  businessId: string
  initialName: string
  initialCategory: BusinessCategory
}

export function GeneralSettingsTab({
  businessId,
  initialName,
  initialCategory,
}: GeneralSettingsTabProps) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const extras = loadBusinessProfileExtras(businessId)

  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState<BusinessCategory>(initialCategory)
  const [tagline, setTagline] = useState(extras.tagline ?? '')
  const [logoUrl, setLogoUrl] = useState(extras.logoUrl ?? '')
  const [primaryColor, setPrimaryColor] = useState(extras.primaryColor ?? tokens.color.signal)
  const [address, setAddress] = useState(extras.address ?? '')
  const [phone, setPhone] = useState(extras.phone ?? '')

  const [pauseOpen, setPauseOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    setName(initialName)
    setCategory(initialCategory)
  }, [initialName, initialCategory])

  const save = useMutation({
    mutationFn: async () => {
      await businessesApi.update(businessId, { name: name.trim() })
      const { error } = await supabase
        .from('businesses')
        .update({ category })
        .eq('id', businessId)
      if (error) throw error
      saveBusinessProfileExtras(businessId, {
        tagline: tagline.trim(),
        logoUrl,
        primaryColor,
        address: address.trim(),
        phone: phone.trim(),
      })
    },
    onSuccess: () => {
      toast.success('Configuración guardada')
      qc.invalidateQueries({ queryKey: ['business', businessId] })
      qc.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (e: ApiError | Error) => {
      toast.error(e instanceof ApiError ? e.message : 'No pudimos guardar')
    },
  })

  const pause = useMutation({
    mutationFn: () => businessesApi.update(businessId, { isActive: false }),
    onSuccess: () => {
      toast.success('Negocio pausado')
      navigate({ to: '/wallet' })
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: async () => {
      await businessesApi.update(businessId, { isActive: false })
      saveBusinessProfileExtras(businessId, {})
    },
    onSuccess: () => {
      toast.success('Negocio eliminado')
      navigate({ to: '/wallet' })
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  const onLogoPick = (file: File | undefined) => {
    if (!file) return
    if (file.size > 512_000) {
      toast.error('El logo debe pesar menos de 500 KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-8">
      <section className="surface-paper p-6">
        <h2 className="font-display text-lg font-semibold">Información general</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Lo que ven tus clientes en su tarjeta de lealtad.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="biz-name">Nombre del negocio</Label>
            <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="biz-category">Categoría</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as BusinessCategory)}>
              <SelectTrigger id="biz-category" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={`${opt.value}-${opt.label}`} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="biz-tagline">Tagline</Label>
            <Input
              id="biz-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tu café favorito en el barrio"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="biz-color">Color primario</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="biz-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-sm" />
            </div>
          </div>

          <div>
            <Label htmlFor="biz-logo">Logo</Label>
            <div className="mt-1.5 flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-cream)]">
                  <Upload className="h-5 w-5 text-[color:var(--color-ink-soft)]" />
                </div>
              )}
              <Input
                id="biz-logo"
                type="file"
                accept="image/*"
                onChange={(e) => onLogoPick(e.target.files?.[0])}
                className="text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="biz-address">Dirección (opcional)</Label>
            <Input id="biz-address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="biz-phone">Teléfono de contacto</Label>
            <Input
              id="biz-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 1234 5678"
              className="mt-1.5"
            />
          </div>
        </div>

        <Button className="mt-6" onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
        </Button>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[color:var(--color-status-risk)]/30 bg-[color:var(--color-status-risk)]/5 p-6">
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-status-risk)]">Zona de peligro</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Pausar oculta tu negocio de nuevos clientes. Eliminar desactiva el programa de forma permanente.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setPauseOpen(true)} className="gap-2">
            <Pause className="h-4 w-4" /> Pausar negocio
          </Button>
          <Button variant="destructive" onClick={() => setDeleteStep(1)} className="gap-2">
            <Trash2 className="h-4 w-4" /> Eliminar negocio
          </Button>
        </div>
      </section>

      <AlertDialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pausar tu negocio?</AlertDialogTitle>
            <AlertDialogDescription>
              Los clientes existentes conservan sus sellos, pero no podrás registrar nuevas visitas hasta reactivarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => pause.mutate()} disabled={pause.isPending}>
              Pausar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteStep === 1} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este negocio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactiva tu programa de lealtad. Tus clientes ya no podrán acumular sellos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteStep(2)}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteStep === 2} onOpenChange={(o) => { if (!o) { setDeleteStep(0); setDeleteConfirm('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmación final</AlertDialogTitle>
            <AlertDialogDescription>
              Escribe <strong>ELIMINAR</strong> para confirmar la eliminación de &quot;{name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="ELIMINAR"
            aria-label="Confirmación de eliminación"
            className="font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirm !== 'ELIMINAR' || remove.isPending}
              onClick={() => remove.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
