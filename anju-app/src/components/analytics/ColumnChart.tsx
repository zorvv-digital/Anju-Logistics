import { useLayoutEffect, useRef, useState } from "react"

export interface ChartSeries {
  name: string
  color: string
}

export interface ChartColumn {
  /** Axis label */
  label: string
  /** Full name shown in the tooltip */
  title: string
  /** One value per series, same order as `series` */
  values: number[]
  /** Extra tooltip lines under the series values, e.g. Profit, Bookings */
  extra?: { name: string; value: string }[]
}

interface Props {
  series: ChartSeries[]
  columns: ChartColumn[]
  format: (v: number) => string
  /** Compact axis tick label */
  formatTick: (v: number) => string
  ariaLabel: string
}

const PLOT_H = 220
const AXIS_H = 28
const LEFT = 52
const TOP = 8
const BAR_MAX = 24
const GAP = 2

/** Round the top of the scale up to 1 / 2 / 2.5 / 5 × 10ⁿ per step so ticks read cleanly. */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { top: 1, step: 0.25 }
  const raw = max / ticks
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  return { top: step * ticks, step }
}

/** Column with a 4px rounded data end and a square base. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

/**
 * Grouped column chart in plain SVG: thin columns, hairline grid, one shared y-axis.
 * Hover or keyboard-focus a column group for a tooltip listing every series.
 */
export function ColumnChart({ series, columns, format, formatTick, ariaLabel }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const max = Math.max(0, ...columns.flatMap((c) => c.values))
  const { top, step } = niceScale(max)
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const plotW = width - LEFT - 8
  const band = plotW / Math.max(1, columns.length)
  const barW = Math.max(3, Math.min(BAR_MAX, (band * 0.7 - GAP * (series.length - 1)) / series.length))
  const groupW = barW * series.length + GAP * (series.length - 1)
  const y = (v: number) => TOP + PLOT_H - (v / top) * PLOT_H
  // Thin the x labels when columns get narrow (~56px per label)
  const every = Math.max(1, Math.ceil(columns.length / Math.max(1, Math.floor(plotW / 56))))

  const tip = active == null ? null : columns[active]
  const tipX = active == null ? 0 : LEFT + band * active + band / 2

  return (
    <div ref={wrapRef} className="relative w-full" onPointerLeave={() => setActive(null)}>
      <svg width={width} height={TOP + PLOT_H + AXIS_H} role="group" aria-label={ariaLabel} className="block overflow-visible">
        {/* Gridlines + y ticks: hairline, solid, recessive */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={LEFT} x2={width - 8} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} shapeRendering="crispEdges" />
            <text x={LEFT - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
              {formatTick(t)}
            </text>
          </g>
        ))}

        {columns.map((c, i) => {
          const gx = LEFT + band * i + (band - groupW) / 2
          return (
            <g key={i}>
              {active === i && <rect x={LEFT + band * i + 2} y={TOP} width={band - 4} height={PLOT_H} rx={6} className="fill-muted" />}
              {c.values.map((v, s) =>
                v > 0 ? (
                  <path key={s} d={barPath(gx + s * (barW + GAP), y(v), barW, y(0) - y(v))} fill={series[s].color} />
                ) : null,
              )}
              {i % every === 0 && (
                <text x={LEFT + band * i + band / 2} y={TOP + PLOT_H + 18} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {c.label}
                </text>
              )}
              {/* Hit target: the whole column band, bigger than the marks */}
              <rect
                x={LEFT + band * i}
                y={TOP}
                width={band}
                height={PLOT_H + AXIS_H}
                fill="transparent"
                tabIndex={0}
                aria-label={`${c.title}: ${series.map((s, k) => `${s.name} ${format(c.values[k])}`).join(", ")}${c.extra?.length ? ", " + c.extra.map((e) => `${e.name} ${e.value}`).join(", ") : ""}`}
                className="cursor-default outline-none focus-visible:stroke-ring focus-visible:stroke-2"
                onPointerEnter={() => setActive(i)}
                onPointerMove={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          )
        })}
        {/* Baseline */}
        <line x1={LEFT} x2={width - 8} y1={y(0)} y2={y(0)} stroke="var(--muted-foreground)" strokeOpacity={0.4} strokeWidth={1} shapeRendering="crispEdges" />
      </svg>

      {tip && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
          style={{
            left: Math.min(Math.max(tipX, 96), width - 96),
            transform: "translateX(-50%)",
          }}
        >
          <p className="mb-1.5 font-medium text-muted-foreground">{tip.title}</p>
          <ul className="grid gap-1">
            {series.map((s, k) => (
              <li key={s.name} className="flex items-center gap-2">
                <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold tabular-nums">{format(tip.values[k])}</span>
                <span className="text-muted-foreground">{s.name}</span>
              </li>
            ))}
          </ul>
          {!!tip.extra?.length && (
            <ul className="mt-1.5 grid gap-1 border-t pt-1.5">
              {tip.extra.map((e) => (
                <li key={e.name} className="flex items-center gap-2">
                  <span aria-hidden className="w-3" />
                  <span className="font-semibold tabular-nums">{e.value}</span>
                  <span className="text-muted-foreground">{e.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
