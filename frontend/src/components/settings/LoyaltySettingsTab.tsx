import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { businessesApi } from '@/lib/api/businesses'
import { loadBusinessProfileExtras } from '@/lib/business-profile-storage'
import { ApiError } from '@/lib/api-client'
import { LoyaltyCardPreview } from './LoyaltyCardPreview'

interface LoyaltySettingsTabProps {
  businessId: string
  businessName: string
}

export function LoyaltySettingsTab({ businessId, businessName }: LoyaltySettingsTabProps) {
  const qc = useQueryClient()
  const extras = loadBusinessProfileExtras(businessId)

  const config = useQuery({
    queryKey: ['business', businessId, 'loyalty-config'],
    queryFn: () => businessesApi.getLoyaltyConfig(businessId),
  })

  const [stampsRequired, setStampsRequired] = useState(10)
  const [rewardDescription, setRewardDescription] = useState('')

  useEffect(() => {
    if (config.data?.loyaltyConfig) {
      setStampsRequired(config.data.loyaltyConfig.stamps_required)
      setRewardDescription(config.data.loyaltyConfig.reward_description)
    }
  }, [config.data])

  const save = useMutation({
    mutationFn: () =>
      businessesApi.updateLoyaltyConfig(businessId, {
        stampsRequired,
        rewardDescription: rewardDescription.trim(),
      }),
    onSuccess: () => {
      toast.success('Programa de lealtad actualizado')
      qc.invalidateQueries({ queryKey: ['business', businessId, 'loyalty-config'] })
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  if (config.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-ink-soft)]" />
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <section className="surface-paper p-6">
        <h2 className="font-display text-lg font-semibold">Programa de lealtad</h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Define cuántas visitas se necesitan para la recompensa.
        </p>

        <Alert className="mt-5 border-[color:var(--color-status-warn)]/30 bg-[color:var(--color-status-warn)]/10">
          <AlertTriangle className="h-4 w-4 text-[color:var(--color-status-warn)]" />
          <AlertDescription>
            Cambiar el número de sellos no afecta a clientes existentes en curso.
          </AlertDescription>
        </Alert>

        <div className="mt-8 space-y-8">
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Sellos requeridos</Label>
              <span className="font-display text-2xl font-semibold tabular-nums">{stampsRequired}</span>
            </div>
            <Slider
              className="mt-4"
              min={3}
              max={20}
              step={1}
              value={[stampsRequired]}
              onValueChange={([v]) => setStampsRequired(v)}
              aria-label="Sellos requeridos"
            />
            <p className="mt-2 text-xs text-[color:var(--color-ink-soft)]">Entre 3 y 20 visitas</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="reward-desc">Descripción de la recompensa</Label>
              <span className="text-xs text-[color:var(--color-ink-soft)] tabular-nums">
                {rewardDescription.length}/140
              </span>
            </div>
            <Textarea
              id="reward-desc"
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value.slice(0, 140))}
              rows={3}
              className="mt-1.5"
              placeholder="Ej: Café gratis en tu próxima visita"
            />
          </div>
        </div>

        <Button className="mt-6" onClick={() => save.mutate()} disabled={save.isPending || !rewardDescription.trim()}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar programa'}
        </Button>
      </section>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
          Vista previa
        </p>
        <LoyaltyCardPreview
          businessName={businessName}
          stampsRequired={stampsRequired}
          rewardDescription={rewardDescription}
          primaryColor={extras.primaryColor}
          logoUrl={extras.logoUrl}
        />
      </div>
    </div>
  )
}
