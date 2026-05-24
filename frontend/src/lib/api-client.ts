import { supabase } from '@/integrations/supabase/client'
import { getStaffKey } from '@/lib/staff-key-storage'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://nexoleal-backend.nexoleal.workers.dev'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export interface ApiSuccess<T> { success: true; data: T }
export interface ApiFailure {
  success: false
  error: { code: string; message: string }
}

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  staffKey?: boolean
  timeoutMs?: number
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, staffKey, timeoutMs = 8000, headers, ...rest } = options
  const finalHeaders = new Headers(headers)
  finalHeaders.set('Content-Type', 'application/json')

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    finalHeaders.set('Authorization', `Bearer ${session.access_token}`)
  }

  if (staffKey) {
    const stored = typeof window !== 'undefined' ? await getStaffKey() : null
    if (stored) finalHeaders.set('X-Staff-Key', stored)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeout)
    if ((e as Error).name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'La petición tardó demasiado. Intenta de nuevo.', 0)
    }
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar al servidor.', 0)
  }
  clearTimeout(timeout)

  if (res.status === 204) return undefined as T

  let parsed: ApiSuccess<T> | ApiFailure
  try {
    parsed = await res.json()
  } catch {
    throw new ApiError('INVALID_RESPONSE', `Respuesta inválida (HTTP ${res.status})`, res.status)
  }

  if (!parsed.success) {
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      const seconds = retryAfter ? parseInt(retryAfter, 10) : 60
      toast.error(
        `Demasiadas solicitudes. Intenta de nuevo en ${Number.isFinite(seconds) ? seconds : 60}s.`,
      )
    }
    if ((res.status === 401 || res.status === 403) && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/signup')) {
        window.location.href = `/login?reason=expired&redirect=${encodeURIComponent(path)}`
      }
    }
    throw new ApiError(parsed.error.code, parsed.error.message, res.status)
  }
  return parsed.data
}
