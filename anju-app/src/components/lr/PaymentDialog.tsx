import { useState } from "react"
import { Field } from "@/components/common/Field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { money, today } from "@/lib/format"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  balance: number
  onSave: (p: { amount: number; date: string; note: string | null }) => void
}

/** Add one payment (received from party, or paid to owner). Any number of these per LR. */
export function PaymentDialog({ open, onOpenChange, title, balance, onSave }: Props) {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today())
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const close = (o: boolean) => {
    if (!o) {
      setAmount("")
      setNote("")
      setError(null)
      setDate(today())
    }
    onOpenChange(o)
  }

  const save = () => {
    const n = Number(amount)
    if (!amount.trim() || Number.isNaN(n) || n <= 0) return setError("Enter an amount more than 0")
    if (n > balance) return setError(`Only ${money(balance)} is left on this LR`)
    if (!date) return setError("Pick a date")
    onSave({ amount: n, date, note: note.trim() || null })
    close(false)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Balance left: {money(balance)}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            save()
          }}
        >
          <Field label="Amount (₹)" htmlFor="pay-amount" error={error}>
            <div className="flex gap-2">
              <Input
                id="pay-amount"
                autoFocus
                inputMode="numeric"
                value={amount}
                aria-invalid={!!error}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError(null)
                }}
              />
              <Button type="button" variant="outline" onClick={() => setAmount(String(balance))}>
                Full
              </Button>
            </div>
          </Field>
          <Field label="Date" htmlFor="pay-date">
            <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Note (optional)" htmlFor="pay-note">
            <Input id="pay-note" placeholder="Advance, cheque no, UPI ref…" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit">Save payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
