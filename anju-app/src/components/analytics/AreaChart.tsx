import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"

export interface ChartSeries {
  name: string
  color: string
}

export interface ChartColumn {
  /** Full name shown in the tooltip */
  title: string
  /** One value per series, same order as `series` */
  values: number[]
  /** Extra tooltip lines under the series values, e.g. Profit, Bookings */
  extra?: { name: string; value: string }[]
}

interface Props {
  /** First series is the main line (with the soft fill); the rest are thin guide lines */
  series: ChartSeries[]
  columns: ChartColumn[]
  format: (v: number) => string
  ariaLabel: string
  /** Shown under the plot, e.g. period pills */
  footer?: ReactNode
}

const H = 180
const PAD_Y = 14

/**
 * Minimal area chart in plain SVG: no axes or gridlines, just the line on a light card.
 * Hover or keyboard-focus a point for a dot, a dashed guide and a tooltip.
 */
export function AreaChart({ series, columns, format, ariaLabel, footer }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const gradId = useId()
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = columns.length
  const max = Math.max(1, ...columns.flatMap((c) => c.values))
  const step = n > 1 ? width / (n - 1) : 0
  const x = (i: number) => (n > 1 ? i * step : width / 2)
  const y = (v: number) => PAD_Y + (H - PAD_Y * 2) * (1 - v / max)
  const line = (s: number) => columns.map((c, i) => `${i ? "L" : "M"}${x(i)},${y(c.values[s])}`).join("")
  const main = series[0]

  const tip = active == null ? null : columns[active]
  const tipLeft = active == null ? 0 : Math.min(Math.max(x(active), 90), width - 90)

  return (
    <div className="rounded-2xl bg-tint-sky p-4 pb-3">
      <div ref={wrapRef} className="relative" onPointerLeave={() => setActive(null)}>
        <svg width={width} height={H} role="group" aria-label={ariaLabel} className="block overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={main.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={main.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {n > 1 && <path d={`${line(0)}L${x(n - 1)},${H}L${x(0)},${H}Z`} fill={`url(#${gradId})`} />}
          {series.map((s, k) =>
            k === 0 ? null : (
              <path key={s.name} d={line(k)} fill="none" stroke={s.color} strokeWidth={1.25} strokeDasharray="3 3" strokeLinejoin="round" />
            ),
          )}
          <path d={line(0)} fill="none" stroke={main.color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />

          {active != null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={0} y2={H} stroke={main.color} strokeOpacity={0.5} strokeDasharray="2 3" />
              <circle cx={x(active)} cy={y(columns[active].values[0])} r={6} fill={main.color} stroke="white" strokeWidth={2} />
            </g>
          )}

          {/* Hit targets: one band per point, wider than the line */}
          {columns.map((c, i) => (
            <rect
              key={i}
              x={n > 1 ? x(i) - step / 2 : 0}
              y={0}
              width={n > 1 ? step : width}
              height={H}
              fill="transparent"
              tabIndex={0}
              aria-label={`${c.title}: ${series.map((s, k) => `${s.name} ${format(c.values[k])}`).join(", ")}`}
              className="outline-none focus-visible:stroke-ring"
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          ))}
        </svg>

        {tip && (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 min-w-40 -translate-x-1/2 -translate-y-full rounded-xl bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
            style={{ left: tipLeft }}
          >
            <p className="mb-1 font-medium text-muted-foreground">{tip.title}</p>
            <ul className="grid gap-0.5">
              {series.map((s, k) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                  <span className="font-semibold tabular-nums">{format(tip.values[k])}</span>
                  <span className="text-muted-foreground">{s.name}</span>
                </li>
              ))}
              {tip.extra?.map((e) => (
                <li key={e.name} className="flex items-center gap-2">
                  <span aria-hidden className="w-3" />
                  <span className="font-semibold tabular-nums">{e.value}</span>
                  <span className="text-muted-foreground">{e.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {footer}
        <ul className="flex gap-3 text-[11px] text-muted-foreground" aria-label="Legend">
          {series.map((s, k) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span aria-hidden className={k ? "w-3 border-t border-dashed" : "h-0.5 w-3 rounded-full"} style={k ? { borderColor: s.color } : { background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
