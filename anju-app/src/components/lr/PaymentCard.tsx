import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { date, money } from "@/lib/format"
import type { Lr } from "@/lib/types"
import { useStore, type PaymentSide } from "@/store/useStore"
import { PaymentDialog } from "./PaymentDialog"

interface Props {
  lr: Lr
  side: PaymentSide
  title: string
  total: number
  balance: number
  /** Shown instead of the list when money doesn't pass through Anju (To pay) */
  blockedReason?: string | null
}

export function PaymentCard({ lr, side, title, total, balance, blockedReason }: Props) {
  const [open, setOpen] = useState(false)
  const addPayment = useStore((s) => s.addPayment)
  const removePayment = useStore((s) => s.removePayment)
  const payments = lr[side]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {money(total)} total ·{" "}
          <span className={balance > 0 ? "font-medium text-destructive" : "text-emerald-600"}>
            {balance > 0 ? `${money(balance)} left` : "Settled"}
          </span>
        </CardDescription>
        {!blockedReason && balance > 0 && (
          <CardAction>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus /> Add
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {blockedReason ? (
          <p className="text-sm text-muted-foreground">{blockedReason}</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium tabular-nums">{money(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {date(p.date)}
                    {p.note && ` · ${p.note}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove payment"
                  onClick={() => {
                    removePayment(lr.id, side, p.id)
                    toast("Payment removed", { action: { label: "Undo", onClick: () => addPayment(lr.id, side, p) } })
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <PaymentDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        balance={balance}
        onSave={(p) => {
          addPayment(lr.id, side, p)
          toast.success("Payment saved")
        }}
      />
    </Card>
  )
}
