import { useMemo, useState } from 'react'
import type { PeakHoursResponse } from '@/lib/api/analytics'
import { cn } from '@/lib/utils'
import { AnalyticsCardSkeleton, AnalyticsEmptyState } from '@/components/dashboard/AnalyticsEmptyState'

export interface PeakHoursHeatmapProps {
  data?: PeakHoursResponse
  isLoading: boolean
  isError?: boolean
}

const DAY_ES: Record<string, string> = {
  Sun: 'Domingo',
  Mon: 'Lunes',
  Tue: 'Martes',
  Wed: 'Miércoles',
  Thu: 'Jueves',
  Fri: 'Viernes',
  Sat: 'Sábado',
}

function cellIntensity(count: number, max: number): number {
  if (max === 0 || count === 0) return 0
  return 0.15 + (count / max) * 0.85
}

export function PeakHoursHeatmap({ data, isLoading, isError }: PeakHoursHeatmapProps) {
  const [tooltip, setTooltip] = useState<string | null>(null)

  const { max, grid } = useMemo(() => {
    if (!data) return { max: 0, grid: [] as number[][] }
    let peak = 0
    data.grid.forEach((row) =>
      row.forEach((c) => {
        if (c > peak) peak = c
      }),
    )
    return { max: peak, grid: data.grid }
  }, [data])

  if (isLoading) return <AnalyticsCardSkeleton />

  if (isError || !data || data.totalVisitsAnalyzed === 0) {
    return (
      <div className="surface-paper p-5">
        <h3 className="font-display font-semibold">Horas pico</h3>
        <AnalyticsEmptyState className="mt-4 border-0 bg-transparent py-8" />
      </div>
    )
  }

  return (
    <div className="surface-paper p-5">
      <div className="mb-4">
        <h3 className="font-display font-semibold">Horas pico</h3>
        <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
          {data.totalVisitsAnalyzed} visitas analizadas (90d)
          {tooltip ? ` · ${tooltip}` : null}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="mb-1 grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-0.5">
            <div />
            {data.hourLabels.map((hour, i) => (
              <div
                key={hour}
                className={cn(
                  'text-center text-[9px] text-[color:var(--color-ink-soft)]',
                  i % 3 !== 0 && 'opacity-0 sm:opacity-100',
                )}
              >
                {i % 3 === 0 ? hour.replace('am', '').replace('pm', '') : ''}
              </div>
            ))}
          </div>

          {grid.map((row, dayIdx) => (
            <div
              key={data.dayLabels[dayIdx]}
              className="mb-0.5 grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-0.5"
            >
              <div className="flex items-center text-[10px] font-medium text-[color:var(--color-ink-soft)]">
                {data.dayLabels[dayIdx]?.slice(0, 3)}
              </div>
              {row.map((count, hourIdx) => {
                const intensity = cellIntensity(count, max)
                const dayLabel = DAY_ES[data.dayLabels[dayIdx] ?? ''] ?? data.dayLabels[dayIdx]
                const hourLabel = data.hourLabels[hourIdx]
                const tip = `${dayLabel} ${hourLabel} · ${count} visitas`

                return (
                  <button
                    key={`${dayIdx}-${hourIdx}`}
                    type="button"
                    className="aspect-square min-h-[10px] rounded-[2px] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-signal)]"
                    style={{
                      background:
                        count === 0
                          ? 'color-mix(in srgb, var(--color-ink) 6%, var(--color-cream))'
                          : `color-mix(in srgb, var(--color-health) ${Math.round(intensity * 100)}%, var(--color-ink))`,
                    }}
                    aria-label={tip}
                    onMouseEnter={() => setTooltip(tip)}
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={() => setTooltip(tip)}
                    onBlur={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function buildPeakInsight(data: PeakHoursResponse): string {
  if (data.totalVisitsAnalyzed === 0) {
    return 'Comparte tu enlace con clientes para descubrir cuándo te visitan más.'
  }

  const dayIdx = data.dayLabels.indexOf(data.peak.day)
  const hourIdx = data.hourLabels.indexOf(data.peak.hour)
  if (dayIdx < 0 || hourIdx < 0) {
    return `Tu hora más activa es ${data.peak.hour} los ${DAY_ES[data.peak.day] ?? data.peak.day}.`
  }

  const windowHours = [hourIdx - 1, hourIdx, hourIdx + 1].filter((h) => h >= 0 && h < 24)
  let windowVisits = 0
  windowHours.forEach((h) => {
    windowVisits += data.grid[dayIdx]?.[h] ?? 0
  })

  const pct = Math.round((windowVisits / data.totalVisitsAnalyzed) * 100)
  const dayEs = (DAY_ES[data.peak.day] ?? data.peak.day).toLowerCase()
  const startHour = windowHours[0] ?? hourIdx
  const endHour = (windowHours[windowHours.length - 1] ?? hourIdx) + 1

  return `Los ${dayEs} entre ${formatHourRange(startHour, endHour)} representan el ${pct}% de tus visitas.`
}

function formatHourRange(start: number, end: number): string {
  const fmt = (h: number) => {
    if (h === 0) return '12 am'
    if (h < 12) return `${h} am`
    if (h === 12) return '12 pm'
    return `${h - 12} pm`
  }
  return `${fmt(start)} y ${fmt(end)}`
}
