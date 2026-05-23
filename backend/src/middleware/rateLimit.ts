import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { err } from '../types/api'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

interface RateLimitOptions {
  // Override env defaults for specific routes (e.g. stricter limits on token generation)
  maxRequests?: number
  windowSeconds?: number
  // Key prefix to namespace limits per route group
  keyPrefix?: string
}

// ─── Sliding window rate limiter using KV ─────────────────────────────────────
//
// KV key: `rl:{prefix}:{ip}:{windowStart}`
// Value: request count as string
// TTL: windowSeconds * 2 (to allow for overlap between windows)
//
// Algorithm: count requests in the current window. If over limit, reject.
// This is a fixed-window approximation — good enough for abuse prevention.

export function rateLimit(options: RateLimitOptions = {}): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const maxRequests = options.maxRequests ?? parseInt(c.env.RATE_LIMIT_MAX_REQUESTS, 10)
    const windowSeconds = options.windowSeconds ?? parseInt(c.env.RATE_LIMIT_WINDOW_SECONDS, 10)
    const prefix = options.keyPrefix ?? 'global'

    // Get client IP from Cloudflare headers
    const ip =
      c.req.header('CF-Connecting-IP') ??
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
      'unknown'

    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / windowSeconds) * windowSeconds
    const kvKey = `rl:${prefix}:${ip}:${windowStart}`

    // Get current count
    const currentStr = await c.env.RATE_LIMIT.get(kvKey)
    const current = currentStr ? parseInt(currentStr, 10) : 0

    if (current >= maxRequests) {
      const resetAt = windowStart + windowSeconds
      return c.json(
        err('RATE_LIMITED', `Too many requests. Limit: ${maxRequests} per ${windowSeconds}s`),
        429,
        {
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetAt),
          'Retry-After': String(resetAt - now),
        }
      )
    }

    // Increment counter. Awaited (not fire-and-forget) so concurrent requests
    // observe the updated count and rate limiting works correctly under load.
    await c.env.RATE_LIMIT.put(kvKey, String(current + 1), {
      expirationTtl: windowSeconds * 2,
    })

    // Set rate limit headers on successful response
    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(maxRequests - current - 1))
    c.header('X-RateLimit-Reset', String(windowStart + windowSeconds))

    await next()
  }
}

// ─── Strict rate limiter for sensitive endpoints ───────────────────────────────
// Use on: token generation (prevent QR spam), login attempts, campaign generation

export function strictRateLimit(): MiddlewareHandler<HonoEnv> {
  return rateLimit({ maxRequests: 10, windowSeconds: 60, keyPrefix: 'strict' })
}
