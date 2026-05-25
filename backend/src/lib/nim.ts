// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssistantAnalysisContext {
  businessName: string
  category: string
  periodDays: number
  visitCount: number
  totalClients: number
  newClients: number
  frequentClients: number
  lostClients: number
  atRiskClients: number
  peakDay: string
  slowDay: string
  peakHour: string
  slowHour: string
}

export interface AssistantInsights {
  segmentAnalysis: {
    lostInsight: string
    newInsight: string
    frequentInsight: string
  }
  serviceAnalysis: {
    slowPeriods: string[]
    activePeriods: string[]
    lowPerformanceReasons: string[]
    predictions: string[]
  }
  recommendations: {
    forLost: string
    forFrequent: string
    forNew: string
    suggestedDiscountLost: number
    suggestedDiscountFrequent: number
    suggestedDiscountNew: number
    suggestedVisitsForReward: number
  }
}



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
// `nvidia/llama-3.1-nemotron-70b-instruct` is in the catalog but not enabled
// for free-tier API keys (returns 404 at /chat/completions). Llama-3.3-70b is
// the strongest instruction-tuned model available on the free tier and follows
// JSON-output instructions reliably.
const NIM_MODEL = 'meta/llama-3.3-70b-instruct'

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

// ─── Assistant Business Insights ──────────────────────────────────────────────

const FALLBACK_INSIGHTS: AssistantInsights = {
  segmentAnalysis: {
    lostInsight:
      'Estos clientes probablemente encontraron alternativas o tuvieron una mala experiencia. Un descuento personalizado y un mensaje cercano puede traerlos de vuelta.',
    newInsight:
      'Los clientes nuevos están explorando. Un incentivo en su segunda visita los convierte en regulares más fácilmente.',
    frequentInsight:
      'Tus clientes más leales merecen reconocimiento. Un programa de puntos o descuento exclusivo los hará sentir valorados y seguirán eligiéndote.',
  },
  serviceAnalysis: {
    slowPeriods: ['Lunes por la mañana', 'Miércoles al mediodía'],
    activePeriods: ['Viernes por la tarde', 'Sábado todo el día'],
    lowPerformanceReasons: [
      'Los días de semana tienen menos tráfico por compromisos laborales de los clientes',
      'El mediodía compite con horarios de comida y descanso',
    ],
    predictions: [
      'Una promoción especial los lunes podría aumentar hasta un 25% las visitas ese día',
      'Notificaciones el jueves invitando para el viernes elevan la asistencia del fin de semana',
    ],
  },
  recommendations: {
    forLost:
      'Envía un mensaje personalizado con un descuento del 15–20% vigente por 2 semanas. El toque personal hace la diferencia.',
    forFrequent:
      'Ofrece una recompensa a partir de la 5.ª visita. Hazlos sentir parte de un club exclusivo.',
    forNew:
      'Ofrece un beneficio en su segunda visita (descuento o servicio extra). El objetivo es que regresen al menos 3 veces para crear el hábito.',
    suggestedDiscountLost: 15,
    suggestedDiscountFrequent: 10,
    suggestedDiscountNew: 10,
    suggestedVisitsForReward: 5,
  },
}

const ASSISTANT_SYSTEM_PROMPT = `
Eres un experto analista de negocios y marketing de retención para pequeños negocios en Latinoamérica.
Recibes datos de visitas y clientes de un negocio local.
Devuelves un análisis detallado y recomendaciones accionables en formato JSON.
Usa lenguaje cercano, cálido y en español latinoamericano. Sin tecnicismos innecesarios.
Responde SOLO con JSON válido. Sin markdown, sin texto adicional, sin explicaciones fuera del JSON.
`.trim()

function buildAssistantPrompt(ctx: AssistantAnalysisContext): string {
  const categoryNames: Record<string, string> = {
    barbershop: 'barbería',
    salon: 'estética o salón de belleza',
    vet: 'clínica veterinaria',
    cafe: 'cafetería',
    gym: 'gimnasio boutique',
    other: 'negocio de servicios',
  }

  const schema = `{
  "segmentAnalysis": {
    "lostInsight": "1-2 oraciones: por qué se fueron estos clientes y qué los haría volver",
    "newInsight": "1-2 oraciones: cómo convertir clientes nuevos en regulares",
    "frequentInsight": "1-2 oraciones: cómo premiar y retener a los clientes frecuentes"
  },
  "serviceAnalysis": {
    "slowPeriods": ["período tranquilo 1 (ej: Lunes por la mañana)", "período tranquilo 2"],
    "activePeriods": ["período activo 1", "período activo 2"],
    "lowPerformanceReasons": ["razón 1 de baja actividad", "razón 2"],
    "predictions": ["predicción 1 si se actúa", "predicción 2"]
  },
  "recommendations": {
    "forLost": "Recomendación específica para reactivar clientes perdidos",
    "forFrequent": "Recomendación para premiar frecuentes",
    "forNew": "Recomendación de incentivo para clientes nuevos",
    "suggestedDiscountLost": 15,
    "suggestedDiscountFrequent": 10,
    "suggestedDiscountNew": 10,
    "suggestedVisitsForReward": 5
  }
}`

  return JSON.stringify({
    negocio: ctx.businessName,
    tipo: categoryNames[ctx.category] ?? ctx.category,
    periodo: `Últimos ${ctx.periodDays} días`,
    visitasAnalizadas: ctx.visitCount,
    totalClientes: ctx.totalClients,
    clientesNuevos: ctx.newClients,
    clientesFrecuentes: ctx.frequentClients,
    clientesPerdidos: ctx.lostClients,
    clientesEnRiesgo: ctx.atRiskClients,
    diaMasActivo: ctx.peakDay,
    diaMasTranquilo: ctx.slowDay,
    horaMasActiva: ctx.peakHour,
    horaMasTranquila: ctx.slowHour,
    instrucciones: `Analiza estos datos reales del negocio y devuelve exactamente este JSON (sin texto adicional): ${schema}`,
  })
}

export async function analyzeBusinessInsights(
  apiKey: string,
  ctx: AssistantAnalysisContext
): Promise<{ insights: AssistantInsights; usedFallback: boolean }> {
  try {
    const response = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
          { role: 'user', content: buildAssistantPrompt(ctx) },
        ],
      }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as { detail?: string; message?: string }
      console.error(`[NIM Assistant] error ${response.status}: ${errBody.detail ?? errBody.message ?? response.statusText}`)
      return { insights: FALLBACK_INSIGHTS, usedFallback: true }
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const text = data.choices?.[0]?.message?.content
    if (!text) {
      console.error('[NIM Assistant] Empty response')
      return { insights: FALLBACK_INSIGHTS, usedFallback: true }
    }

    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed: AssistantInsights
    try {
      parsed = JSON.parse(cleaned) as AssistantInsights
    } catch {
      console.error('[NIM Assistant] Failed to parse JSON:', text.slice(0, 200))
      return { insights: FALLBACK_INSIGHTS, usedFallback: true }
    }

    // Validate required fields exist
    if (!parsed.segmentAnalysis || !parsed.serviceAnalysis || !parsed.recommendations) {
      return { insights: FALLBACK_INSIGHTS, usedFallback: true }
    }

    // Fill missing numeric fields from fallback
    parsed.recommendations.suggestedDiscountLost ??= FALLBACK_INSIGHTS.recommendations.suggestedDiscountLost
    parsed.recommendations.suggestedDiscountFrequent ??= FALLBACK_INSIGHTS.recommendations.suggestedDiscountFrequent
    parsed.recommendations.suggestedDiscountNew ??= FALLBACK_INSIGHTS.recommendations.suggestedDiscountNew
    parsed.recommendations.suggestedVisitsForReward ??= FALLBACK_INSIGHTS.recommendations.suggestedVisitsForReward

    return { insights: parsed, usedFallback: false }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[NIM Assistant] Unexpected error:', msg)
    return { insights: FALLBACK_INSIGHTS, usedFallback: true }
  }
}
