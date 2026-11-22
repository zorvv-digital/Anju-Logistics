import { ArrowDownCircle, BarChart3, ChevronLeft, ChevronRight, FileText, IndianRupee, Lock, Table2, Truck } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AreaChart, type ChartSeries } from "@/components/analytics/AreaChart"
import { CompanyBadge } from "@/components/common/badges"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { EmptyState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  change, earliestDate, inRange, isBrowsable, latestDate, periodRange, previousName, previousRange, rangeLabel, series, shiftAnchor,
  topParties, type Browsable, type PeriodKind, type Range,
} from "@/lib/analytics"
import { byCompany, totals } from "@/lib/calc"
import { money, moneyShort, today } from "@/lib/format"
import { COMPANY_LABEL, type Company } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useCompanyLrs, useIsOwner, useLookups } from "@/store/selectors"
import { useStore } from "@/store/useStore"

// Billed is the main line (solid, filled); freight is a dashed guide line under it.
const SERIES: ChartSeries[] = [
  { name: "Billed", color: "#3b8fd9" },
  { name: "Freight", color: "#64748b" },
]

/** Short period pills under the chart */
const PILL: Record<PeriodKind, string> = { all: "ALL", week: "1W", month: "1M", year: "1Y", custom: "DATES" }

const KINDS: { value: PeriodKind; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
  { value: "custom", label: "Dates" },
]

const pct = (f: number) => `${Math.abs(Math.round(f * 100))}%`

/** "▲ 12% vs last month" — green when the move is good for the business. */
function Delta({ now, before, vs, upIsGood = true }: { now: number; before: number; vs: string; upIsGood?: boolean }) {
  const c = change(now, before)
  if (c === null) return <span>Nothing {vs} to compare</span>
  if (Math.round(c * 100) === 0) return <span>Same as {vs}</span>
  const good = c > 0 === upIsGood
  return (
    <span>
      <span className={cn("font-medium", good ? "text-emerald-600" : "text-destructive")}>
        {c > 0 ? "▲" : "▼"} {pct(c)}
      </span>{" "}
      vs {vs}
    </span>
  )
}

export function AnalyticsPage() {
  const isOwner = useIsOwner()
  if (!isOwner) {
    return <EmptyState icon={Lock} title="Only the owner can see analytics" description="Log in with the owner account to view profit and trends." />
  }
  return <Analytics />
}

function Analytics() {
  const lrs = useCompanyLrs()
  const look = useLookups()
  const company = useStore((s) => s.company)
  const [params, setParams] = useSearchParams()
  const [showTable, setShowTable] = useState(false)

  // Filters live in the URL so a view can be bookmarked / shared
  // Default: All time, so every booking already entered (by either login) is counted
  const kind = (["all", "week", "month", "year", "custom"].includes(params.get("p") ?? "") ? params.get("p") : "all") as PeriodKind
  const latest = latestDate(lrs)
  const earliest = earliestDate(lrs)
  // A week / month / year opens on the current one — or, if nothing is booked in it yet,
  // on the latest one that has bookings, so it never opens empty.
  const emptyNow = (k: Browsable) => inRange(lrs, periodRange(k, today())).length === 0
  const picked = params.get("a")
  const anchor = picked ?? (latest && isBrowsable(kind) && emptyNow(kind) ? latest : today())
  const jumped = !picked && isBrowsable(kind) && anchor !== today()
  const customBase = latest && emptyNow("month") ? latest : today()
  const customFrom = params.get("from") ?? periodRange("month", customBase).from
  const customTo = params.get("to") ?? (customBase === today() ? today() : periodRange("month", customBase).to)
  const setFilter = (next: Record<string, string>) => setParams({ ...Object.fromEntries(params), ...next }, { replace: true })

  const range: Range =
    kind === "all"
      ? { from: earliest ?? today(), to: latest && latest > today() ? latest : today() }
      : kind === "custom"
        ? { from: customFrom <= customTo ? customFrom : customTo, to: customFrom <= customTo ? customTo : customFrom }
        : periodRange(kind, anchor)
  const prev = previousRange(kind, range)
  const vs = previousName(kind, range)

  // A few hundred LRs at most — cheap enough to recompute each render
  const now = inRange(lrs, range)
  const t = totals(now)
  const p = totals(inRange(lrs, prev))
  const points = series(now, range)
  const parties = topParties(now, (lr) => look.party(lr.billTo === "consignee" ? lr.consigneeId : lr.consignorId)?.name)
  // No browsing into periods that haven't started yet
  const nextStartsLater = isBrowsable(kind) && periodRange(kind, shiftAnchor(kind, anchor, 1)).from > today()
  // "vs last month" only makes sense when there is a previous period
  const delta = (nowV: number, beforeV: number) => (kind === "all" ? null : <Delta now={nowV} before={beforeV} vs={vs} />)
  const margin = t.bill ? t.profit / t.bill : 0

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${company === "all" ? "Logistics and Roadways" : COMPANY_LABEL[company]} · change company from the switch at the top`}
      />

      {/* One filter row above everything it scopes */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={kind} onValueChange={(v) => setFilter({ p: String(v) })}>
          <TabsList>
            {KINDS.map((k) => (
              <TabsTrigger key={k.value} value={k.value}>
                {k.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {kind === "all" ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Every booking · <span className="font-medium text-foreground">{rangeLabel("custom", range)}</span>
          </p>
        ) : kind === "custom" ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="an-from" className="text-muted-foreground">From</label>
            <Input id="an-from" type="date" className="w-40" value={customFrom} max={customTo} onChange={(e) => e.target.value && setFilter({ from: e.target.value })} />
            <label htmlFor="an-to" className="text-muted-foreground">to</label>
            <Input id="an-to" type="date" className="w-40" value={customTo} min={customFrom} onChange={(e) => e.target.value && setFilter({ to: e.target.value })} />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" aria-label={`Previous ${kind}`} onClick={() => setFilter({ a: shiftAnchor(kind, anchor, -1) })}>
              <ChevronLeft />
            </Button>
            <p className="min-w-40 text-center text-sm font-medium" aria-live="polite">{rangeLabel(kind, range)}</p>
            <Button variant="outline" size="icon-sm" aria-label={`Next ${kind}`} disabled={nextStartsLater} onClick={() => setFilter({ a: shiftAnchor(kind, anchor, 1) })}>
              <ChevronRight />
            </Button>
            {range.to < today() && (
              <Button variant="ghost" size="sm" onClick={() => setFilter({ a: today() })}>
                This {kind}
              </Button>
            )}
          </div>
        )}
      </div>
      {jumped && (
        <p className="-mt-3 text-sm text-muted-foreground">
          Nothing booked in {rangeLabel(kind, periodRange(kind as Browsable, today()))} yet — showing{" "}
          {rangeLabel(kind, range)}, the latest {kind} with bookings.
        </p>
      )}

      {now.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={`No bookings in ${rangeLabel(kind, range)}`}
          description={latest ? "Pick another period, or jump to where the latest bookings are." : "Bookings you add will show up here."}
          action={
            latest && (
              <Button variant="outline" onClick={() => setFilter(kind === "custom" ? { p: "month", a: latest } : { a: latest })}>
                Jump to latest bookings ({rangeLabel("month", periodRange("month", latest))})
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatCard label="Bookings" value={String(t.count)} icon={FileText} tint="lavender" hint={delta(t.count, p.count) ?? `Since ${rangeLabel("custom", { from: range.from, to: range.from })}`} />
            <StatCard label="Billed" value={moneyShort(t.bill)} icon={IndianRupee} tint="rose" hint={delta(t.bill, p.bill) ?? `${moneyShort(t.count ? t.bill / t.count : 0)} per booking`} />
            <StatCard
              label="Received"
              value={moneyShort(t.received)}
              icon={ArrowDownCircle}
              tint="mint"
              hint={t.toCollect > 0 ? `${moneyShort(t.toCollect)} still to collect` : "All collected"}
            />
            <StatCard label="Freight" value={moneyShort(t.freight)} icon={Truck} tint="sky" hint={t.toPayOwner > 0 ? `${moneyShort(t.toPayOwner)} still to pay` : "All paid"} />
            <StatCard
              label="Profit"
              value={moneyShort(t.profit)}
              icon={IndianRupee}
              tint="cream"
              className="col-span-2 lg:col-span-1"
              tone={t.profit < 0 ? "bad" : "default"}
              hint={
                <>
                  {Math.round(margin * 100)}% margin
                  {kind !== "all" && <> · {delta(t.profit, p.profit)}</>}
                </>
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Billed and freight</CardTitle>
              <CardDescription>
                {rangeLabel(kind, range)} · hover the line for profit and bookings
              </CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" aria-pressed={showTable} onClick={() => setShowTable((s) => !s)}>
                  {showTable ? <BarChart3 /> : <Table2 />} {showTable ? "Chart" : "Table"}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {showTable ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Freight</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="tabular-nums">
                    {points.map((pt) => (
                      <TableRow key={pt.from}>
                        <TableCell>{pt.title}</TableCell>
                        <TableCell className="text-right">{pt.t.count}</TableCell>
                        <TableCell className="text-right">{money(pt.t.bill)}</TableCell>
                        <TableCell className="text-right">{money(pt.t.freight)}</TableCell>
                        <TableCell className={cn("text-right", pt.t.profit < 0 && "text-destructive")}>{money(pt.t.profit)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{t.count}</TableCell>
                      <TableCell className="text-right">{money(t.bill)}</TableCell>
                      <TableCell className="text-right">{money(t.freight)}</TableCell>
                      <TableCell className="text-right">{money(t.profit)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <AreaChart
                  series={SERIES}
                  format={money}
                  ariaLabel={`Billed and freight, ${rangeLabel(kind, range)}`}
                  columns={points.map((pt) => ({
                    title: pt.title,
                    values: [pt.t.bill, pt.t.freight],
                    extra: [
                      { name: "Profit", value: money(pt.t.profit) },
                      { name: pt.t.count === 1 ? "Booking" : "Bookings", value: String(pt.t.count) },
                    ],
                  }))}
                  footer={
                    <div className="flex gap-1" role="group" aria-label="Period">
                      {KINDS.map((k) => (
                        <button
                          key={k.value}
                          type="button"
                          aria-pressed={kind === k.value}
                          onClick={() => setFilter({ p: k.value })}
                          className={cn(
                            "rounded-md px-2 py-1 text-[11px] tracking-wide text-muted-foreground hover:text-foreground",
                            kind === k.value && "font-bold text-foreground",
                          )}
                        >
                          {PILL[k.value]}
                        </button>
                      ))}
                    </div>
                  }
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top billing parties</CardTitle>
                <CardDescription>Billed in {rangeLabel(kind, range)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3">
                  {parties.map((pt) => (
                    <li key={pt.name} className="grid gap-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate">{pt.name}</span>
                        <span className="font-medium tabular-nums">{money(pt.billed)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full" style={{ width: `${(pt.billed / parties[0].billed) * 100}%`, background: SERIES[0].color }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By company</CardTitle>
                <CardDescription>{rangeLabel(kind, range)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="tabular-nums">
                    {(["logistics", "roadways"] as Company[]).map((c) => {
                      const ct = totals(byCompany(now, c))
                      return (
                        <TableRow key={c}>
                          <TableCell><CompanyBadge company={c} /></TableCell>
                          <TableCell className="text-right">{ct.count}</TableCell>
                          <TableCell className="text-right">{money(ct.bill)}</TableCell>
                          <TableCell className={cn("text-right", ct.profit < 0 && "text-destructive")}>{money(ct.profit)}</TableCell>
                          <TableCell className="text-right">{ct.bill ? `${Math.round((ct.profit / ct.bill) * 100)}%` : "—"}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
