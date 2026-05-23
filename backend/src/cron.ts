import type { Env } from './types/env'
import { createSupabaseClient } from './lib/supabase'

// ─── Cron: recalculate client_business_loyalty.status ────────────────────────
// Runs daily at 03:00 UTC. Buckets every client-business pair into one of
// three engagement states based on last_visit_at:
//
//   active   →  last visit within 30 days
//   at_risk  →  last visit 30–60 days ago
//   lost     →  last visit > 60 days ago OR never visited but row > 60 days old
//
// These thresholds match what the analytics + campaigns code uses to segment
// audiences. Adjust here if those segments ever change.

const DAYS_ACTIVE  = 30
const DAYS_AT_RISK = 60

const PAGE_SIZE = 500

export async function recalculateClientStatuses(env: Env): Promise<{
  scanned: number
  updated: number
  errors: number
}> {
  const db = createSupabaseClient(env, 'service')
  const now = new Date()
  const activeCutoff  = new Date(now.getTime() - DAYS_ACTIVE  * 24 * 60 * 60 * 1000)
  const atRiskCutoff  = new Date(now.getTime() - DAYS_AT_RISK * 24 * 60 * 60 * 1000)

  let scanned = 0
  let updated = 0
  let errors = 0
  let offset = 0

  // Paginate through every loyalty row. Service role bypasses RLS.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await db.get('client_business_loyalty', {
      limit: PAGE_SIZE,
      offset,
      order: 'created_at.asc',
    })

    if (rows.length === 0) break

    for (const row of rows) {
      scanned++

      let nextStatus: 'active' | 'at_risk' | 'lost'

      if (row.last_visit_at) {
        const last = new Date(row.last_visit_at)
        if (last >= activeCutoff) nextStatus = 'active'
        else if (last >= atRiskCutoff) nextStatus = 'at_risk'
        else nextStatus = 'lost'
      } else {
        // Never visited. Bucket based on how long the row has existed.
        const created = new Date(row.created_at)
        nextStatus = created >= atRiskCutoff ? 'at_risk' : 'lost'
      }

      if (nextStatus === row.status) continue

      try {
        await db.patch(
          'client_business_loyalty',
          { status: nextStatus },
          [{ column: 'id', operator: 'eq', value: row.id }]
        )
        updated++
      } catch (e) {
        errors++
        console.error('Failed to update loyalty row', row.id, e)
      }
    }

    if (rows.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  // Invalidate analytics cache so the new statuses surface immediately
  // on the next dashboard load. Best-effort.
  try {
    const list = await env.ANALYTICS_CACHE.list({ prefix: 'stats:summary:' })
    await Promise.all(list.keys.map((k) => env.ANALYTICS_CACHE.delete(k.name)))
  } catch (e) {
    console.error('Failed to invalidate analytics cache', e)
  }

  return { scanned, updated, errors }
}
