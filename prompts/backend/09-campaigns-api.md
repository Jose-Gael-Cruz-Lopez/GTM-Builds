# Agent Prompt — 09: Campaigns API (NVIDIA NIM)

## Context

You are building the **NexoLeal Cloudflare Workers backend** — Wave 3C. Your job is to implement the AI-powered campaign generation and management endpoints. This runs in parallel with the Visits and Analytics agents.

Wave 2 has already created:
- `src/middleware/auth.ts` — `requireAdmin()`
- `src/lib/supabase.ts` — `createSupabaseClient()`
- `src/types/db.ts` — `CampaignRow`, `CampaignInsert`, `CampaignTargetSegment`, `CampaignStatus`
- `src/types/env.ts` — Env with `NIM_API_KEY`

You must also create `src/lib/nim.ts` — the NVIDIA NIM wrapper — before writing the routes.

---

## NVIDIA NIM Integration Notes

The project uses the existing `nimClient.js` pattern from the repository. The AI call goes to:

- **API URL**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Model**: `nvidia/llama-3.1-nemotron-70b-instruct`
- **Auth**: `Authorization: Bearer ${NIM_API_KEY}` header
- **Method**: POST with JSON body — same OpenAI-compatible chat completions format
- **Temperature**: `0.8` for campaign creativity (original uses `0.3` for factual reports — increase for more variety)
- **max_tokens**: `2048`
- Do NOT use streaming — use standard completion
- If NIM returns an error or malformed JSON, fall back to 3 hardcoded campaign templates rather than returning an error to the user

The `nimClient.js` pattern in the repo shows the exact request structure. Port it faithfully to TypeScript for Workers.

---

## Campaign Data Structure

Each AI-generated campaign suggestion must have this shape:

```typescript
interface CampaignSuggestion {
  title: string              // e.g. "Lunes sin clientes: trae a un amigo"
  messageTemplate: string    // e.g. "¡Hola {name}! Hace {days} días que no te vemos. Este lunes tienes 2x1. ¡Te esperamos!"
  targetSegment: 'at_risk' | 'lost' | 'all' | 'frequent'
  sendTiming: string         // e.g. "Lunes 10am" or "Día tranquilo antes del mediodía"
  expectedLift: string       // e.g. "+15% visitas en 7 días"
}
```

---

## Step 1 — `src/lib/nim.ts`

Create `/backend/src/lib/nim.ts`. This is the TypeScript port of `nimClient.js`, adapted for campaign generation:

```typescript
// ─── Types ────────────────────────────────────────────────────────────────────

export interface CampaignSuggestion {
  title: string
  messageTemplate: string
  targetSegment: 'at_risk' | 'lost' | 'all' | 'frequent'
  sendTiming: string
  expectedLift: string
}

export interface BusinessContext {
  businessName: string
  category: string       // 'barbershop' | 'salon' | 'vet' | 'cafe' | 'gym' | 'other'
  totalClients: number
  atRiskClients: number
  lostClients: number
  avgVisitsPerClient: number
  peakDay?: string       // e.g. 'Saturday'
  slowDay?: string       // e.g. 'Monday'
}

// ─── NIM API constants (mirroring nimClient.js) ───────────────────────────────

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const NIM_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'

// ─── System prompt ────────────────────────────────────────────────────────────
// Role: campaign strategist for Latin American SMBs.
// Mirrors the SYSTEM_PROMPT pattern from nimClient.js but focused on loyalty campaigns.

const SYSTEM_PROMPT = `
Eres un experto en marketing de retención para pequeños negocios en Latinoamérica.
Recibes datos de un negocio y su base de clientes.
Devuelves exactamente 3 campañas de reactivación y lealtad en formato JSON.
Cada campaña debe ser específica para el tipo de negocio, usar lenguaje cercano y latinoamericano, y tener un objetivo claro.
Los mensajes usan estas variables: {name} para el nombre del cliente, {days} para días sin visitar, {businessName} para el nombre del negocio, {stamps} para sellos faltantes.
Responde SOLO con JSON válido, sin markdown, sin explicaciones, sin texto adicional.
`.trim()

// ─── Fallback campaigns (used if NIM fails) ───────────────────────────────────

const FALLBACK_CAMPAIGNS: CampaignSuggestion[] = [
  {
    title: 'Reactivación de clientes inactivos',
    messageTemplate:
      '¡Hola {name}! Hace {days} días que no te vemos en {businessName}. Te esperamos esta semana con un 10% de descuento. ¡Muéstrale este mensaje a tu estilista!',
    targetSegment: 'at_risk',
    sendTiming: 'Martes o miércoles por la mañana',
    expectedLift: '+12% visitas en 2 semanas',
  },
  {
    title: 'Llena tu tarjeta este fin de semana',
    messageTemplate:
      '¡{name}! Te faltan {stamps} sellos para tu próxima recompensa en {businessName}. Este sábado reserva con nosotros y avanza más rápido. ¡Link de reserva aquí!',
    targetSegment: 'frequent',
    sendTiming: 'Jueves tarde antes del fin de semana',
    expectedLift: '+20% reservas el fin de semana',
  },
  {
    title: 'Día tranquilo — oferta especial',
    messageTemplate:
      '¡Hola {name}! Los lunes son tranquilos en {businessName} y tú mereces atención personalizada. Reserva hoy con 15 min extra sin costo. ¿Te animás?',
    targetSegment: 'all',
    sendTiming: 'Domingo tarde para promover el lunes',
    expectedLift: '+25% ocupación el día tranquilo',
  },
]

// ─── User prompt builder ──────────────────────────────────────────────────────

function buildUserPrompt(ctx: BusinessContext): string {
  const categoryNames: Record<string, string> = {
    barbershop: 'barbería',
    salon: 'estética o salón de belleza',
    vet: 'clínica veterinaria',
    cafe: 'cafetería',
    gym: 'gimnasio boutique',
    other: 'negocio de servicios',
  }

  const categoryName = categoryNames[ctx.category] ?? ctx.category

  return JSON.stringify({
    negocio: ctx.businessName,
    tipo: categoryName,
    clientesTotales: ctx.totalClients,
    clientesEnRiesgo: ctx.atRiskClients,
    clientesPerdidos: ctx.lostClients,
    promedioVisitasPorCliente: parseFloat(ctx.avgVisitsPerClient.toFixed(1)),
    diaMasActivo: ctx.peakDay ?? 'Desconocido',
    diaMasTranquilo: ctx.slowDay ?? 'Desconocido',
    instrucciones:
      'Genera exactamente 3 campañas variadas: una para clientes en riesgo, una para recuperar perdidos, y una para aumentar frecuencia de los activos. Devuelve: { "campaigns": [ { "title", "messageTemplate", "targetSegment", "sendTiming", "expectedLift" } ] }',
  })
}

// ─── NIM API call (TypeScript port of nimClient.js) ───────────────────────────

export async function generateCampaigns(
  apiKey: string,
  context: BusinessContext
): Promise<{ campaigns: CampaignSuggestion[]; usedFallback: boolean }> {
  const userContent = buildUserPrompt(context)

  try {
    const response = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        max_tokens: 2048,
        temperature: 0.8,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as { detail?: string; message?: string }
      console.error(`[NIM] error ${response.status}: ${errBody.detail ?? errBody.message ?? response.statusText}`)
      return { campaigns: FALLBACK_CAMPAIGNS, usedFallback: true }
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: { content?: string }
      }>
    }

    const text = data.choices?.[0]?.message?.content

    if (!text) {
      console.error('[NIM] Empty response from model')
      return { campaigns: FALLBACK_CAMPAIGNS, usedFallback: true }
    }

    // Strip possible markdown fences that the model might add
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed: { campaigns: CampaignSuggestion[] }
    try {
      parsed = JSON.parse(cleaned) as { campaigns: CampaignSuggestion[] }
    } catch {
      console.error('[NIM] Failed to parse JSON response:', text)
      return { campaigns: FALLBACK_CAMPAIGNS, usedFallback: true }
    }

    if (!Array.isArray(parsed.campaigns) || parsed.campaigns.length === 0) {
      console.error('[NIM] campaigns array missing or empty in response')
      return { campaigns: FALLBACK_CAMPAIGNS, usedFallback: true }
    }

    // Validate and sanitize each campaign
    const validSegments = new Set(['at_risk', 'lost', 'all', 'frequent'])
    const validated = parsed.campaigns
      .filter(
        (c) =>
          typeof c.title === 'string' &&
          typeof c.messageTemplate === 'string' &&
          validSegments.has(c.targetSegment)
      )
      .slice(0, 3)

    if (validated.length === 0) {
      return { campaigns: FALLBACK_CAMPAIGNS, usedFallback: true }
    }

    return { campaigns: validated, usedFallback: false }
  } catch (error) {
    // Mirrors the error handling pattern in nimClient.js
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[NIM] Unexpected error:', msg)
    return { campaigns: FALLBACK_CAMPAIGNS, usedFallback: true }
  }
}
```

---

## Step 2 — `src/routes/campaigns.ts`

Create `/backend/src/routes/campaigns.ts`:

```typescript
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

    const filters: Parameters<typeof db.get>[1]['filters'] = [
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
    status?: 'archived'
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

  if (existing.status === 'sent') {
    return c.json(err('VALIDATION_ERROR', 'Sent campaigns cannot be modified'), 400)
  }

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.messageTemplate !== undefined) updates.message_template = body.messageTemplate
  if (body.targetSegment !== undefined) updates.target_segment = body.targetSegment
  if (body.sendTiming !== undefined) updates.send_timing = body.sendTiming
  if (body.expectedLift !== undefined) updates.expected_lift = body.expectedLift
  if (body.status === 'archived') updates.status = 'archived'

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
```

---

## Step 3 — Mount in `src/index.ts`

The campaign routes are nested under `/businesses/:id`. Mount at `/businesses`:

```typescript
import { campaignRoutes } from './routes/campaigns'
// ...
app.route('/businesses', campaignRoutes)
```

---

## Step 4 — Update `src/types/env.ts`

Ensure the `Env` interface has `NIM_API_KEY` (not `GEMINI_API_KEY`):

```typescript
NIM_API_KEY: string;        // NVIDIA NIM API key (integrate.api.nvidia.com)
```

If the file still says `GEMINI_API_KEY`, replace it with `NIM_API_KEY`.

---

## Step 5 — Update `src/types/api.ts`

Replace the `GEMINI_ERROR` error code with `NIM_ERROR`:

```typescript
export type ErrorCode =
  // ...
  | 'NIM_ERROR'       // NVIDIA NIM API call failed
  // (remove GEMINI_ERROR if present)
```

---

## Step 6 — Verify

```bash
cd /backend
npx tsc --noEmit
```

Zero TypeScript errors. Ensure all `nim.ts` error paths return `FALLBACK_CAMPAIGNS` — the route must never propagate a NIM API error as a 500 to the client.
