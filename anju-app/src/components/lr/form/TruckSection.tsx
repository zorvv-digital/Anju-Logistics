import { Field } from "@/components/common/Field"
import { ComboField } from "@/components/master/ComboField"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { money, text } from "@/lib/format"
import { ownerBalance } from "@/lib/lrForm"
import { cn } from "@/lib/utils"
import { useLookups } from "@/store/selectors"
import type { SectionProps } from "./types"

export function TruckSection({ draft, errors, set, ownerPaid }: SectionProps & { ownerPaid: number }) {
  const look = useLookups()
  const owner = look.owner(look.ownerOfTruck(draft.truckId))
  const driver = look.driver(draft.driverId)
  const topay = draft.payMode === "topay"
  const left = ownerBalance(draft, ownerPaid) - (Number(draft.paid) || 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Truck</CardTitle>
        <CardDescription>You can add this later if the truck isn't fixed yet.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Truck number" htmlFor="truck" error={errors.truckId}>
          <ComboField id="truck" kind="trucks" value={draft.truckId} invalid={!!errors.truckId} onChange={(v) => set("truckId", v)} />
        </Field>
        <Field label="Owner · PAN" hint="Filled in from the truck">
          <Input readOnly tabIndex={-1} className="bg-muted" value={owner ? `${owner.name} · ${text(owner.pan)}` : ""} placeholder="Choose a truck" />
        </Field>
        <Field label="Driver" htmlFor="driver">
          <ComboField id="driver" kind="drivers" value={draft.driverId} onChange={(v) => set("driverId", v)} />
        </Field>
        <Field label="Driver phone" hint="Filled in from the driver">
          <Input readOnly tabIndex={-1} className="bg-muted" value={driver?.phone ?? ""} placeholder="Choose a driver" />
        </Field>
        <Field label="Freight to owner (₹)" htmlFor="freight" error={errors.freight}>
          <Input id="freight" inputMode="numeric" placeholder="85000" value={draft.freight} aria-invalid={!!errors.freight} onChange={(e) => set("freight", e.target.value)} />
        </Field>
        <Field
          label={ownerPaid > 0 ? "New payment to owner (₹)" : "Paid to owner (₹)"}
          htmlFor="paid"
          error={errors.paid}
          hint={
            topay
              ? "To pay — the consignee pays the driver directly"
              : ownerPaid > 0
                ? `${money(ownerPaid)} paid already — enter only a new amount`
                : "Advance or amount paid to the truck owner so far"
          }
        >
          <Input
            id="paid"
            inputMode="numeric"
            placeholder="0"
            disabled={topay}
            value={topay ? "" : draft.paid}
            aria-invalid={!!errors.paid}
            onChange={(e) => set("paid", e.target.value)}
          />
        </Field>
        <Field label="Balance to pay owner" hint={topay ? undefined : "Freight − paid"}>
          <p className={cn("flex h-8 items-center text-lg font-semibold tabular-nums", !topay && left > 0 && "text-destructive", !topay && left <= 0 && Number(draft.freight) > 0 && "text-emerald-600")}>
            {topay ? "—" : money(Math.max(0, left))}
          </p>
        </Field>
      </CardContent>
    </Card>
  )
}
