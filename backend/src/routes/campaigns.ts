import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireAdmin } from '../middleware/auth'
import { strictRateLimit, rateLimit } from '../middleware/rateLimit'
import { createSupabaseClient, mapSupabaseError, SupabaseError } from '../lib/supabase'
import { generateCampaigns, type BusinessContext } from '../lib/nim'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const campaignRoutes = new Hono<HonoEnv>()

// ─── POST /businesses/:id/campaigns/generate ─────────────────────────────────
// Calls NVIDIA NIM to generate 3 campaign suggestions for the business.
// Saves them as draft campaigns and returns them.
// Apply strict rate limit — NIM calls are expensive (10 req/min per IP).

campaignRoutes.post(
  '/:id/campaigns/generate',
  requireAdmin(),
  strictRateLimit(),
  async (c) => {
    const businessId = c.req.param('id')
    const db = createSupabaseClient(c.env, 'service')

    // Gather business context to build the NIM prompt
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

    const totalClients = allLoyalties.length
    const atRiskClients = allLoyalties.filter((l) => l.status === 'at_risk').length
    const lostClients = allLoyalties.filter((l) => l.status === 'lost').length
    const totalVisits = allLoyalties.reduce((sum, l) => sum + l.total_visits, 0)
    const avgVisitsPerClient = totalClients > 0 ? totalVisits / totalClients : 0

    // Compute peak and slow days from the last 90 days of visit history
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const recentVisits = await db.get('visits', {
      filters: [
        { column: 'business_id', operator: 'eq', value: businessId },
        { column: 'created_at', operator: 'gte', value: ninetyDaysAgo.toISOString() },
      ],
    })

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayCounts = Array(7).fill(0) as number[]
    recentVisits.forEach((visit) => {
      const day = new Date(visit.created_at).getDay()
      dayCounts[day] = (dayCounts[day] ?? 0) + 1
    })

    const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts))
    const slowDayIndex = dayCounts.indexOf(Math.min(...dayCounts))

    const context: BusinessContext = {
      businessName: business.name,
      category: business.category,
      totalClients,
      atRiskClients,
      lostClients,
      avgVisitsPerClient,
      peakDay: dayNames[peakDayIndex] ?? 'Unknown',
      slowDay: dayNames[slowDayIndex] ?? 'Unknown',
    }

    // Generate via NVIDIA NIM
    const { campaigns: suggestions, usedFallback } = await generateCampaigns(
      c.env.NIM_API_KEY,
      context
    )

    // Save all suggestions as draft campaigns
    const savedCampaigns = await Promise.all(
      suggestions.map((suggestion) =>
        db.post('campaigns', {
          business_id: businessId,
          title: suggestion.title,
          message_template: suggestion.messageTemplate,
          target_segment: suggestion.targetSegment,
          send_timing: suggestion.sendTiming,
          expected_lift: suggestion.expectedLift,
          status: 'draft',
          generated_by: usedFallback ? 'fallback' : 'nvidia-nim',
        })
      )
    )

    const flatCampaigns = savedCampaigns.flatMap((c) => c)

    return c.json(
      ok({
        campaigns: flatCampaigns,
        generatedBy: usedFallback ? 'fallback' : 'nvidia-nim',
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        context: {
          totalClients,
          atRiskClients,
          lostClients,
        },
      }),
      201
    )
  }
)

// ─── GET /businesses/:id/campaigns ───────────────────────────────────────────
// List all campaigns for a business. Filter by status with ?status=draft|active|sent|archived

campaignRoutes.get(
  '/:id/campaigns',
  requireAdmin(),
  rateLimit({ keyPrefix: 'campaigns' }),
  async (c) => {
    const businessId = c.req.param('id')
    const url = new URL(c.req.url)
    const statusFilter = url.searchParams.get('status') as 'draft' | 'active' | 'sent' | 'archived' | null

    const db = createSupabaseClient(c.env, 'service')

    const filters: NonNullable<Parameters<typeof db.get>[1]>['filters'] = [
      { column: 'business_id', operator: 'eq', value: businessId },
    ]

    if (statusFilter) {
      const validStatuses = ['draft', 'active', 'sent', 'archived']
      if (!validStatuses.includes(statusFilter)) {
        return c.json(err('VALIDATION_ERROR', 'status must be: draft, active, sent, or archived'), 400)
      }
      filters.push({ column: 'status', operator: 'eq', value: statusFilter })
    }

    const campaigns = await db.get('campaigns', {
      filters,
      order: 'created_at.desc',
    })

    const grouped = {
      draft: campaigns.filter((c) => c.status === 'draft'),
      active: campaigns.filter((c) => c.status === 'active'),
      sent: campaigns.filter((c) => c.status === 'sent'),
      archived: campaigns.filter((c) => c.status === 'archived'),
    }

    return c.json(
      ok({
        campaigns: statusFilter ? campaigns : grouped,
        total: campaigns.length,
      }),
      200
    )
  }
)

// ─── GET /businesses/:id/campaigns/:campaignId ────────────────────────────────
// Get a single campaign by ID.

campaignRoutes.get('/:id/campaigns/:campaignId', requireAdmin(), async (c) => {
  const businessId = c.req.param('id')
  const campaignId = c.req.param('campaignId')
  const db = createSupabaseClient(c.env, 'service')

  const campaign = await db.getOne('campaigns', {
    filters: [
      { column: 'id', operator: 'eq', value: campaignId },
      { column: 'business_id', operator: 'eq', value: businessId },
    ],
  })

  if (!campaign) {
    return c.json(err('NOT_FOUND', 'Campaign not found'), 404)
  }

  return c.json(ok({ campaign }), 200)
})

// ─── POST /businesses/:id/campaigns/:campaignId/activate ──────────────────────
// Mark a draft campaign as active (ready to send / in progress).

campaignRoutes.post('/:id/campaigns/:campaignId/activate', requireAdmin(), async (c) => {
  const businessId = c.req.param('id')
  const campaignId = c.req.param('campaignId')
  const db = createSupabaseClient(c.env, 'service')

  const existing = await db.getOne('campaigns', {
    filters: [
      { column: 'id', operator: 'eq', value: campaignId },
      { column: 'business_id', operator: 'eq', value: businessId },
    ],
  })

  if (!existing) {
    return c.json(err('NOT_FOUND', 'Campaign not found'), 404)
  }

  if (existing.status !== 'draft') {
    return c.json(
      err('VALIDATION_ERROR', `Cannot activate a campaign with status: ${existing.status}`),
      400
    )
  }

  try {
    const [updated] = await db.patch(
      'campaigns',
      { status: 'active' },
      [
        { column: 'id', operator: 'eq', value: campaignId },
        { column: 'business_id', operator: 'eq', value: businessId },
      ]
    )

    return c.json(ok({ campaign: updated }), 200)
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── PATCH /businesses/:id/campaigns/:campaignId ──────────────────────────────
// Update campaign fields. Only draft campaigns can be edited.

campaignRoutes.patch('/:id/campaigns/:campaignId', requireAdmin(), async (c) => {
  const businessId = c.req.param('id')
  const campaignId = c.req.param('campaignId')
  const body = await c.req.json<{
    title?: string
    messageTemplate?: string
    targetSegment?: 'at_risk' | 'lost' | 'all' | 'frequent'
    sendTiming?: string
    expectedLift?: string
    status?: 'archived' | 'sent'
    sentAt?: string
  }>().catch(() => null)

  if (!body || Object.keys(body).length === 0) {
    return c.json(err('VALIDATION_ERROR', 'At least one field to update is required'), 400)
  }

  const db = createSupabaseClient(c.env, 'service')

  const existing = await db.getOne('campaigns', {
    filters: [
      { column: 'id', operator: 'eq', value: campaignId },
      { column: 'business_id', operator: 'eq', value: businessId },
    ],
  })

  if (!existing) {
    return c.json(err('NOT_FOUND', 'Campaign not found'), 404)
  }

  if (existing.status === 'sent' && body.status !== 'sent') {
    return c.json(err('VALIDATION_ERROR', 'Sent campaigns cannot be modified'), 400)
  }

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.messageTemplate !== undefined) updates.message_template = body.messageTemplate
  if (body.targetSegment !== undefined) updates.target_segment = body.targetSegment
  if (body.sendTiming !== undefined) updates.send_timing = body.sendTiming
  if (body.expectedLift !== undefined) updates.expected_lift = body.expectedLift
  if (body.status === 'archived') updates.status = 'archived'
  if (body.status === 'sent') {
    updates.status = 'sent'
    updates.sent_at = body.sentAt ?? new Date().toISOString()
  }

  try {
    const [updated] = await db.patch(
      'campaigns',
      updates,
      [
        { column: 'id', operator: 'eq', value: campaignId },
        { column: 'business_id', operator: 'eq', value: businessId },
      ]
    )

    return c.json(ok({ campaign: updated }), 200)
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── GET /businesses/:id/campaigns/:campaignId/stats ─────────────────────────
// Campaign performance stats. Returns target segment size and estimated reach.

campaignRoutes.get('/:id/campaigns/:campaignId/stats', requireAdmin(), async (c) => {
  const businessId = c.req.param('id')
  const campaignId = c.req.param('campaignId')
  const db = createSupabaseClient(c.env, 'service')

  const [campaign, allLoyalties] = await Promise.all([
    db.getOne('campaigns', {
      filters: [
        { column: 'id', operator: 'eq', value: campaignId },
        { column: 'business_id', operator: 'eq', value: businessId },
      ],
    }),
    db.get('client_business_loyalty', {
      filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
    }),
  ])

  if (!campaign) {
    return c.json(err('NOT_FOUND', 'Campaign not found'), 404)
  }

  let targetAudience = 0
  switch (campaign.target_segment) {
    case 'at_risk':
      targetAudience = allLoyalties.filter((l) => l.status === 'at_risk').length
      break
    case 'lost':
      targetAudience = allLoyalties.filter((l) => l.status === 'lost').length
      break
    case 'frequent':
      targetAudience = allLoyalties.filter((l) => l.total_visits >= 3).length
      break
    case 'all':
    default:
      targetAudience = allLoyalties.length
      break
  }

  return c.json(
    ok({
      campaign,
      stats: {
        targetAudience,
        generatedBy: campaign.generated_by,
        aiModel: campaign.generated_by === 'nvidia-nim' ? 'nvidia/llama-3.1-nemotron-70b-instruct' : null,
        sentCount: null,
        openRate: null,
        redemptionCount: null,
        estimatedLift: campaign.expected_lift,
        note: 'Full campaign tracking coming in a future release',
      },
    }),
    200
  )
})
