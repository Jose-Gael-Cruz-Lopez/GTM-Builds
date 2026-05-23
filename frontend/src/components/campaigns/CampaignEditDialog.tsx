import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { campaignsApi } from "@/lib/api/campaigns"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface CampaignEditDialogProps {
  businessId: string
  campaignId: string
  onClose: () => void
}

const VARIABLES = ["{name}", "{days}", "{businessName}", "{stamps}"] as const

export function CampaignEditDialog({
  businessId,
  campaignId,
  onClose,
}: CampaignEditDialogProps) {
  const qc = useQueryClient()
  const [title, setTitle] = useState("")
  const [messageTemplate, setMessageTemplate] = useState("")
  const [sendTiming, setSendTiming] = useState("")
  const [expectedLift, setExpectedLift] = useState("")

  const detail = useQuery({
    queryKey: ['business', businessId, 'campaigns', campaignId],
    queryFn: () => campaignsApi.get(businessId, campaignId),
  })

  useEffect(() => {
    const c = detail.data?.campaign
    if (!c) return
    setTitle(c.title)
    setMessageTemplate(c.message_template)
    setSendTiming(c.send_timing)
    setExpectedLift(c.expected_lift)
  }, [detail.data])

  const save = useMutation({
    mutationFn: () =>
      campaignsApi.update(businessId, campaignId, {
        title,
        messageTemplate,
        sendTiming,
        expectedLift,
      }),
    onSuccess: () => {
      toast.success('Cambios guardados')
      qc.invalidateQueries({ queryKey: ['business', businessId, 'campaigns'] })
      onClose()
    },
    onError: (e: ApiError) => toast.error(e.message),
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Editar campaña</DialogTitle>
          <DialogDescription>
            Ajusta el mensaje y los detalles antes de enviar.
          </DialogDescription>
        </DialogHeader>

        {detail.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate()
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="campaign-title">Título</Label>
              <Input
                id="campaign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-message">Mensaje</Label>
              <Textarea
                id="campaign-message"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={6}
                required
                className="font-mono text-sm"
              />
              <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Variables disponibles:</span>{' '}
                {VARIABLES.map((v, i) => (
                  <span key={v}>
                    <code className="rounded bg-background px-1 py-0.5">{v}</code>
                    {i < VARIABLES.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="campaign-timing">Cuándo enviar</Label>
                <Input
                  id="campaign-timing"
                  value={sendTiming}
                  onChange={(e) => setSendTiming(e.target.value)}
                  placeholder="Ej: Martes 10:00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-lift">Lift esperado</Label>
                <Input
                  id="campaign-lift"
                  value={expectedLift}
                  onChange={(e) => setExpectedLift(e.target.value)}
                  placeholder="Ej: +12% retorno"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={save.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
