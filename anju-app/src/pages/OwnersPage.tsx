import { ChevronDown, PartyPopper, Search, SearchX, Truck } from "lucide-react"
import { useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Avatar } from "@/components/common/Avatar"
import { CompanyBadge } from "@/components/common/badges"
import { Field } from "@/components/common/Field"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { allocateOwnerPayment, lrMoney } from "@/lib/calc"
import { date, money, today } from "@/lib/format"
import { PAGE_SEARCH_ID } from "@/lib/pageSearch"
import { useLookups, useOwnerDues } from "@/store/selectors"
import { useStore } from "@/store/useStore"

type Due = ReturnType<typeof useOwnerDues>[number]

/** "KL 49-H 9086" → "kl49h9086", so truck numbers match however they're typed */
const squash = (s: string) => s.toLowerCase().replace(/[\s\-./]/g, "")

export function OwnersPage() {
  const dues = useOwnerDues()
  const trucks = useStore((s) => s.trucks)
  const total = dues.reduce((t, d) => t + d.due, 0)
  const [paying, setPaying] = useState<Due | null>(null)
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const q = params.get("q") ?? ""

  const setQ = (v: string) => setParams(v ? { q: v } : {}, { replace: true })

  // Match the owner's name, or any truck they own
  const needle = q.trim().toLowerCase()
  const shown = needle
    ? dues.filter((d) => {
        const name = (d.owner?.name ?? "").toLowerCase()
        const numbers = trucks.filter((t) => t.ownerId && t.ownerId === d.owner?.id).map((t) => squash(t.number))
        return name.includes(needle) || numbers.some((n) => n.includes(squash(needle)))
      })
    : dues

  return (
    <>
      <PageHeader title="Truck owners" description={`${money(total)} to pay · Logistics and Roadways added together`} />
      {dues.length === 0 ? (
        <EmptyState icon={PartyPopper} title="All owners are paid" description="Balances show up here after a truck is booked." />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              id={PAGE_SEARCH_ID}
              type="search"
              aria-label="Search truck owners"
              className="h-10 rounded-full bg-card pr-4 pl-9"
              placeholder="Search by truck number or owner name…"
              // The round search button in the top bar lands here with the box ready to type in
              autoFocus={!!(location.state as { focusSearch?: boolean } | null)?.focusSearch}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {needle && shown.length > 0 && (
            <p className="-mt-3 text-sm text-muted-foreground">
              {shown.length} of {dues.length} owners match “{q.trim()}”
            </p>
          )}
          {shown.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No owner or truck matches"
              description={`Nothing found for “${q.trim()}”. Check the truck number or the owner's name.`}
              action={<Button variant="outline" onClick={() => setQ("")}>Clear search</Button>}
            />
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {shown.map((d) => (
                <OwnerCard key={d.owner?.id ?? "unknown"} due={d} onPay={() => setPaying(d)} />
              ))}
            </div>
          )}
        </>
      )}
      <SettleDialog key={paying?.owner?.id ?? "none"} due={paying} onClose={() => setPaying(null)} />
    </>
  )
}

function OwnerCard({ due, onPay }: { due: Due; onPay: () => void }) {
  const [open, setOpen] = useState(false)
  const allTrucks = useStore((s) => s.trucks)
  const look = useLookups()
  // Every truck this owner has on file (not just the ones on unpaid trips)
  const trucks = allTrucks.filter((t) => t.ownerId && t.ownerId === due.owner?.id)
  const truckNos = trucks.map((t) => t.number).join(", ")
  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={due.owner?.name ?? "Unknown owner"} className="size-10" />
          <div className="min-w-0">
            <CardTitle className="truncate">{due.owner?.name ?? "Unknown owner"}</CardTitle>
            {/* Truck numbers in place of PAN (PAN is still on the owner record and on printouts) */}
            <CardDescription className="flex min-w-0 items-center gap-1.5" title={truckNos}>
              <Truck className="size-3.5 shrink-0" aria-label={trucks.length > 1 ? "Trucks" : "Truck"} />
              <span className="truncate">
                <span className="font-semibold tracking-wide text-foreground/80">{truckNos || "No truck on file"}</span>
                {" · "}
                {due.lrs.length} unpaid trip{due.lrs.length > 1 ? "s" : ""}
                {due.owner?.phone && ` · ${due.owner.phone}`}
              </span>
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <Button onClick={onPay}>Pay</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-tint-sky px-3 py-2.5">
            <dt className="text-xs text-foreground/60">Freight</dt>
            <dd className="font-bold tracking-tight tabular-nums">{money(due.freight)}</dd>
          </div>
          <div className="rounded-xl bg-tint-mint px-3 py-2.5">
            <dt className="text-xs text-foreground/60">Paid</dt>
            <dd className="font-bold tracking-tight tabular-nums">{money(due.paid)}</dd>
          </div>
          <div className="rounded-xl bg-tint-rose px-3 py-2.5">
            <dt className="text-xs text-foreground/60">Balance</dt>
            <dd className="font-bold tracking-tight text-destructive tabular-nums">{money(due.due)}</dd>
          </div>
        </dl>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <ChevronDown className={open ? "rotate-180" : ""} /> {open ? "Hide" : "Show"} trips
        </Button>
        {open && (
          <ul className="mt-2 divide-y text-sm">
            {due.lrs.map((lr) => {
              const m = lrMoney(lr)
              return (
                <li key={lr.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                  <Link to={`/lr/${lr.id}`} className="flex items-center gap-2 hover:underline">
                    LR {lr.lrNo} <CompanyBadge company={lr.company} short />
                    <span className="text-muted-foreground">
                      {date(lr.date)} · {lr.to}
                      {trucks.length > 1 && ` · ${look.truck(lr.truckId)?.number ?? "—"}`}
                    </span>
                  </Link>
                  <span className="flex gap-3 text-xs tabular-nums">
                    <span><span className="text-muted-foreground">Freight </span>{money(m.freight)}</span>
                    <span><span className="text-muted-foreground">Paid </span><span className="text-emerald-600">{money(m.ownerPaid)}</span></span>
                    <span><span className="text-muted-foreground">Bal </span><span className="font-medium text-destructive">{money(m.toPayOwner)}</span></span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Pay an owner the full balance or any part of it. Part payments clear the oldest trips first. */
function SettleDialog({ due, onClose }: { due: Due | null; onClose: () => void }) {
  const settleOwner = useStore((s) => s.settleOwner)
  const [amount, setAmount] = useState(due ? String(due.due) : "")
  const [day, setDay] = useState(today())
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const n = Number(amount)
  const valid = !!amount.trim() && !Number.isNaN(n) && n > 0 && n <= (due?.due ?? 0)
  const split = due && valid ? allocateOwnerPayment(due.lrs, n) : []
  const partial = valid && due && n < due.due

  const confirm = () => {
    if (!due) return
    if (!amount.trim() || Number.isNaN(n) || n <= 0) return setError("Enter an amount more than 0")
    if (n > due.due) return setError(`Only ${money(due.due)} is due to this owner`)
    if (!day) return setError("Pick a date")
    settleOwner(due.lrs.map((l) => l.id), day, note.trim() || (n < due.due ? "Part payment" : "Weekly settlement"), n)
    const left = due.due - n
    toast.success(
      `${money(n)} paid to ${due.owner?.name ?? "owner"}` + (left > 0 ? ` · ${money(left)} still due` : ""),
    )
    onClose()
  }

  return (
    <Dialog open={!!due} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay {due?.owner?.name}</DialogTitle>
          <DialogDescription>
            {money(due?.due ?? 0)} due across {due?.lrs.length} trip(s). Pay it all, or enter a smaller amount.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            confirm()
          }}
        >
          <Field label="Amount (₹)" htmlFor="settle-amount" error={error}>
            <div className="flex gap-2">
              <Input
                id="settle-amount"
                autoFocus
                inputMode="decimal"
                value={amount}
                aria-invalid={!!error}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError(null)
                }}
              />
              <Button type="button" variant="outline" onClick={() => { setAmount(String(due?.due ?? "")); setError(null) }}>
                Full
              </Button>
            </div>
          </Field>
          {split.length > 0 && (
            <div className="rounded-lg border bg-muted p-2 text-xs">
              <p className="mb-1 font-medium">{partial ? "Part payment — goes to the oldest trips first:" : "Clears every trip:"}</p>
              <ul className="grid gap-0.5">
                {split.map((s) => (
                  <li key={s.lr.id} className="flex justify-between gap-2 tabular-nums">
                    <span>LR {s.lr.lrNo} · {date(s.lr.date)}</span>
                    <span>
                      {money(s.amount)}
                      {s.amount < s.due && <span className="text-muted-foreground"> of {money(s.due)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {partial && due && (
                <p className="mt-1 font-medium text-destructive">{money(due.due - n)} will still be due</p>
              )}
            </div>
          )}
          <Field label="Date" htmlFor="settle-date">
            <Input id="settle-date" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </Field>
          <Field label="Note (optional)" htmlFor="settle-note">
            <Input id="settle-note" placeholder="UPI ref, cash, cheque no…" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{partial ? `Pay ${money(n)}` : "Pay in full"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
