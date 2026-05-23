import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from './middleware/errorHandler'
import { tokenRoutes } from './routes/tokens'
import { businessRoutes } from './routes/businesses'
import { clientRoutes } from './routes/clients'
import { visitRoutes } from './routes/visits'
import { analyticsRoutes } from './routes/analytics'
import { campaignRoutes } from './routes/campaigns'
import { recalculateClientStatuses } from './cron'
import type { Env } from './types/env'
import type { ContextVariables } from './types/api'

const app = new Hono<{ Bindings: Env; Variables: ContextVariables }>()

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use('*', logger())
app.use('*', async (c, next) => {
  const allowList = c.env.FRONTEND_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return cors({
    origin: (origin) => (origin && allowList.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Staff-Key'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
  })(c, next)
})
app.use('*', errorHandler())

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({ success: true, data: { status: 'ok', version: '0.1.0', ts: new Date().toISOString() } })
)

// ─── Route Mounts ─────────────────────────────────────────────────────────────
app.route('/tokens', tokenRoutes)
app.route('/visits', visitRoutes)
app.route('/clients', clientRoutes)
// /businesses is shared between three route files: base business CRUD,
// analytics (paths like /:id/retention), and campaigns (paths like /:id/campaigns).
app.route('/businesses', businessRoutes)
app.route('/businesses', analyticsRoutes)
app.route('/businesses', campaignRoutes)

// ─── Scheduled (cron) Handler ─────────────────────────────────────────────────
// Triggered by `[triggers] crons` entries in wrangler.toml. Currently:
//   • "0 3 * * *"  → daily 03:00 UTC, recalculate active/at_risk/lost.

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const started = Date.now()
        try {
          const result = await recalculateClientStatuses(env)
          console.log(
            `[cron] recalculateClientStatuses cron=${controller.cron} ` +
              `scanned=${result.scanned} updated=${result.updated} ` +
              `errors=${result.errors} took=${Date.now() - started}ms`
          )
        } catch (e) {
          console.error('[cron] recalculateClientStatuses failed', e)
        }
      })()
    )
  },
} satisfies ExportedHandler<Env>
