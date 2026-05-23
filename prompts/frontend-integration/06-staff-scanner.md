# 06 — Staff Scanner

**Wave**: 3 (parallel with 04, 05, 07; after Wave 2)
**Working dir**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

The staff scanner is a single-page kiosk-style UI for in-store devices. It:

1. Asks for an `X-Staff-Key` once (paste the `headerValue` issued by `POST /businesses/:id/staff-keys` — format: `<businessId>:<rawKey>`) and stores it in `localStorage['nexoleal:staff-key']`.
2. Activates the device camera, continuously scanning for QR codes via `html5-qrcode` (installed in Wave 1).
3. On a successful scan, `POST /visits` with `{ token }` + the staff key header. Shows a big success card (client name, sellos, reward unlocked or not) for 4 seconds, then resets to scanning.
4. Handles all error codes (TOKEN_EXPIRED, TOKEN_ALREADY_USED, TOKEN_INVALID, NOT_FOUND) with distinct visual feedback.

The staff scanner does **not** require a Supabase JWT — auth is the staff key alone. So `beforeLoad` does NOT redirect to `/login`.

## Prerequisites

- Wave 1: `apiFetch`, `visitsApi`, `html5-qrcode` installed
- Wave 2's onboarding writes `nexoleal:staff-key` to localStorage on completion, but the scanner page must also accept manual paste in case the staff key wasn't stored (e.g. installing on a new device).

## Tasks

### 1. Create `/scan` route

`frontend/src/routes/scan.tsx`.

State machine:

```
PROMPT_KEY → READY → SCANNING → PROCESSING → SUCCESS / ERROR → SCANNING (auto after 4s)
```

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { visitsApi } from "@/lib/api/visits"
import { ApiError } from "@/lib/api-client"
import { CheckCircle2, XCircle, Camera, KeyRound, Loader2, ScanLine } from "lucide-react"

export const Route = createFileRoute("/scan")({
  component: ScanPage,
  head: () => ({ meta: [{ title: "Escáner de visitas · NexoLeal" }] }),
})

type ScanState =
  | { kind: 'prompt-key' }
  | { kind: 'ready' }
  | { kind: 'scanning' }
  | { kind: 'processing' }
  | { kind: 'success'; payload: SuccessPayload }
  | { kind: 'error'; code: string; message: string }

interface SuccessPayload {
  clientName: string
  stampsCurrent: number
  stampsRequired: number
  rewardUnlocked: boolean
  rewardDescription?: string
}

function ScanPage() {
  const [state, setState] = useState<ScanState>(() => {
    const k = typeof window !== 'undefined' ? localStorage.getItem('nexoleal:staff-key') : null
    return k ? { kind: 'ready' } : { kind: 'prompt-key' }
  })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'scanner-container'
  const [keyInput, setKeyInput] = useState('')

  const saveKey = (k: string) => {
    if (!k.includes(':')) {
      toast.error("Formato inválido. Debe ser <businessId>:<key>")
      return
    }
    localStorage.setItem('nexoleal:staff-key', k.trim())
    setState({ kind: 'ready' })
  }

  const clearKey = () => {
    localStorage.removeItem('nexoleal:staff-key')
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
    setState({ kind: 'prompt-key' })
  }

  // Start scanner when entering 'scanning' state
  useEffect(() => {
    if (state.kind !== 'scanning') return

    let cancelled = false
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (token) => {
        if (cancelled) return
        cancelled = true
        await scanner.stop().catch(() => {})
        setState({ kind: 'processing' })

        try {
          const res = await visitsApi.register({ token }, { staffKey: true })
          // success or idempotent replay
          setState({
            kind: 'success',
            payload: {
              clientName: 'clientName' in res.visit ? res.visit.clientName : 'Cliente',
              stampsCurrent: 'stamps' in res ? res.stamps.current : 0,
              stampsRequired: 'stamps' in res ? res.stamps.required : 0,
              rewardUnlocked: res.rewardUnlocked,
              rewardDescription: res.reward?.description,
            },
          })
        } catch (e) {
          const err = e as ApiError
          setState({ kind: 'error', code: err.code, message: err.message })
        }
      },
      () => { /* per-frame scan failure — ignore */ }
    ).catch((e: Error) => {
      setState({ kind: 'error', code: 'CAMERA_ERROR', message: e.message })
    })

    return () => {
      cancelled = true
      scanner.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [state.kind])

  // Auto-return to scanning after 4s on success/error
  useEffect(() => {
    if (state.kind === 'success' || state.kind === 'error') {
      const t = setTimeout(() => setState({ kind: 'scanning' }), 4000)
      return () => clearTimeout(t)
    }
  }, [state.kind])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" />
          <span className="font-display font-semibold">NexoLeal Scanner</span>
        </div>
        {state.kind !== 'prompt-key' && (
          <button onClick={clearKey} className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1">
            <KeyRound className="h-3 w-3" /> Cambiar llave
          </button>
        )}
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {state.kind === 'prompt-key' && (
          <div className="rounded-lg bg-white p-6 text-foreground">
            <h2 className="font-display text-xl font-semibold">Configurar dispositivo</h2>
            <p className="muted-text mt-1 text-sm">
              Pega la llave de staff que recibiste durante la configuración. Solo se guarda en este dispositivo.
            </p>
            <Label htmlFor="staffKey" className="mt-4 block">Llave del staff</Label>
            <Input
              id="staffKey"
              className="mt-2 font-mono text-xs"
              placeholder="businessId:rawKey"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <Button className="mt-4 w-full" onClick={() => saveKey(keyInput)}>
              Guardar y continuar
            </Button>
          </div>
        )}

        {state.kind === 'ready' && (
          <div className="rounded-lg bg-white p-6 text-foreground text-center">
            <Camera className="mx-auto h-10 w-10 text-[var(--primary)]" />
            <h2 className="mt-3 font-display text-xl font-semibold">Listo para escanear</h2>
            <p className="muted-text mt-1 text-sm">
              Activa la cámara y pide al cliente que muestre su código QR.
            </p>
            <Button className="mt-4 w-full" size="lg" onClick={() => setState({ kind: 'scanning' })}>
              Activar cámara
            </Button>
          </div>
        )}

        {state.kind === 'scanning' && (
          <div className="rounded-lg overflow-hidden">
            <div id={containerId} className="w-full" />
            <p className="text-center text-sm text-white/80 mt-4">
              Apunta la cámara al código QR del cliente.
            </p>
          </div>
        )}

        {state.kind === 'processing' && (
          <div className="rounded-lg bg-white p-8 text-foreground text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--primary)]" />
            <p className="muted-text mt-4">Registrando visita...</p>
          </div>
        )}

        {state.kind === 'success' && (
          <div className="rounded-lg bg-emerald-500 p-8 text-white text-center">
            <CheckCircle2 className="mx-auto h-16 w-16" />
            <h2 className="mt-3 font-display text-2xl font-semibold">¡Visita registrada!</h2>
            <p className="mt-1 text-white/90">{state.payload.clientName}</p>
            <div className="mt-4 text-4xl font-bold">
              {state.payload.stampsCurrent} / {state.payload.stampsRequired}
            </div>
            {state.payload.rewardUnlocked && (
              <div className="mt-4 rounded-lg bg-white/20 p-3">
                <p className="text-sm font-semibold">🎉 ¡Recompensa desbloqueada!</p>
                <p className="text-xs mt-1">{state.payload.rewardDescription ?? 'Premio'}</p>
              </div>
            )}
            <p className="mt-4 text-xs text-white/70">Volviendo al escáner...</p>
          </div>
        )}

        {state.kind === 'error' && (
          <ErrorCard code={state.code} message={state.message} />
        )}
      </main>
    </div>
  )
}

function ErrorCard({ code, message }: { code: string; message: string }) {
  const errorMap: Record<string, { title: string; tone: string }> = {
    TOKEN_EXPIRED: { title: 'Código expirado', tone: 'bg-amber-500' },
    TOKEN_ALREADY_USED: { title: 'Código ya usado', tone: 'bg-amber-500' },
    TOKEN_INVALID: { title: 'Código inválido', tone: 'bg-rose-500' },
    NOT_FOUND: { title: 'Cliente no registrado', tone: 'bg-rose-500' },
    AUTH_INVALID: { title: 'Llave de staff inválida', tone: 'bg-rose-500' },
    AUTH_MISSING: { title: 'Falta llave de staff', tone: 'bg-rose-500' },
    CAMERA_ERROR: { title: 'Error de cámara', tone: 'bg-rose-500' },
  }
  const e = errorMap[code] ?? { title: 'Error', tone: 'bg-rose-500' }

  return (
    <div className={`rounded-lg ${e.tone} p-8 text-white text-center`}>
      <XCircle className="mx-auto h-16 w-16" />
      <h2 className="mt-3 font-display text-2xl font-semibold">{e.title}</h2>
      <p className="mt-1 text-white/90 text-sm">{message}</p>
      <p className="mt-4 text-xs text-white/70">Volviendo al escáner...</p>
    </div>
  )
}
```

### 2. Camera permission edge cases

- The first time the scanner is activated, the browser prompts for camera access. If denied, `scanner.start` rejects with a `NotAllowedError` — render an "Activar permisos de cámara" instruction.
- On iOS Safari, the page must be served over HTTPS for camera access. Note this in a small footer note: "Necesitas estar en HTTPS y dar permisos de cámara".

### 3. CSS adjustments

The `html5-qrcode` library injects its own video element into `#scanner-container`. Ensure the container has a fixed aspect ratio so the layout doesn't jump:

```css
#scanner-container {
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
}
```

Add this to `frontend/src/styles.css`.

## Files this prompt creates or modifies

- **Created**: `frontend/src/routes/scan.tsx`
- **Modified**: `frontend/src/styles.css` (one selector block added)

## Done when

- Visiting `/scan` for the first time prompts for a staff key.
- After saving the key, the page shows a "Activar cámara" CTA.
- Activating it shows the camera feed in-page.
- Holding a QR code (from `/wallet/$businessId`) in front of the camera triggers a `POST /visits` that returns 201 with the visit shape.
- The success card displays the client name + stamps + reward (if unlocked).
- After 4 seconds, the scanner resumes automatically.
- Testing an already-used token shows the "Código ya usado" amber card.
- `npx tsc --noEmit` passes.

## Things to avoid

- DO NOT use `setInterval` to poll the camera — `html5-qrcode` handles the loop internally.
- DO NOT validate the token client-side — the backend is the source of truth.
- DO NOT use Supabase auth — the scanner uses the staff key header exclusively.
- DO NOT store the visit response in any global state — render it in the success card and let it disappear after 4s.
- DO NOT render the camera element on SSR — guard with `typeof window !== 'undefined'` if needed (the `useEffect` already handles this in practice).
