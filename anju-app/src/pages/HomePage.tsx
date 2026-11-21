import { ArrowDownCircle, ArrowUpCircle, IndianRupee, Truck } from "lucide-react"
import { Link } from "react-router-dom"
import { CompanyBadge } from "@/components/common/badges"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { EmptyState } from "@/components/common/states"
import { OwnerOnly } from "@/components/layout/OwnerOnly"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { byCompany, totals } from "@/lib/calc"
import { date, money, moneyShort } from "@/lib/format"
import { COMPANY_LABEL, type Company } from "@/lib/types"
import { useCompanyLrs, useLookups, useNeedsAction, useTotals } from "@/store/selectors"

export function HomePage() {
  const lrs = useCompanyLrs()
  const t = useTotals(lrs)
  const needs = useNeedsAction(lrs)
  const look = useLookups()

  return (
    <>
      <PageHeader title="Today" description="What needs your attention" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="To collect from parties" value={moneyShort(t.toCollect)} icon={ArrowDownCircle} tone="good" />
        <StatCard label="To pay truck owners" value={moneyShort(t.toPayOwner)} icon={ArrowUpCircle} tone="bad" />
        <StatCard label="Trucks on the road" value={String(t.onRoad)} icon={Truck} />
        <OwnerOnly fallback={<StatCard label="Bookings" value={String(t.count)} icon={IndianRupee} />}>
          <StatCard label="Profit" value={moneyShort(t.profit)} icon={IndianRupee} hint={`Received ${moneyShort(t.received)}`} />
        </OwnerOnly>
      </div>

      <OwnerOnly>
        <div className="grid gap-4 md:grid-cols-2">
          {(["logistics", "roadways"] as Company[]).map((c) => {
            const ct = totals(byCompany(lrs, c))
            if (!ct.count) return null
            return (
              <Card key={c}>
                <CardHeader>
                  <CardTitle>{COMPANY_LABEL[c]}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-muted-foreground">Billed</p><p className="font-medium">{money(ct.bill)}</p></div>
                  <div><p className="text-muted-foreground">Freight</p><p className="font-medium">{money(ct.freight)}</p></div>
                  <div><p className="text-muted-foreground">Profit</p><p className="font-medium text-emerald-600">{money(ct.profit)}</p></div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </OwnerOnly>

      <Card>
        <CardHeader>
          <CardTitle>Money to collect</CardTitle>
        </CardHeader>
        <CardContent>
          {needs.length === 0 ? (
            <EmptyState title="All bills collected" description="Nothing pending from parties right now." />
          ) : (
            <ul className="divide-y">
              {needs.map(({ lr, m }) => (
                <li key={lr.id}>
                  <Link to={`/lr/${lr.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        LR {lr.lrNo} · {look.party(lr.billTo === "consignee" ? lr.consigneeId : lr.consignorId)?.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {date(lr.date)} · {lr.to} <CompanyBadge company={lr.company} short />
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-destructive tabular-nums">{money(m.toCollect)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/lr?filter=due" className={buttonVariants({ variant: "outline", className: "mt-3 w-full" })}>
            See all pending
          </Link>
        </CardContent>
      </Card>
    </>
  )
}
