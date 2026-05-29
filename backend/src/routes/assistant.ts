import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireAdmin } from '../middleware/auth'
import { strictRateLimit, rateLimit } from '../middleware/rateLimit'
import { createSupabaseClient } from '../lib/supabase'
import { analyzeBusinessInsights, type AssistantAnalysisContext } from '../lib/nim'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const assistantRoutes = new Hono<HonoEnv>()

// ─── Date helper ──────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ─── Cache key ────────────────────────────────────────────────────────────────
// Exported so other routes (visits, campaign creation, loyalty updates) can
// invalidate the assistant cache when underlying data changes.
//
// The ':v1:' segment is a payload-shape version. If the cached response shape
// changes (new required field, renamed key), bump to ':v2:' and old entries
// become unreachable and expire naturally — no risk of returning misshapen
// data after a deploy. The cron sweep prefix stays 'assistant:analyze:' so
// it catches all versions during transitions.

export const analyzeCacheKey = (businessId: string) => `assistant:analyze:v1:${businessId}`

// 30 min — long enough to make repeat dashboard presses feel instant, short
// enough that organic data drift is bounded. Explicit invalidation handles
// the data-changed case faster than the TTL.
const ANALYZE_CACHE_TTL_SECONDS = 1800

// ─── POST /businesses/:id/assistant/analyze ───────────────────────────────────
// Gathers the last 15 days of visits (or last 500 within 30 days if sparse),
// computes segment counts, then calls NVIDIA NIM for insights. The full
// response is cached in KV so repeat dashboard presses don't re-run a 253B
// model that takes ~15–30s end-to-end. Pass ?refresh=true to bypass.

assistantRoutes.post(
  '/:id/assistant/analyze',
  requireAdmin(),
  strictRateLimit(),
  async (c) => {
    const businessId = c.req.param('id')
    const refresh = c.req.query('refresh') === 'true'
    const cacheKey = analyzeCacheKey(businessId)

    if (!refresh) {
      const cached = (await c.env.ANALYTICS_CACHE.get(cacheKey, 'json')) as Record<
        string,
        unknown
      > | null
      if (cached) {
        return c.json(ok({ ...cached, cached: true }), 200)
      }
    }

    const db = createSupabaseClient(c.env, 'service')

    const [business, allLoyalties] = await Promise.all([
      db.getOne('businesses', {
        filters: [{ column: 'id', operator: 'eq', value: businessId }],
      }),
      db.get('client_business_loyalty', {
        filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
      }),
    ])

    if (!business) {
      return c.json(err('NOT_FOUND', 'Business not found'), 404)
    }

    // Visits from last 30 days (cap 500, ordered newest first)
    const thirtyDayVisits = await db.get('visits', {
      filters: [
        { column: 'business_id', operator: 'eq', value: businessId },
        { column: 'created_at', operator: 'gte', value: daysAgo(30) },
      ],
      order: 'created_at.desc',
      limit: 500,
    })

    // Use last 15 days if >= 50 visits; otherwise expand to 30 days (max 500)
    const fifteenDayCutoff = new Date(daysAgo(15))
    const fifteenDayVisits = thirtyDayVisits.filter(
      (v) => new Date(v.created_at) >= fifteenDayCutoff
    )
    const analysisVisits = fifteenDayVisits.length >= 50 ? fifteenDayVisits : thirtyDayVisits
    const periodDays = fifteenDayVisits.length >= 50 ? 15 : 30

    // When the business has no real data yet, use demo numbers that match the
    // dashboard's demo preview so the AI assistant and the dashboard are consistent.
    const isDemo = allLoyalties.length === 0 && thirtyDayVisits.length === 0

    if (isDemo) {
      const demoCtx: AssistantAnalysisContext = {
        businessName: business.name,
        category: business.category,
        periodDays: 30,
        visitCount: 372,
        totalClients: 127,
        newClients: 23,
        frequentClients: 84,
        lostClients: 15,
        atRiskClients: 28,
        peakDay: 'Sábado',
        slowDay: 'Lunes',
        peakHour: '5pm',
        slowHour: '7am',
      }

      const { insights, usedFallback } = await analyzeBusinessInsights(c.env.NIM_API_KEY, demoCtx)

      const demoPayload = {
        periodDays: 30,
        visitCount: 372,
        uniqueClientsInPeriod: 84,
        segments: {
          total: 127,
          newClients: 23,
          frequentClients: 84,
          lostClients: 15,
          atRiskClients: 28,
        },
        peakDay: 'Sábado',
        slowDay: 'Lunes',
        peakHour: '5pm',
        slowHour: '7am',
        insights,
        usedFallback,
        isDemo: true,
        generatedAt: new Date().toISOString(),
      }

      // Only cache successful (non-fallback) responses — caching a fallback
      // would lock the user into the generic copy for 30 minutes.
      if (!usedFallback) {
        await c.env.ANALYTICS_CACHE.put(cacheKey, JSON.stringify(demoPayload), {
          expirationTtl: ANALYZE_CACHE_TTL_SECONDS,
        }).catch(console.error)
      }

      return c.json(ok(demoPayload), 200)
    }

    // Compute unique client IDs from analysis visits
    const visitClientIds = new Set(analysisVisits.map((v) => v.client_id))

    // Segment counts from loyalty data
    const thirtyDaysAgoDate = new Date(daysAgo(30))
    const newClients = allLoyalties.filter(
      (l) => new Date(l.created_at) >= thirtyDaysAgoDate && l.total_visits <= 2
    ).length
    const frequentClients = allLoyalties.filter(
      (l) => l.total_visits >= 4 && l.status === 'active'
    ).length
    const lostClients = allLoyalties.filter((l) => l.status === 'lost').length
    const atRiskClients = allLoyalties.filter((l) => l.status === 'at_risk').length

    // Peak/slow day from analysis visits
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const dayCounts = Array(7).fill(0) as number[]
    const hourCounts = Array(24).fill(0) as number[]

    analysisVisits.forEach((v) => {
      const d = new Date(v.created_at)
      dayCounts[d.getDay()] = (dayCounts[d.getDay()] ?? 0) + 1
      hourCounts[d.getHours()] = (hourCounts[d.getHours()] ?? 0) + 1
    })

    const peakDayIdx = dayCounts.indexOf(Math.max(...dayCounts))
    const slowDayIdx = dayCounts.indexOf(Math.min(...dayCounts))
    const peakHourIdx = hourCounts.indexOf(Math.max(...hourCounts))
    const slowHourIdx = hourCounts.indexOf(Math.min(...hourCounts))

    const formatHour = (h: number) =>
      h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`

    const ctx: AssistantAnalysisContext = {
      businessName: business.name,
      category: business.category,
      periodDays,
      visitCount: analysisVisits.length,
      totalClients: allLoyalties.length,
      newClients,
      frequentClients,
      lostClients,
      atRiskClients,
      peakDay: dayNames[peakDayIdx] ?? 'Desconocido',
      slowDay: dayNames[slowDayIdx] ?? 'Desconocido',
      peakHour: formatHour(peakHourIdx),
      slowHour: formatHour(slowHourIdx),
    }

    const { insights, usedFallback } = await analyzeBusinessInsights(c.env.NIM_API_KEY, ctx)

    const payload = {
      periodDays,
      visitCount: analysisVisits.length,
      uniqueClientsInPeriod: visitClientIds.size,
      segments: {
        total: allLoyalties.length,
        newClients,
        frequentClients,
        lostClients,
        atRiskClients,
      },
      peakDay: ctx.peakDay,
      slowDay: ctx.slowDay,
      peakHour: ctx.peakHour,
      slowHour: ctx.slowHour,
      insights,
      usedFallback,
      isDemo: false,
      generatedAt: new Date().toISOString(),
    }

    // Only cache successful (non-fallback) responses — see demo branch above.
    if (!usedFallback) {
      await c.env.ANALYTICS_CACHE.put(cacheKey, JSON.stringify(payload), {
        expirationTtl: ANALYZE_CACHE_TTL_SECONDS,
      }).catch(console.error)
    }

    return c.json(ok(payload), 200)
  }
)

// ─── POST /businesses/:id/assistant/campaign ──────────────────────────────────
// Creates a discount campaign for a specific segment (lost / frequent / new).
// Body: { segment, discountPct, durationDays }

assistantRoutes.post(
  '/:id/assistant/campaign',
  requireAdmin(),
  rateLimit({ keyPrefix: 'assistant-campaign' }),
  async (c) => {
    const businessId = c.req.param('id')
    const body = await c.req.json<{
      segment: 'lost' | 'frequent' | 'new'
      discountPct: number
      durationDays: number
    }>().catch(() => null)

    if (!body) {
      return c.json(err('VALIDATION_ERROR', 'JSON body required'), 400)
    }

    const { segment, discountPct, durationDays } = body

    if (!['lost', 'frequent', 'new'].includes(segment)) {
      return c.json(err('VALIDATION_ERROR', 'segment must be: lost, frequent, or new'), 400)
    }
    if (!Number.isFinite(discountPct) || discountPct < 1 || discountPct > 80) {
      return c.json(err('VALIDATION_ERROR', 'discountPct must be between 1 and 80'), 400)
    }
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 90) {
      return c.json(err('VALIDATION_ERROR', 'durationDays must be between 1 and 90'), 400)
    }

    const db = createSupabaseClient(c.env, 'service')

    const business = await db.getOne('businesses', {
      filters: [{ column: 'id', operator: 'eq', value: businessId }],
    })

    if (!business) {
      return c.json(err('NOT_FOUND', 'Business not found'), 404)
    }

    // Count target clients
    const allLoyalties = await db.get('client_business_loyalty', {
      filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
    })

    let targetAudience = 0
    let targetSegmentDb: 'lost' | 'frequent' | 'all' | 'at_risk' = 'all'
    let title = ''
    let messageTemplate = ''

    if (segment === 'lost') {
      targetAudience = allLoyalties.filter((l) => l.status === 'lost').length
      targetSegmentDb = 'lost'
      title = `Reactivación con ${discountPct}% de descuento`
      messageTemplate = `¡Hola {name}! Te extrañamos en {businessName}. 😊 Por eso queremos ofrecerte un ${discountPct}% de descuento exclusivo en tu próxima visita. Tienes ${durationDays} días para aprovecharlo. ¡Te esperamos!`
    } else if (segment === 'frequent') {
      targetAudience = allLoyalties.filter((l) => l.total_visits >= 4 && l.status === 'active').length
      targetSegmentDb = 'frequent'
      title = `Premio de lealtad: ${discountPct}% para clientes frecuentes`
      messageTemplate = `¡{name}! En {businessName} queremos premiarte por tu lealtad. 🏆 Tienes un ${discountPct}% de descuento especial en tu próxima visita. ¡Es nuestra forma de agradecerte! Vigente por ${durationDays} días.`
    } else {
      targetAudience = allLoyalties.filter((l) => l.total_visits <= 2).length
      targetSegmentDb = 'all'
      title = `Bienvenida: ${discountPct}% para nuevos clientes`
      messageTemplate = `¡Bienvenido {name}! En {businessName} queremos que seas parte de nuestra familia. 🎉 Por eso tienes un ${discountPct}% de descuento en tu próxima visita. ¡Tienes ${durationDays} días para usarlo!`
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    const [campaign] = await db.post('campaigns', {
      business_id: businessId,
      title,
      message_template: messageTemplate,
      target_segment: targetSegmentDb,
      send_timing: `Vigente por ${durationDays} días (hasta ${expiresAt.toLocaleDateString('es-MX')})`,
      expected_lift: `${discountPct}% descuento para ${targetAudience} cliente${targetAudience !== 1 ? 's' : ''}`,
      status: 'draft',
      generated_by: 'assistant',
    })

    // Creating a campaign doesn't change the underlying segment data, but
    // the assistant's recommendations reference active campaigns — bust the
    // cache so the next analyze reflects the new state.
    await c.env.ANALYTICS_CACHE.delete(analyzeCacheKey(businessId)).catch(console.error)

    return c.json(
      ok({
        campaign,
        targetAudience,
        discountPct,
        durationDays,
        expiresAt: expiresAt.toISOString(),
      }),
      201
    )
  }
)

// ─── PATCH /businesses/:id/assistant/loyalty ──────────────────────────────────
// Updates the loyalty config stamps_required and reward_description.
// Body: { visitsRequired, rewardDescription? }

assistantRoutes.patch(
  '/:id/assistant/loyalty',
  requireAdmin(),
  rateLimit({ keyPrefix: 'assistant-loyalty' }),
  async (c) => {
    const businessId = c.req.param('id')
    const body = await c.req.json<{
      visitsRequired: number
      rewardDescription?: string
    }>().catch(() => null)

    if (!body) {
      return c.json(err('VALIDATION_ERROR', 'JSON body required'), 400)
    }

    const { visitsRequired, rewardDescription } = body

    if (!Number.isFinite(visitsRequired) || visitsRequired < 2 || visitsRequired > 50) {
      return c.json(err('VALIDATION_ERROR', 'visitsRequired must be between 2 and 50'), 400)
    }

    const db = createSupabaseClient(c.env, 'service')

    const existingConfig = await db.getOne('loyalty_configs', {
      filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
    })

    const description = rewardDescription ?? `Recompensa especial por ser cliente frecuente`

    if (existingConfig) {
      const [updated] = await db.patch(
        'loyalty_configs',
        { stamps_required: visitsRequired, reward_description: description },
        [{ column: 'business_id', operator: 'eq', value: businessId }]
      )
      await c.env.ANALYTICS_CACHE.delete(analyzeCacheKey(businessId)).catch(console.error)
      return c.json(ok({ loyaltyConfig: updated, action: 'updated' }), 200)
    } else {
      const [created] = await db.post('loyalty_configs', {
        business_id: businessId,
        stamps_required: visitsRequired,
        reward_description: description,
        is_active: true,
      })
      await c.env.ANALYTICS_CACHE.delete(analyzeCacheKey(businessId)).catch(console.error)
      return c.json(ok({ loyaltyConfig: created, action: 'created' }), 201)
    }
  }
)
