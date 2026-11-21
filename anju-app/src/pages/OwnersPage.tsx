import { ChevronDown, PartyPopper } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { CompanyBadge } from "@/components/common/badges"
import { Field } from "@/components/common/Field"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { lrMoney } from "@/lib/calc"
import { date, money, text, today } from "@/lib/format"
import { useOwnerDues } from "@/store/selectors"
import { useStore } from "@/store/useStore"

type Due = ReturnType<typeof useOwnerDues>[number]

export function OwnersPage() {
  const dues = useOwnerDues()
  const total = dues.reduce((t, d) => t + d.due, 0)
  const [paying, setPaying] = useState<Due | null>(null)

  return (
    <>
      <PageHeader title="Truck owners" description={`${money(total)} to pay · Logistics and Roadways added together`} />
      {dues.length === 0 ? (
        <EmptyState icon={PartyPopper} title="All owners are paid" description="Balances show up here after a truck is booked." />
      ) : (
        <div className="grid gap-3">
          {dues.map((d) => (
            <OwnerCard key={d.owner?.id ?? "unknown"} due={d} onPay={() => setPaying(d)} />
          ))}
        </div>
      )}
      <SettleDialog due={paying} onClose={() => setPaying(null)} />
    </>
  )
}

function OwnerCard({ due, onPay }: { due: Due; onPay: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{due.owner?.name ?? "Unknown owner"}</CardTitle>
        <CardDescription>
          {due.lrs.length} trip{due.lrs.length > 1 ? "s" : ""} · PAN {text(due.owner?.pan)} · {text(due.owner?.phone)}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <span className="font-semibold text-destructive tabular-nums">{money(due.due)}</span>
          <Button size="sm" onClick={onPay}>Pay all</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <ChevronDown className={open ? "rotate-180" : ""} /> {open ? "Hide" : "Show"} trips
        </Button>
        {open && (
          <ul className="mt-2 divide-y text-sm">
            {due.lrs.map((lr) => (
              <li key={lr.id} className="flex items-center justify-between gap-2 py-2">
                <Link to={`/lr/${lr.id}`} className="flex items-center gap-2 hover:underline">
                  LR {lr.lrNo} <CompanyBadge company={lr.company} short />
                  <span className="text-muted-foreground">{date(lr.date)} · {lr.to}</span>
                </Link>
                <span className="tabular-nums">{money(lrMoney(lr).toPayOwner)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function SettleDialog({ due, onClose }: { due: Due | null; onClose: () => void }) {
  const settleOwner = useStore((s) => s.settleOwner)
  const [day, setDay] = useState(today())
  const [note, setNote] = useState("")

  const confirm = () => {
    if (!due) return
    settleOwner(due.lrs.map((l) => l.id), day, note.trim() || "Weekly settlement")
    toast.success(`${money(due.due)} paid to ${due.owner?.name ?? "owner"}`)
    setNote("")
    onClose()
  }

  return (
    <Dialog open={!!due} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay {due?.owner?.name}</DialogTitle>
          <DialogDescription>
            Clears {due?.lrs.length} trip balance(s): {money(due?.due ?? 0)} in one payment.
          </DialogDescription>
        </DialogHeader>
        <Field label="Date" htmlFor="settle-date">
          <Input id="settle-date" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
        <Field label="Note (optional)" htmlFor="settle-note">
          <Input id="settle-note" placeholder="UPI ref, cash, cheque no…" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm}>Confirm payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
