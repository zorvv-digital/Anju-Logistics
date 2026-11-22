import { totals, type Totals } from "./calc"
import { localIso } from "./format"
import type { Lr } from "./types"

/** "all" = every booking; weekly / monthly / yearly browse one period at a time; "custom" is any from–to range. */
export type PeriodKind = "all" | "week" | "month" | "year" | "custom"
/** The kinds with ◀ ▶ browsing */
export type Browsable = "week" | "month" | "year"
export const isBrowsable = (k: PeriodKind): k is Browsable => k === "week" || k === "month" || k === "year"
/** Inclusive date range as YYYY-MM-DD. */
export interface Range {
  from: string
  to: string
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Local-time date from YYYY-MM-DD (new Date("2026-09-01") would be UTC). */
export const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const daysIn = (r: Range) => Math.round((parseIso(r.to).getTime() - parseIso(r.from).getTime()) / 864e5) + 1

/** The week (Mon–Sun), month or year that contains the anchor date. */
export function periodRange(kind: Browsable, anchor: string): Range {
  const d = parseIso(anchor)
  if (kind === "week") {
    const start = addDays(d, -((d.getDay() + 6) % 7))
    return { from: localIso(start), to: localIso(addDays(start, 6)) }
  }
  if (kind === "month") {
    return { from: localIso(new Date(d.getFullYear(), d.getMonth(), 1)), to: localIso(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
  }
  return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` }
}

/** Move the anchor one week / month / year back (-1) or forward (+1). */
export function shiftAnchor(kind: Browsable, anchor: string, dir: 1 | -1) {
  const d = parseIso(anchor)
  if (kind === "week") return localIso(addDays(d, 7 * dir))
  if (kind === "month") return localIso(new Date(d.getFullYear(), d.getMonth() + dir, 1))
  return localIso(new Date(d.getFullYear() + dir, 0, 1))
}

/** The period just before, for "vs last month" deltas. Custom ranges compare to the same number of days before. */
export function previousRange(kind: PeriodKind, r: Range): Range {
  if (isBrowsable(kind)) return periodRange(kind, shiftAnchor(kind, r.from, -1))
  const end = addDays(parseIso(r.from), -1)
  return { from: localIso(addDays(end, -(daysIn(r) - 1))), to: localIso(end) }
}

const dayMonth = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`

/** "16 – 22 Nov 2026", "November 2026", "2026", "1 Sep – 15 Oct 2026" */
export function rangeLabel(kind: PeriodKind, r: Range) {
  const a = parseIso(r.from), b = parseIso(r.to)
  if (kind === "month") return `${MONTHS_LONG[a.getMonth()]} ${a.getFullYear()}`
  if (kind === "year") return String(a.getFullYear())
  if (r.from === r.to) return `${dayMonth(a)} ${a.getFullYear()}`
  const sameYear = a.getFullYear() === b.getFullYear()
  const left = sameYear && a.getMonth() === b.getMonth() && kind === "week" ? String(a.getDate()) : dayMonth(a) + (sameYear ? "" : ` ${a.getFullYear()}`)
  return `${left} – ${dayMonth(b)} ${b.getFullYear()}`
}

/** Short name of the previous period for deltas: "last week", "last month", "last year", "previous 30 days". */
export const previousName = (kind: PeriodKind, r: Range) =>
  isBrowsable(kind) ? `last ${kind}` : `previous ${daysIn(r)} day${daysIn(r) > 1 ? "s" : ""}`

export type Grain = "day" | "week" | "month"
/** Days for up to two weeks, weeks up to ~3 months, months beyond — keeps the chart to ≤ ~14 columns mostly. */
export const grainFor = (r: Range): Grain => (daysIn(r) <= 14 ? "day" : daysIn(r) <= 93 ? "week" : "month")

export interface Bucket extends Range {
  /** Axis label, e.g. "Mon 16", "1–7 Sep", "Sep" */
  label: string
  /** Full name for the tooltip / table, e.g. "Mon, 16 Nov 2026" */
  title: string
}

export function buckets(r: Range): Bucket[] {
  const grain = grainFor(r)
  const end = parseIso(r.to)
  const out: Bucket[] = []
  let cur = parseIso(r.from)
  while (cur <= end) {
    let next: Date
    let label: string
    let title: string
    if (grain === "day") {
      next = cur
      label = `${DAYS[cur.getDay()]} ${cur.getDate()}`
      title = `${DAYS[cur.getDay()]}, ${dayMonth(cur)} ${cur.getFullYear()}`
    } else if (grain === "week") {
      next = addDays(cur, 6) > end ? end : addDays(cur, 6)
      label = cur.getMonth() === next.getMonth() ? `${cur.getDate()}–${dayMonth(next)}` : `${dayMonth(cur)}–${dayMonth(next)}`
      title = `${dayMonth(cur)} – ${dayMonth(next)} ${next.getFullYear()}`
    } else {
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      next = monthEnd > end ? end : monthEnd
      const spansYears = parseIso(r.from).getFullYear() !== end.getFullYear()
      label = MONTHS[cur.getMonth()] + (spansYears ? ` ${String(cur.getFullYear()).slice(2)}` : "")
      title = `${MONTHS_LONG[cur.getMonth()]} ${cur.getFullYear()}`
    }
    out.push({ from: localIso(cur), to: localIso(next), label, title })
    cur = addDays(next, 1)
  }
  return out
}

export const inRange = (lrs: Lr[], r: Range) => lrs.filter((l) => !!l.date && l.date >= r.from && l.date <= r.to)

export interface Point extends Bucket {
  t: Totals
}

/** Totals for each column of the chart. */
export const series = (lrs: Lr[], r: Range): Point[] => buckets(r).map((b) => ({ ...b, t: totals(inRange(lrs, b)) }))

/** Change vs the previous period, as a fraction (0.12 = +12%). null when there is nothing to compare with. */
export const change = (now: number, before: number) => (before === 0 ? null : (now - before) / Math.abs(before))

/** Billed amount per billing party, biggest first. */
export function topParties(lrs: Lr[], nameOf: (lr: Lr) => string | undefined, limit = 5) {
  const map = new Map<string, number>()
  for (const lr of lrs) {
    const name = nameOf(lr) ?? "Unknown party"
    map.set(name, (map.get(name) ?? 0) + lr.billAmount)
  }
  return [...map.entries()]
    .map(([name, billed]) => ({ name, billed }))
    .filter((p) => p.billed > 0)
    .sort((a, b) => b.billed - a.billed)
    .slice(0, limit)
}

/** First booking date — where "All time" starts. */
export const earliestDate = (lrs: Lr[]) => lrs.reduce<string | null>((m, l) => (l.date && (!m || l.date < m) ? l.date : m), null)

/** Most recent booking date, to jump to when the chosen period is empty. */
export const latestDate = (lrs: Lr[]) => lrs.reduce<string | null>((m, l) => (l.date && (!m || l.date > m) ? l.date : m), null)
