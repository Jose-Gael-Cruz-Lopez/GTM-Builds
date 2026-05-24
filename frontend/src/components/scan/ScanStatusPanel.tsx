import { AlertCircle, CheckCircle2, Clock, Loader2, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { RewardParticles } from "./RewardParticles"

export type ScanStatus =
  | { kind: "idle" }
  | { kind: "validating" }
  | {
      kind: "success-stamp"
      clientFirstName: string
      stampsRemaining: number
    }
  | { kind: "success-reward"; rewardDescription: string }
  | { kind: "error-expired" }
  | { kind: "error-used" }
  | { kind: "error-invalid-key"; message?: string }
  | { kind: "error-camera" }
  | { kind: "offline-queued"; count?: number }

interface ScanStatusPanelProps {
  status: ScanStatus
  className?: string
}

export function ScanStatusPanel({ status, className }: ScanStatusPanelProps) {
  const liveMessage = statusToLiveMessage(status)

  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "relative mx-4 mb-6 min-h-[88px] overflow-hidden rounded-[var(--radius-lg)] border border-white/8 bg-[color:var(--color-bg-elevated)] px-5 py-4",
        className,
      )}
    >
      <span className="sr-only">{liveMessage}</span>
      <StatusContent status={status} />
    </section>
  )
}

function StatusContent({ status }: { status: ScanStatus }) {
  switch (status.kind) {
    case "idle":
      return (
        <StatusRow chip={<Chip tone="neutral">Listo</Chip>}>
          <p className="text-sm text-[color:var(--color-cream)]/90">
            Listo para escanear · Acerca el QR del cliente.
          </p>
        </StatusRow>
      )

    case "validating":
      return (
        <StatusRow chip={<Chip tone="signal">Validando...</Chip>}>
          <div className="flex items-center gap-3">
            <FourDotLoader />
            <p className="text-sm text-[color:var(--color-cream)]/80">Validando código...</p>
          </div>
        </StatusRow>
      )

    case "success-stamp":
      return (
        <StatusRow
          chip={
            <Chip tone="good" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}>
              Sello agregado a {status.clientFirstName}
            </Chip>
          }
        >
          <p className="text-sm text-[color:var(--color-cream)]/75">
            {status.stampsRemaining} sellos para la recompensa.
          </p>
        </StatusRow>
      )

    case "success-reward":
      return (
        <div className="relative">
          <RewardParticles />
          <StatusRow
            chip={
              <Chip tone="celebrate" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}>
                ¡Recompensa lista! Entrega: {status.rewardDescription}
              </Chip>
            }
          />
        </div>
      )

    case "error-expired":
      return (
        <StatusRow
          chip={
            <Chip tone="warn" icon={<Clock className="h-3.5 w-3.5" aria-hidden />}>
              Código expirado. Pide al cliente generar uno nuevo.
            </Chip>
          }
        />
      )

    case "error-used":
      return (
        <StatusRow
          chip={
            <Chip tone="risk" icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />}>
              Este código ya fue usado.
            </Chip>
          }
        />
      )

    case "error-invalid-key":
      return (
        <StatusRow
          chip={
            <Chip tone="risk" icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />}>
              {status.message ?? "Llave de staff inválida. Actualízala en configuración."}
            </Chip>
          }
        />
      )

    case "error-camera":
      return (
        <StatusRow
          chip={
            <Chip tone="risk" icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />}>
              Permiso de cámara denegado
            </Chip>
          }
        />
      )

    case "offline-queued":
      return (
        <StatusRow
          chip={
            <Chip tone="warn" icon={<WifiOff className="h-3.5 w-3.5" aria-hidden />}>
              Sin conexión — visita en cola
              {status.count ? ` (${status.count})` : ""}
            </Chip>
          }
        >
          <p className="text-sm text-[color:var(--color-cream)]/75">
            Se registrará automáticamente al reconectar.
          </p>
        </StatusRow>
      )
  }
}

function StatusRow({
  chip,
  children,
}: {
  chip: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      {chip}
      {children}
    </div>
  )
}

type ChipTone = "neutral" | "signal" | "good" | "celebrate" | "warn" | "risk"

function Chip({
  tone,
  icon,
  children,
}: {
  tone: ChipTone
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  const tones: Record<ChipTone, string> = {
    neutral: "bg-white/8 text-[color:var(--color-cream)]",
    signal: "bg-[color:var(--color-signal)]/15 text-[color:var(--color-signal)]",
    good: "bg-[color:var(--color-status-good)]/15 text-[color:var(--color-status-good)]",
    celebrate: "bg-[color:var(--color-celebrate)]/15 text-[color:var(--color-celebrate)]",
    warn: "bg-[color:var(--color-status-warn)]/15 text-[color:var(--color-status-warn)]",
    risk: "bg-[color:var(--color-status-risk)]/15 text-[color:var(--color-status-risk)]",
  }

  return (
    <span
      className={cn(
        "inline-flex min-h-14 max-w-full items-center gap-2 rounded-[var(--radius-pill)] px-4 py-3 text-sm font-medium leading-snug",
        tones[tone],
      )}
    >
      {icon}
      <span>{children}</span>
      {tone === "signal" && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-80" aria-hidden />
      )}
    </span>
  )
}

function FourDotLoader() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[color:var(--color-signal)] animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  )
}

function statusToLiveMessage(status: ScanStatus): string {
  switch (status.kind) {
    case "idle":
      return "Listo para escanear. Acerca el QR del cliente."
    case "validating":
      return "Validando código."
    case "success-stamp":
      return `Sello agregado a ${status.clientFirstName}. ${status.stampsRemaining} sellos para la recompensa.`
    case "success-reward":
      return `Recompensa lista. Entrega: ${status.rewardDescription}.`
    case "error-expired":
      return "Código expirado. Pide al cliente generar uno nuevo."
    case "error-used":
      return "Este código ya fue usado."
    case "error-invalid-key":
      return status.message ?? "Llave de staff inválida."
    case "error-camera":
      return "Permiso de cámara denegado."
    case "offline-queued":
      return "Sin conexión. Visita en cola."
  }
}
