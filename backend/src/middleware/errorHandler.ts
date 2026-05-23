import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types/env'
import { err } from '../types/api'

export function errorHandler(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      console.error('[errorHandler]', error)
      return c.json(err('INTERNAL_ERROR', 'An unexpected error occurred'), 500)
    }
  }
}
