import { Field } from "@/components/common/Field"
import { SimpleSelect } from "@/components/common/SimpleSelect"
import { ComboField } from "@/components/master/ComboField"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { normalizeGst } from "@/lib/gst"
import type { BillTo, Company } from "@/lib/types"
import { useLookups } from "@/store/selectors"
import { MaterialField } from "./MaterialField"
import { PlaceField } from "./PlaceField"
import type { SectionProps } from "./types"

export function ShipmentSection({ draft, errors, set, onCompany }: SectionProps & { onCompany: (c: Company) => void }) {
  const look = useLookups()
  const consignor = look.party(draft.consignorId)
  const consignee = look.party(draft.consigneeId)
  const payer = draft.billTo === "consignee" ? consignee : consignor
  const gstHint = !payer
    ? undefined
    : !draft.billingGst
      ? `Not on file for ${payer.name} — type it once and it fills in next time`
      : draft.billingGst === (payer.gst ?? "")
        ? `Saved for ${payer.name}`
        : `Will be saved to ${payer.name} for next time`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" className="sm:col-span-2">
          <Tabs value={draft.company} onValueChange={(v) => onCompany(v as Company)}>
            <TabsList>
              <TabsTrigger value="logistics" disabled={!!draft.id} className="data-active:bg-primary data-active:text-primary-foreground">Anju Logistics</TabsTrigger>
              <TabsTrigger value="roadways" disabled={!!draft.id} className="data-active:bg-navy data-active:text-white">Anju Roadways</TabsTrigger>
            </TabsList>
          </Tabs>
        </Field>
        <Field label="LR number" htmlFor="lrNo" error={errors.lrNo} hint="Filled in automatically">
          <Input id="lrNo" inputMode="numeric" value={draft.lrNo} aria-invalid={!!errors.lrNo} onChange={(e) => set("lrNo", e.target.value)} />
        </Field>
        <Field label="Date" htmlFor="date" error={errors.date}>
          <Input id="date" type="date" value={draft.date} aria-invalid={!!errors.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Consignor" htmlFor="consignor" error={errors.consignorId}>
          <ComboField id="consignor" kind="parties" value={draft.consignorId} invalid={!!errors.consignorId} onChange={(v) => set("consignorId", v)} />
        </Field>
        <Field label="Consignee" htmlFor="consignee" error={errors.consigneeId}>
          <ComboField id="consignee" kind="parties" value={draft.consigneeId} invalid={!!errors.consigneeId} onChange={(v) => set("consigneeId", v)} />
        </Field>
        <Field label="From" htmlFor="from" error={errors.from}>
          <PlaceField id="from" value={draft.from} invalid={!!errors.from} onChange={(v) => set("from", v)} />
        </Field>
        <Field label="To" htmlFor="to" error={errors.to}>
          <PlaceField id="to" value={draft.to} invalid={!!errors.to} onChange={(v) => set("to", v)} />
        </Field>
        <Field label="Material" htmlFor="material" error={errors.material} className="sm:col-span-2">
          <MaterialField id="material" value={draft.material} invalid={!!errors.material} onChange={(v) => set("material", v)} />
        </Field>
        <Field label="Billing party" htmlFor="billTo" hint={payer ? undefined : "Pick the consignor and consignee first"}>
          <SimpleSelect<BillTo>
            id="billTo"
            value={draft.billTo}
            onChange={(v) => set("billTo", v)}
            options={[
              { value: "consignor", label: consignor ? `${consignor.name} (Consignor)` : "Consignor" },
              { value: "consignee", label: consignee ? `${consignee.name} (Consignee)` : "Consignee" },
            ]}
          />
        </Field>
        <Field label="Billing party GST" htmlFor="billingGst" error={errors.billingGst} hint={gstHint}>
          <Input
            id="billingGst"
            placeholder="32ALIPP8511G1Z6"
            maxLength={15}
            autoComplete="off"
            className="uppercase"
            disabled={!payer}
            value={draft.billingGst}
            aria-invalid={!!errors.billingGst}
            onChange={(e) => set("billingGst", normalizeGst(e.target.value))}
          />
        </Field>
      </CardContent>
    </Card>
  )
}
