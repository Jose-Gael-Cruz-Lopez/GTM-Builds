import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireAdmin } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { createSupabaseClient } from '../lib/supabase'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const analyticsRoutes = new Hono<HonoEnv>()

// ─── Cache helper ─────────────────────────────────────────────────────────────

async function withCache<T>(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const cached = await kv.get(key, 'json') as T | null
  if (cached !== null) return { data: cached, cached: true }

  const data = await compute()
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds })
  return { data, cached: false }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

// ─── GET /businesses/:id/analytics/retention ──────────────────────────────────
// Returns retention rate for 30, 60, and 90-day rolling windows.
// Retention = clients who visited in window / total clients

analyticsRoutes.get(
  '/:id/retention',
  requireAdmin(),
  rateLimit({ keyPrefix: 'analytics' }),
  async (c) => {
    const businessId = c.req.param('id')

    const { data, cached } = await withCache(
      c.env.ANALYTICS_CACHE,
      `analytics:retention:${businessId}`,
      300,
      async () => {
        const db = createSupabaseClient(c.env, 'service')

        const [allLoyalties, visited30d, visited60d, visited90d] = await Promise.all([
          db.get('client_business_loyalty', {
            filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
          }),
          db.get('client_business_loyalty', {
            filters: [
              { column: 'business_id', operator: 'eq', value: businessId },
              { column: 'last_visit_at', operator: 'gte', value: daysAgo(30) },
            ],
          }),
          db.get('client_business_loyalty', {
            filters: [
              { column: 'business_id', operator: 'eq', value: businessId },
              { column: 'last_visit_at', operator: 'gte', value: daysAgo(60) },
            ],
          }),
          db.get('client_business_loyalty', {
            filters: [
              { column: 'business_id', operator: 'eq', value: businessId },
              { column: 'last_visit_at', operator: 'gte', value: daysAgo(90) },
            ],
          }),
        ])

        const total = allLoyalties.length || 1 // avoid division by zero

        return {
          totalClients: allLoyalties.length,
          windows: [
            {
              days: 30,
              label: 'Last 30 days',
              clientCount: visited30d.length,
              retentionRate: Math.round((visited30d.length / total) * 100),
            },
            {
              days: 60,
              label: 'Last 60 days',
              clientCount: visited60d.length,
              retentionRate: Math.round((visited60d.length / total) * 100),
            },
            {
              days: 90,
              label: 'Last 90 days',
              clientCount: visited90d.length,
              retentionRate: Math.round((visited90d.length / total) * 100),
            },
          ],
          statusBreakdown: {
            active: allLoyalties.filter((l) => l.status === 'active').length,
            atRisk: allLoyalties.filter((l) => l.status === 'at_risk').length,
            lost: allLoyalties.filter((l) => l.status === 'lost').length,
          },
          generatedAt: new Date().toISOString(),
        }
      }
    )

    return c.json(ok({ ...data, cached }), 200)
  }
)

// ─── GET /businesses/:id/analytics/visits ────────────────────────────────────
// Daily visit volume for the last 30 days.
// Returns chart-ready { labels, values } format.

analyticsRoutes.get(
  '/:id/visits',
  requireAdmin(),
  rateLimit({ keyPrefix: 'analytics' }),
  async (c) => {
    const businessId = c.req.param('id')
    const url = new URL(c.req.url)
    const days = Math.min(90, parseInt(url.searchParams.get('days') ?? '30', 10))

    const { data, cached } = await withCache(
      c.env.ANALYTICS_CACHE,
      `analytics:visits:${businessId}:${days}`,
      300,
      async () => {
        const db = createSupabaseClient(c.env, 'service')

        const visits = await db.get('visits', {
          filters: [
            { column: 'business_id', operator: 'eq', value: businessId },
            { column: 'created_at', operator: 'gte', value: daysAgo(days) },
          ],
          order: 'created_at.asc',
        })

        // Aggregate by day
        const dailyCounts: Record<string, number> = {}

        // Initialize all days with 0
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          dailyCounts[key] = 0
        }

        // Count visits per day
        visits.forEach((visit) => {
          const d = new Date(visit.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          if (key in dailyCounts) {
            dailyCounts[key] = (dailyCounts[key] ?? 0) + 1
          }
        })

        const labels = Object.keys(dailyCounts).map(formatDateLabel)
        const values = Object.values(dailyCounts)
        const totalVisits = values.reduce((sum, v) => sum + v, 0)
        const avgPerDay = totalVisits > 0 ? Math.round(totalVisits / days) : 0

        // 7-day rolling average
        const rollingAvg = values.map((_, i) => {
          const window = values.slice(Math.max(0, i - 6), i + 1)
          return Math.round(window.reduce((s, v) => s + v, 0) / window.length)
        })

        return {
          labels,
          values,
          rollingAvg,
          totalVisits,
          avgPerDay,
          period: `Last ${days} days`,
          generatedAt: new Date().toISOString(),
        }
      }
    )

    return c.json(ok({ ...data, cached }), 200)
  }
)

// ─── GET /businesses/:id/analytics/clients ────────────────────────────────────
// New vs returning clients breakdown.
// "New" = first visit in the selected period. "Returning" = had a previous visit.

analyticsRoutes.get(
  '/:id/clients',
  requireAdmin(),
  rateLimit({ keyPrefix: 'analytics' }),
  async (c) => {
    const businessId = c.req.param('id')

    const { data, cached } = await withCache(
      c.env.ANALYTICS_CACHE,
      `analytics:clients:${businessId}`,
      300,
      async () => {
        const db = createSupabaseClient(c.env, 'service')

        const [last30Loyalties, last7Loyalties, allLoyalties] = await Promise.all([
          db.get('client_business_loyalty', {
            filters: [
              { column: 'business_id', operator: 'eq', value: businessId },
              { column: 'created_at', operator: 'gte', value: daysAgo(30) },
            ],
          }),
          db.get('client_business_loyalty', {
            filters: [
              { column: 'business_id', operator: 'eq', value: businessId },
              { column: 'created_at', operator: 'gte', value: daysAgo(7) },
            ],
          }),
          db.get('client_business_loyalty', {
            filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
          }),
        ])

        // "New" clients = created their loyalty link in the last 30 days
        const newClients30d = last30Loyalties.length
        const newClients7d = last7Loyalties.length
        const returningClients = allLoyalties.filter((l) => l.total_visits > 1).length
        const singleVisitClients = allLoyalties.filter((l) => l.total_visits === 1).length

        return {
          total: allLoyalties.length,
          newLast30Days: newClients30d,
          newLast7Days: newClients7d,
          returning: returningClients,
          singleVisit: singleVisitClients,
          // Recharts-ready breakdown
          breakdown: {
            labels: ['Active', 'At Risk', 'Lost'],
            values: [
              allLoyalties.filter((l) => l.status === 'active').length,
              allLoyalties.filter((l) => l.status === 'at_risk').length,
              allLoyalties.filter((l) => l.status === 'lost').length,
            ],
          },
          generatedAt: new Date().toISOString(),
        }
      }
    )

    return c.json(ok({ ...data, cached }), 200)
  }
)

// ─── GET /businesses/:id/analytics/peak-hours ─────────────────────────────────
// Heatmap of busiest hours and days based on visit history.
// Returns a 7×24 grid (day-of-week × hour-of-day).

analyticsRoutes.get(
  '/:id/peak-hours',
  requireAdmin(),
  rateLimit({ keyPrefix: 'analytics' }),
  async (c) => {
    const businessId = c.req.param('id')

    const { data, cached } = await withCache(
      c.env.ANALYTICS_CACHE,
      `analytics:peak-hours:${businessId}`,
      3600, // 1 hour cache — this changes slowly
      async () => {
        const db = createSupabaseClient(c.env, 'service')

        // Last 90 days of visits for a meaningful heatmap
        const visits = await db.get('visits', {
          filters: [
            { column: 'business_id', operator: 'eq', value: businessId },
            { column: 'created_at', operator: 'gte', value: daysAgo(90) },
          ],
        })

        // Initialize 7×24 grid with zeros
        // grid[dayOfWeek][hour] = count
        // dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
        const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const hourLabels = Array.from({ length: 24 }, (_, i) =>
          i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`
        )

        visits.forEach((visit) => {
          const d = new Date(visit.created_at)
          const day = d.getDay()
          const hour = d.getHours()
          if (grid[day] && grid[day][hour] !== undefined) {
            grid[day][hour] = (grid[day][hour] ?? 0) + 1
          }
        })

        // Find peak
        let peakDay = 0, peakHour = 0, peakCount = 0
        grid.forEach((hours, d) => {
          hours.forEach((count, h) => {
            if (count > peakCount) {
              peakCount = count
              peakDay = d
              peakHour = h
            }
          })
        })

        return {
          grid,
          dayLabels: dayNames,
          hourLabels,
          peak: {
            day: dayNames[peakDay],
            hour: hourLabels[peakHour],
            visitCount: peakCount,
          },
          totalVisitsAnalyzed: visits.length,
          generatedAt: new Date().toISOString(),
        }
      }
    )

    return c.json(ok({ ...data, cached }), 200)
  }
)

// ─── GET /businesses/:id/analytics/churn-risk ─────────────────────────────────
// Lists clients approaching "lost" status — sorted by urgency.
// Includes days-since-last-visit and a risk score.

analyticsRoutes.get(
  '/:id/churn-risk',
  requireAdmin(),
  rateLimit({ keyPrefix: 'analytics' }),
  async (c) => {
    const businessId = c.req.param('id')

    const { data, cached } = await withCache(
      c.env.ANALYTICS_CACHE,
      `analytics:churn-risk:${businessId}`,
      300,
      async () => {
        const db = createSupabaseClient(c.env, 'service')

        // Get clients who haven't visited in 20+ days (approaching at_risk threshold)
        const cutoff = daysAgo(20)
        const riskLoyalties = await db.get('client_business_loyalty', {
          filters: [
            { column: 'business_id', operator: 'eq', value: businessId },
            { column: 'last_visit_at', operator: 'lt', value: cutoff },
          ],
          order: 'last_visit_at.asc.nullslast',
          limit: 100,
        })

        const clientIds = riskLoyalties.map((l) => l.client_id)
        const clients = clientIds.length > 0
          ? await Promise.all(
              clientIds.map((cid) =>
                db.getOne('clients', { filters: [{ column: 'id', operator: 'eq', value: cid }] })
              )
            )
          : []

        const clientMap = Object.fromEntries(clientIds.map((cid, i) => [cid, clients[i]]))

        const result = riskLoyalties.map((loyalty) => {
          const profile = clientMap[loyalty.client_id]
          const now = Date.now()
          const lastVisit = loyalty.last_visit_at ? new Date(loyalty.last_visit_at).getTime() : 0
          const daysSinceVisit = lastVisit
            ? Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24))
            : null

          // Risk score 0-100: higher = more urgent
          // Formula: min(100, daysSinceVisit / 90 * 100)
          const riskScore = daysSinceVisit !== null
            ? Math.min(100, Math.round((daysSinceVisit / 90) * 100))
            : 100

          return {
            clientId: loyalty.client_id,
            fullName: profile?.full_name ?? 'Unknown',
            phone: profile?.phone ?? null,
            email: profile?.email ?? null,
            status: loyalty.status,
            daysSinceVisit,
            lastVisitAt: loyalty.last_visit_at,
            totalVisits: loyalty.total_visits,
            riskScore,
          }
        })

        // Sort by risk score descending
        result.sort((a, b) => b.riskScore - a.riskScore)

        return {
          clients: result,
          counts: {
            highRisk: result.filter((c) => c.riskScore >= 75).length,   // 67+ days
            mediumRisk: result.filter((c) => c.riskScore >= 45 && c.riskScore < 75).length, // 40-67 days
            earlyRisk: result.filter((c) => c.riskScore < 45).length,   // 20-40 days
          },
          generatedAt: new Date().toISOString(),
        }
      }
    )

    return c.json(ok({ ...data, cached }), 200)
  }
)
