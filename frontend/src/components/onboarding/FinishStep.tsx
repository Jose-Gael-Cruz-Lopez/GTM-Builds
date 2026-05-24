import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { QRCodeCanvas } from 'qrcode.react'
import { jsPDF } from 'jspdf'
import {
  AlertTriangle,
  Copy,
  Download,
  KeyRound,
  Loader2,
  MessageCircle,
  QrCode,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CreateStaffKeyResponse } from '@/lib/api/businesses'
import { tokens } from '@/lib/theme'

interface FinishStepProps {
  businessId: string
  businessName: string
  tagline: string
  joinUrl: string
  staffKey: CreateStaffKeyResponse | undefined
  staffKeyLoading: boolean
  staffKeyError: boolean
}

function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Share2
  title: string
  children: React.ReactNode
}) {
  return (
    <article className="surface-paper flex flex-col p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-cream)] text-[color:var(--color-ink)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-3 flex flex-1 flex-col gap-3 text-sm text-[color:var(--color-ink-soft)]">
        {children}
      </div>
    </article>
  )
}

export function FinishStep({
  businessId,
  businessName,
  tagline,
  joinUrl,
  staffKey,
  staffKeyLoading,
  staffKeyError,
}: FinishStepProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  const whatsappMessage = `¡Hola! Únete a mi programa de lealtad y gana recompensas: ${joinUrl}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  const copyJoinUrl = () => {
    void navigator.clipboard.writeText(joinUrl)
    toast.success('Enlace copiado')
  }

  const copyStaffKey = () => {
    const value = staffKey?.headerValue ?? ''
    void navigator.clipboard.writeText(value)
    toast.success('Llave copiada')
  }

  const downloadPng = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) {
      toast.error('No pudimos generar la imagen')
      return
    }
    const link = document.createElement('a')
    link.download = `nexoleal-qr-${businessId.slice(0, 8)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('QR descargado')
  }

  const downloadPdf = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) {
      toast.error('No pudimos generar el PDF')
      return
    }
    const imgData = canvas.toDataURL('image/png')
    const doc = new jsPDF({ unit: 'mm', format: 'a6' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(businessName, pageW / 2, margin + 4, { align: 'center', maxWidth: pageW - margin * 2 })

    if (tagline) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(74, 81, 96)
      doc.text(tagline, pageW / 2, margin + 12, { align: 'center', maxWidth: pageW - margin * 2 })
    }

    const qrSize = 70
    const qrX = (pageW - qrSize) / 2
    const qrY = tagline ? margin + 18 : margin + 14
    doc.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize)

    doc.setFontSize(8)
    doc.setTextColor(10, 15, 30)
    doc.text('Escanea para unirte al programa', pageW / 2, qrY + qrSize + 8, { align: 'center' })

    doc.save(`nexoleal-qr-${businessId.slice(0, 8)}.pdf`)
    toast.success('PDF descargado')
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display text-2xl font-semibold">¡Tu negocio está listo!</h2>
        <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
          Comparte, imprime y configura tu equipo para empezar a sumar clientes frecuentes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard icon={Share2} title="Comparte con tus clientes">
          <p>Envía este enlace para que se unan a tu programa de lealtad.</p>
          <div className="flex gap-2">
            <Input readOnly value={joinUrl} className="font-mono text-xs" aria-label="Enlace para unirse" />
            <Button type="button" variant="outline" size="icon" onClick={copyJoinUrl} aria-label="Copiar enlace">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" variant="outline" className="w-full" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Compartir por WhatsApp
            </a>
          </Button>
        </FeatureCard>

        <FeatureCard icon={QrCode} title="Imprime tu QR">
          <p>Código listo para mostrador o redes sociales.</p>
          <div
            ref={qrRef}
            className="mx-auto w-full max-w-[320px] overflow-hidden rounded-xl bg-[var(--color-cream)] p-4"
          >
            <QRCodeCanvas
              value={joinUrl}
              size={320}
              level="M"
              fgColor={tokens.color.ink}
              bgColor={tokens.color.cream}
              className="h-auto w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
              <Download className="h-4 w-4" /> PNG
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadPdf}>
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </FeatureCard>

        <FeatureCard icon={KeyRound} title="Configura tu primer staff key">
          <p>Tu personal usará esta llave para escanear códigos QR desde la caja.</p>
          {staffKeyLoading && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Generando llave…
            </div>
          )}
          {staffKeyError && (
            <p className="text-sm text-destructive">
              No pudimos generar la llave. Recarga la página para intentarlo de nuevo.
            </p>
          )}
          {staffKey?.headerValue && (
            <>
              <div className="rounded-lg border border-dashed bg-[var(--surface-soft)] p-3">
                <code className="break-all font-mono text-xs">{staffKey.headerValue}</code>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-[color-mix(in_srgb,var(--color-status-warn)_12%,white)] p-3 text-xs text-[color:var(--color-ink)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-status-warn)]" />
                <span>Guárdalo: solo se muestra una vez.</span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyStaffKey}>
                <Copy className="h-4 w-4" /> Copiar llave
              </Button>
            </>
          )}
        </FeatureCard>
      </div>

      <div className="flex justify-center pt-2">
        <Button size="lg" className="btn-signal min-w-[220px]" asChild>
          <Link to="/dashboard/$businessId" params={{ businessId }}>
            Ir a mi panel
          </Link>
        </Button>
      </div>
    </div>
  )
}
