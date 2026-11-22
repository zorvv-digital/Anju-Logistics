import { ArrowDownCircle, ArrowUpCircle, ChevronRight, IndianRupee, Truck } from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar } from "@/components/common/Avatar"
import { CompanyBadge } from "@/components/common/badges"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { EmptyState } from "@/components/common/states"
import { OwnerOnly } from "@/components/layout/OwnerOnly"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { byCompany, totals } from "@/lib/calc"
import { date, money, moneyShort } from "@/lib/format"
import { tintBg } from "@/lib/tint"
import { COMPANY_LABEL, type Company } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useCompanyLrs, useLookups, useNeedsAction, useTotals } from "@/store/selectors"

export function HomePage() {
  const lrs = useCompanyLrs()
  const t = useTotals(lrs)
  const needs = useNeedsAction(lrs)
  const look = useLookups()

  return (
    <>
      <PageHeader title="Today" description="What needs your attention" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="To collect from parties" value={moneyShort(t.toCollect)} icon={ArrowDownCircle} tint="mint" hint="From billing parties" />
        <StatCard label="To pay truck owners" value={moneyShort(t.toPayOwner)} icon={ArrowUpCircle} tint="rose" hint="Freight still due" />
        <StatCard label="Trucks on the road" value={String(t.onRoad)} icon={Truck} tint="lavender" hint={`${t.count} bookings in all`} />
        <OwnerOnly fallback={<StatCard label="Bookings" value={String(t.count)} icon={IndianRupee} tint="cream" />}>
          <StatCard label="Profit" value={moneyShort(t.profit)} icon={IndianRupee} tint="cream" tone={t.profit < 0 ? "bad" : "default"} hint={`Received ${moneyShort(t.received)}`} />
        </OwnerOnly>
      </div>

      <OwnerOnly>
        <div className="grid gap-4 md:grid-cols-2">
          {(["logistics", "roadways"] as Company[]).map((c) => {
            const ct = totals(byCompany(lrs, c))
            if (!ct.count) return null
            return (
              <div key={c} className={cn("rounded-2xl p-5", tintBg[c === "roadways" ? "sky" : "rose"])}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
                    <img src="/logo-mark.png" alt="" className="size-6" />
                  </span>
                  <div>
                    <p className="font-bold tracking-tight">{COMPANY_LABEL[c]}</p>
                    <p className="text-xs text-foreground/60">{ct.count} bookings</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Billed", ct.bill],
                    ["Freight", ct.freight],
                    ["Profit", ct.profit],
                  ].map(([label, v]) => (
                    <div key={label} className="rounded-xl bg-white/70 px-3 py-2.5">
                      <dt className="text-xs text-foreground/60">{label}</dt>
                      <dd className={cn("font-bold tracking-tight", label === "Profit" && (v as number) < 0 && "text-destructive")}>
                        {moneyShort(v as number)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )
          })}
        </div>
      </OwnerOnly>

      <Card>
        <CardHeader>
          <CardTitle>Money to collect</CardTitle>
          <CardDescription>Oldest unpaid bills first</CardDescription>
          <CardAction>
            <Link to="/lr?filter=due" className={buttonVariants({ variant: "outline", size: "sm" })}>
              See all <ChevronRight />
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {needs.length === 0 ? (
            <EmptyState title="All bills collected" description="Nothing pending from parties right now." />
          ) : (
            <ul className="grid gap-1">
              {needs.map(({ lr, m }) => {
                const party = look.party(lr.billTo === "consignee" ? lr.consigneeId : lr.consignorId)?.name ?? "Unknown party"
                return (
                  <li key={lr.id}>
                    <Link to={`/lr/${lr.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted">
                      <Avatar name={party} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{party}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="truncate">LR {lr.lrNo} · {date(lr.date)} · {lr.to}</span>
                          <span className="hidden sm:inline-flex">
                            <CompanyBadge company={lr.company} short />
                          </span>
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-destructive tabular-nums">{money(m.toCollect)}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
