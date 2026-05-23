import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../index'

describe('Health check', () => {
  it('GET /health returns 200', async () => {
    const request = new Request('http://localhost/health')
    const response = await app.fetch(request, env)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { success: boolean; data: { status: string } }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
  })
})
