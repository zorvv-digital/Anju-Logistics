import { Field } from "@/components/common/Field"
import { SimpleSelect } from "@/components/common/SimpleSelect"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { money } from "@/lib/format"
import { margin } from "@/lib/lrForm"
import { PAYMODE_LABEL, type PayMode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useIsOwner } from "@/store/selectors"
import type { SectionProps } from "./types"

const modes = (Object.keys(PAYMODE_LABEL) as PayMode[]).map((value) => ({ value, label: PAYMODE_LABEL[value] }))

export function MoneySection({ draft, errors, set }: SectionProps) {
  const isOwner = useIsOwner()
  const m = margin(draft)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Bill amount (₹)" htmlFor="bill" error={errors.billAmount}>
          <Input id="bill" inputMode="numeric" placeholder="90000" value={draft.billAmount} aria-invalid={!!errors.billAmount} onChange={(e) => set("billAmount", e.target.value)} />
        </Field>
        <Field label="Payment type" htmlFor="payMode">
          <SimpleSelect id="payMode" value={draft.payMode} options={modes} onChange={(v) => set("payMode", v)} />
        </Field>
        <Field label="Discount / TDS (₹)" htmlFor="discount" error={errors.discount}>
          <Input id="discount" inputMode="numeric" placeholder="0" value={draft.discount} aria-invalid={!!errors.discount} onChange={(e) => set("discount", e.target.value)} />
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
