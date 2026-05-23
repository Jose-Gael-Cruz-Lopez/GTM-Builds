import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { visitsApi } from "@/lib/api/visits"
import { ApiError } from "@/lib/api-client"
import {
  CheckCircle2,
  XCircle,
  Camera,
  KeyRound,
  Loader2,
  ScanLine,
} from "lucide-react"

export const Route = createFileRoute("/scan")({
  component: ScanPage,
  head: () => ({ meta: [{ title: "Escáner de visitas · NexoLeal" }] }),
})

type ScanState =
  | { kind: "prompt-key" }
  | { kind: "ready" }
  | { kind: "scanning" }
  | { kind: "processing" }
  | { kind: "success"; payload: SuccessPayload }
  | { kind: "error"; code: string; message: string }

interface SuccessPayload {
  clientName: string
  stampsCurrent: number
  stampsRequired: number
  rewardUnlocked: boolean
  rewardDescription?: string
}

const STAFF_KEY_STORAGE = "nexoleal:staff-key"

function ScanPage() {
  const [state, setState] = useState<ScanState>(() => {
    const k =
      typeof window !== "undefined"
        ? localStorage.getItem(STAFF_KEY_STORAGE)
        : null
    return k ? { kind: "ready" } : { kind: "prompt-key" }
  })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = "scanner-container"
  const [keyInput, setKeyInput] = useState("")

  const saveKey = (k: string) => {
    const trimmed = k.trim()
    if (!trimmed.includes(":")) {
      toast.error("Formato inválido. Debe ser <businessId>:<key>")
      return
    }
    localStorage.setItem(STAFF_KEY_STORAGE, trimmed)
    setState({ kind: "ready" })
  }

  const clearKey = () => {
    localStorage.removeItem(STAFF_KEY_STORAGE)
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
    setState({ kind: "prompt-key" })
  }

  useEffect(() => {
    if (state.kind !== "scanning") return

    let cancelled = false
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (token) => {
          if (cancelled) return
          cancelled = true
          await scanner.stop().catch(() => {})
          setState({ kind: "processing" })

          try {
            const res = await visitsApi.register({ token })
            const visit = res.visit as {
              id: string
              clientId?: string
              clientName?: string
              businessId?: string
              createdAt?: string
            }
            setState({
              kind: "success",
              payload: {
                clientName: visit.clientName ?? "Cliente",
                stampsCurrent: res.stamps?.current ?? 0,
                stampsRequired: res.stamps?.required ?? 0,
                rewardUnlocked: res.rewardUnlocked,
                rewardDescription: res.reward?.description,
              },
            })
          } catch (e) {
            if (e instanceof ApiError) {
              setState({ kind: "error", code: e.code, message: e.message })
            } else {
              setState({
                kind: "error",
                code: "UNKNOWN",
                message:
                  e instanceof Error ? e.message : "Error desconocido",
              })
            }
          }
        },
        () => {
          /* per-frame scan failure — ignore */
        },
      )
      .catch((e: Error) => {
        const code = e.name === "NotAllowedError" ? "CAMERA_ERROR" : "CAMERA_ERROR"
        setState({ kind: "error", code, message: e.message })
      })

    return () => {
      cancelled = true
      scanner.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [state.kind])

  useEffect(() => {
    if (state.kind === "success" || state.kind === "error") {
      const t = setTimeout(() => setState({ kind: "scanning" }), 4000)
      return () => clearTimeout(t)
    }
  }, [state.kind])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" />
          <span className="font-display font-semibold">NexoLeal Scanner</span>
        </div>
        {state.kind !== "prompt-key" && (
          <button
            onClick={clearKey}
            className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1"
          >
            <KeyRound className="h-3 w-3" /> Cambiar llave
          </button>
        )}
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {state.kind === "prompt-key" && (
          <div className="rounded-lg bg-white p-6 text-foreground">
            <h2 className="font-display text-xl font-semibold">
              Configurar dispositivo
            </h2>
            <p className="muted-text mt-1 text-sm">
              Pega la llave de staff que recibiste durante la configuración.
              Solo se guarda en este dispositivo.
            </p>
            <Label htmlFor="staffKey" className="mt-4 block">
              Llave del staff
            </Label>
            <Input
              id="staffKey"
              className="mt-2 font-mono text-xs"
              placeholder="businessId:rawKey"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <Button
              className="mt-4 w-full"
              onClick={() => saveKey(keyInput)}
            >
              Guardar y continuar
            </Button>
          </div>
        )}

        {state.kind === "ready" && (
          <div className="rounded-lg bg-white p-6 text-foreground text-center">
            <Camera className="mx-auto h-10 w-10 text-[var(--primary)]" />
            <h2 className="mt-3 font-display text-xl font-semibold">
              Listo para escanear
            </h2>
            <p className="muted-text mt-1 text-sm">
              Activa la cámara y pide al cliente que muestre su código QR.
            </p>
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => setState({ kind: "scanning" })}
            >
              Activar cámara
            </Button>
          </div>
        )}

        {state.kind === "scanning" && (
          <div className="rounded-lg overflow-hidden">
            <div id={containerId} className="w-full" />
            <p className="text-center text-sm text-white/80 mt-4">
              Apunta la cámara al código QR del cliente.
            </p>
          </div>
        )}

        {state.kind === "processing" && (
          <div className="rounded-lg bg-white p-8 text-foreground text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--primary)]" />
            <p className="muted-text mt-4">Registrando visita...</p>
          </div>
        )}

        {state.kind === "success" && (
          <div className="rounded-lg bg-emerald-500 p-8 text-white text-center">
            <CheckCircle2 className="mx-auto h-16 w-16" />
            <h2 className="mt-3 font-display text-2xl font-semibold">
              ¡Visita registrada!
            </h2>
            <p className="mt-1 text-white/90">{state.payload.clientName}</p>
            <div className="mt-4 text-4xl font-bold">
              {state.payload.stampsCurrent} / {state.payload.stampsRequired}
            </div>
            {state.payload.rewardUnlocked && (
              <div className="mt-4 rounded-lg bg-white/20 p-3">
                <p className="text-sm font-semibold">
                  🎉 ¡Recompensa desbloqueada!
                </p>
                <p className="text-xs mt-1">
                  {state.payload.rewardDescription ?? "Premio"}
                </p>
              </div>
            )}
            <p className="mt-4 text-xs text-white/70">
              Volviendo al escáner...
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <ErrorCard code={state.code} message={state.message} />
        )}

        <p className="mt-6 text-center text-[11px] text-white/40">
          Necesitas estar en HTTPS y dar permisos de cámara.
        </p>
      </main>
    </div>
  )
}

function ErrorCard({ code, message }: { code: string; message: string }) {
  const errorMap: Record<string, { title: string; tone: string }> = {
    TOKEN_EXPIRED: { title: "Código expirado", tone: "bg-amber-500" },
    TOKEN_ALREADY_USED: { title: "Código ya usado", tone: "bg-amber-500" },
    TOKEN_INVALID: { title: "Código inválido", tone: "bg-rose-500" },
    NOT_FOUND: { title: "Cliente no registrado", tone: "bg-rose-500" },
    AUTH_INVALID: { title: "Llave de staff inválida", tone: "bg-rose-500" },
    AUTH_MISSING: { title: "Falta llave de staff", tone: "bg-rose-500" },
    CAMERA_ERROR: { title: "Error de cámara", tone: "bg-rose-500" },
  }
  const e = errorMap[code] ?? { title: "Error", tone: "bg-rose-500" }

  return (
    <div className={`rounded-lg ${e.tone} p-8 text-white text-center`}>
      <XCircle className="mx-auto h-16 w-16" />
      <h2 className="mt-3 font-display text-2xl font-semibold">{e.title}</h2>
      <p className="mt-1 text-white/90 text-sm">{message}</p>
      <p className="mt-4 text-xs text-white/70">Volviendo al escáner...</p>
    </div>
  )
}
