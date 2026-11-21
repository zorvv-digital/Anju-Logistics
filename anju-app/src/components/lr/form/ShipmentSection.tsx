import { Field } from "@/components/common/Field"
import { SimpleSelect } from "@/components/common/SimpleSelect"
import { ComboField } from "@/components/master/ComboField"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BillTo, Company } from "@/lib/types"
import { useLookups } from "@/store/selectors"
import { PlaceField } from "./PlaceField"
import type { SectionProps } from "./types"

export function ShipmentSection({ draft, errors, set, onCompany }: SectionProps & { onCompany: (c: Company) => void }) {
  const look = useLookups()
  const payer = look.party(draft.billTo === "consignee" ? draft.consigneeId : draft.consignorId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" className="sm:col-span-2">
          <Tabs value={draft.company} onValueChange={(v) => onCompany(v as Company)}>
            <TabsList>
              <TabsTrigger value="logistics" disabled={!!draft.id}>Anju Logistics</TabsTrigger>
              <TabsTrigger value="roadways" disabled={!!draft.id}>Anju Roadways</TabsTrigger>
            </TabsList>
          </Tabs>
        </Field>
        <Field label="LR number" htmlFor="lrNo" error={errors.lrNo} hint="Filled in automatically">
          <Input id="lrNo" inputMode="numeric" value={draft.lrNo} aria-invalid={!!errors.lrNo} onChange={(e) => set("lrNo", e.target.value)} />
        </Field>
        <Field label="Date" htmlFor="date" error={errors.date}>
          <Input id="date" type="date" value={draft.date} aria-invalid={!!errors.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Sender (consignor)" htmlFor="consignor" error={errors.consignorId}>
          <ComboField id="consignor" kind="parties" value={draft.consignorId} invalid={!!errors.consignorId} onChange={(v) => set("consignorId", v)} />
        </Field>
        <Field label="Receiver (consignee)" htmlFor="consignee" error={errors.consigneeId}>
          <ComboField id="consignee" kind="parties" value={draft.consigneeId} invalid={!!errors.consigneeId} onChange={(v) => set("consigneeId", v)} />
        </Field>
        <Field label="From" htmlFor="from" error={errors.from}>
          <PlaceField id="from" value={draft.from} invalid={!!errors.from} onChange={(v) => set("from", v)} />
        </Field>
        <Field label="To" htmlFor="to" error={errors.to}>
          <PlaceField id="to" value={draft.to} invalid={!!errors.to} onChange={(v) => set("to", v)} />
        </Field>
        <Field label="Material" htmlFor="material" error={errors.material} className="sm:col-span-2">
          <Input id="material" placeholder="Fishing net, 12 MT" value={draft.material} aria-invalid={!!errors.material} onChange={(e) => set("material", e.target.value)} />
        </Field>
        <Field label="Who pays the bill" htmlFor="billTo" hint={payer ? `GST: ${payer.gst ?? "not added"}` : "Pick sender and receiver first"}>
          <SimpleSelect<BillTo>
            id="billTo"
            value={draft.billTo}
            onChange={(v) => set("billTo", v)}
            options={[
              { value: "consignee", label: "Receiver pays" },
              { value: "consignor", label: "Sender pays" },
            ]}
          />
        </Field>
      </CardContent>
    </Card>
  )
}
