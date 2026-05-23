import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Env } from '../types/env'
import type { Database } from '../types/db'
import { err } from '../types/api'
import type { ErrorCode } from '../types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type TableName = keyof Database
type Row<T extends TableName> = Database[T]['Row']
type Insert<T extends TableName> = Database[T]['Insert']
type Update<T extends TableName> = Partial<Insert<T>>

type AuthMode = 'anon' | 'service'

interface QueryOptions {
  select?: string         // PostgREST select clause e.g. 'id,name,clients(*)'
  filters?: FilterClause[]
  order?: string          // e.g. 'created_at.desc'
  limit?: number
  offset?: number
  single?: boolean        // adds Accept: application/vnd.pgrst.object+json
  count?: 'exact' | 'planned' | 'estimated'
}

interface FilterClause {
  column: string
  operator: PostgRESTOperator
  value: string | number | boolean | null
}

// PostgREST filter operators
type PostgRESTOperator =
  | 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte'
  | 'like' | 'ilike' | 'is' | 'in' | 'cs' | 'cd'
  | 'ov' | 'sl' | 'sr' | 'nxr' | 'nxl' | 'adj'

interface SupabaseClient {
  get<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T>[]>
  getOne<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T> | null>
  post<T extends TableName>(table: T, body: Insert<T> | Insert<T>[]): Promise<Row<T>[]>
  patch<T extends TableName>(table: T, updates: Update<T>, filters: FilterClause[]): Promise<Row<T>[]>
  delete<T extends TableName>(table: T, filters: FilterClause[]): Promise<void>
  rpc<TArgs extends Record<string, unknown>, TResult>(fn: string, args: TArgs): Promise<TResult>
}

// ─── PostgREST error shape ────────────────────────────────────────────────────

interface PostgRESTError {
  code: string
  details: string | null
  hint: string | null
  message: string
}

// ─── Internal error class ─────────────────────────────────────────────────────

export class SupabaseError extends Error {
  constructor(
    public readonly pgCode: string,
    public readonly pgMessage: string,
    public readonly statusCode: number
  ) {
    super(`Supabase error ${pgCode}: ${pgMessage}`)
    this.name = 'SupabaseError'
  }
}

// ─── Client factory ───────────────────────────────────────────────────────────

export function createSupabaseClient(env: Env, mode: AuthMode = 'anon'): SupabaseClient {
  const baseUrl = `${env.SUPABASE_URL}/rest/v1`
  const apiKey = mode === 'service' ? env.SUPABASE_SERVICE_KEY : env.SUPABASE_ANON_KEY

  function buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Prefer': 'return=representation',
      ...extra,
    }
  }

  function buildUrl(table: string, options?: QueryOptions): string {
    const url = new URL(`${baseUrl}/${table}`)

    if (options?.select) url.searchParams.set('select', options.select)
    if (options?.order) url.searchParams.set('order', options.order)
    if (options?.limit != null) url.searchParams.set('limit', String(options.limit))
    if (options?.offset != null) url.searchParams.set('offset', String(options.offset))

    options?.filters?.forEach(({ column, operator, value }) => {
      const stringValue = value === null ? 'null' : String(value)
      url.searchParams.set(column, `${operator}.${stringValue}`)
    })

    return url.toString()
  }

  async function fetchWithRetry(
    url: string,
    init: RequestInit,
    retries = 2
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, init)
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
        }
      }
    }

    throw lastError ?? new Error('Fetch failed after retries')
  }

  async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return [] as unknown as T

    const text = await response.text()
    let body: unknown

    try {
      body = JSON.parse(text)
    } catch {
      throw new SupabaseError('PARSE_ERROR', `Failed to parse response: ${text}`, response.status)
    }

    if (!response.ok) {
      const pgErr = body as PostgRESTError
      throw new SupabaseError(pgErr.code ?? 'UNKNOWN', pgErr.message ?? 'Unknown error', response.status)
    }

    return body as T
  }

  return {
    async get<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T>[]> {
      const url = buildUrl(table, options)
      const headers = buildHeaders(
        options?.count ? { 'Prefer': `count=${options.count}` } : undefined
      )
      const response = await fetchWithRetry(url, { method: 'GET', headers })
      return handleResponse<Row<T>[]>(response)
    },

    async getOne<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T> | null> {
      const url = buildUrl(table, { ...options, limit: 1 })
      const headers = buildHeaders({ 'Accept': 'application/vnd.pgrst.object+json' })
      const response = await fetchWithRetry(url, { method: 'GET', headers })

      if (response.status === 406) return null // no rows matched + single mode
      if (response.status === 200 && response.headers.get('content-length') === '0') return null

      const body = await handleResponse<Row<T> | Row<T>[]>(response)
      return Array.isArray(body) ? (body[0] ?? null) : body
    },

    async post<T extends TableName>(table: T, body: Insert<T> | Insert<T>[]): Promise<Row<T>[]> {
      const url = `${baseUrl}/${table}`
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      return handleResponse<Row<T>[]>(response)
    },

    async patch<T extends TableName>(
      table: T,
      updates: Update<T>,
      filters: FilterClause[]
    ): Promise<Row<T>[]> {
      const url = buildUrl(table, { filters })
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
      })
      return handleResponse<Row<T>[]>(response)
    },

    async delete<T extends TableName>(table: T, filters: FilterClause[]): Promise<void> {
      const url = buildUrl(table, { filters })
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, { method: 'DELETE', headers })
      if (!response.ok && response.status !== 204) {
        const text = await response.text()
        throw new SupabaseError('DELETE_ERROR', text, response.status)
      }
    },

    async rpc<TArgs extends Record<string, unknown>, TResult>(fn: string, args: TArgs): Promise<TResult> {
      const url = `${baseUrl}/rpc/${fn}`
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(args),
      })
      return handleResponse<TResult>(response)
    },
  }
}

// ─── Convenience: map SupabaseError to API error code ────────────────────────

export function mapSupabaseError(error: unknown): { code: ErrorCode; message: string; status: ContentfulStatusCode } {
  if (error instanceof SupabaseError) {
    if (error.pgCode === '23505') {
      return { code: 'VISIT_DUPLICATE', message: 'A record with this key already exists', status: 409 }
    }
    const status: ContentfulStatusCode =
      error.statusCode >= 500 ? 502 : (error.statusCode as ContentfulStatusCode)
    return { code: 'SUPABASE_ERROR', message: error.pgMessage, status }
  }
  return { code: 'INTERNAL_ERROR', message: 'Unexpected error', status: 500 }
}
