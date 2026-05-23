import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { createSupabaseClient, SupabaseError, mapSupabaseError } from '../lib/supabase'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe('Supabase Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('GET returns parsed rows on success', async () => {
    const rows = [{ id: '1', name: 'Test Biz' }]
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const db = createSupabaseClient(env, 'anon')
    const result = await db.get('businesses')
    expect(result).toEqual(rows)
  })

  it('GET throws SupabaseError on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: '42501', message: 'permission denied' }), { status: 403 })
    )

    const db = createSupabaseClient(env, 'anon')
    await expect(db.get('businesses')).rejects.toThrow(SupabaseError)
  })

  it('getOne returns null when no rows found', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

    const db = createSupabaseClient(env, 'anon')
    const result = await db.getOne('businesses', {
      filters: [{ column: 'id', operator: 'eq', value: 'nonexistent' }],
    })
    expect(result).toBeNull()
  })

  it('mapSupabaseError maps unique constraint to VISIT_DUPLICATE', () => {
    const error = new SupabaseError('23505', 'duplicate key value', 409)
    const mapped = mapSupabaseError(error)
    expect(mapped.code).toBe('VISIT_DUPLICATE')
  })

  it('mapSupabaseError maps unknown SupabaseError to SUPABASE_ERROR', () => {
    const error = new SupabaseError('XXXXX', 'some error', 400)
    const mapped = mapSupabaseError(error)
    expect(mapped.code).toBe('SUPABASE_ERROR')
  })
})
