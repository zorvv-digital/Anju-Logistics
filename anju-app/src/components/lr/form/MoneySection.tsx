import { Field } from "@/components/common/Field"
import { SimpleSelect } from "@/components/common/SimpleSelect"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { money } from "@/lib/format"
import { billBalance, margin } from "@/lib/lrForm"
import { PAYMODE_LABEL, type PayMode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useIsOwner } from "@/store/selectors"
import type { SectionProps } from "./types"

const modes = (Object.keys(PAYMODE_LABEL) as PayMode[]).map((value) => ({ value, label: PAYMODE_LABEL[value] }))

export function MoneySection({ draft, errors, set, received }: SectionProps & { received: number }) {
  const isOwner = useIsOwner()
  const m = margin(draft)
  const topay = draft.payMode === "topay"
  const receipt = Number(draft.receipt) || 0
  const left = billBalance(draft, received) - receipt

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice No" htmlFor="invNo" hint="Same as the LR number">
          <Input id="invNo" readOnly tabIndex={-1} className="bg-muted tabular-nums" value={draft.lrNo} placeholder="Fills in from the LR number" />
        </Field>
        <Field label="Bill amount (₹)" htmlFor="bill" error={errors.billAmount}>
          <Input id="bill" inputMode="numeric" placeholder="90000" value={draft.billAmount} aria-invalid={!!errors.billAmount} onChange={(e) => set("billAmount", e.target.value)} />
        </Field>
        <Field label="Payment type" htmlFor="payMode">
          <SimpleSelect id="payMode" value={draft.payMode} options={modes} onChange={(v) => set("payMode", v)} />
        </Field>
        <Field label="Discount / TDS (₹)" htmlFor="discount" error={errors.discount}>
          <Input id="discount" inputMode="numeric" placeholder="0" value={draft.discount} aria-invalid={!!errors.discount} onChange={(e) => set("discount", e.target.value)} />
        </Field>
        <Field
          label={received > 0 ? "New receipt (₹)" : "Receipt (₹)"}
          htmlFor="receipt"
          error={errors.receipt}
          hint={
            topay
              ? "To pay — the consignee pays the driver directly"
              : received > 0
                ? `${money(received)} received already — enter only a new amount`
                : "Amount paid by the billing party so far"
          }
        >
          <Input
            id="receipt"
            inputMode="numeric"
            placeholder="0"
            disabled={topay}
            value={topay ? "" : draft.receipt}
            aria-invalid={!!errors.receipt}
            onChange={(e) => set("receipt", e.target.value)}
          />
        </Field>
        <Field label="Balance to collect" hint={topay ? undefined : "Bill − discount − receipts"}>
          <p className={cn("flex h-8 items-center text-lg font-semibold tabular-nums", !topay && left > 0 && "text-destructive", !topay && left <= 0 && Number(draft.billAmount) > 0 && "text-emerald-600")}>
            {topay ? "—" : money(Math.max(0, left))}
          </p>
        </Field>
        {isOwner && (
          <Field label="Margin" hint="Bill − discount − freight. Only the owner sees this.">
            <p className={cn("flex h-8 items-center text-lg font-semibold tabular-nums", m < 0 ? "text-destructive" : "text-emerald-600")}>
              {money(m)}
            </p>
          </Field>
        )}
        <Field label="Notes (optional)" htmlFor="remarks" className="sm:col-span-2">
          <Textarea id="remarks" rows={2} value={draft.remarks} onChange={(e) => set("remarks", e.target.value)} />
        </Field>
      </CardContent>
    </Card>
  )
}
