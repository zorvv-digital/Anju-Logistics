import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/PageHeader"
import { ErrorState } from "@/components/common/states"
import { showTrackingToast } from "@/components/lr/TrackingToast"
import { MoneySection } from "@/components/lr/form/MoneySection"
import { ShipmentSection } from "@/components/lr/form/ShipmentSection"
import { TruckSection } from "@/components/lr/form/TruckSection"
import { Button, buttonVariants } from "@/components/ui/button"
import { nextLrNo } from "@/lib/calc"
import { normalizeGst } from "@/lib/gst"
import { billingPartyId, draftFromLr, draftToLr, emptyDraft, validateLr, type LrDraft, type LrErrors } from "@/lib/lrForm"
import type { Company } from "@/lib/types"
import { useLr } from "@/store/selectors"
import { useStore } from "@/store/useStore"

export function LrFormPage() {
  const { id } = useParams()
  const existing = useLr(id)
  if (id && !existing) {
    return <ErrorState title="LR not found" message="It may have been deleted." action={<Link to="/lr" className={buttonVariants({ variant: "outline" })}>Back to bookings</Link>} />
  }
  // key resets the form when moving between LRs
  return <LrForm key={id ?? "new"} existingId={id ?? null} />
}

const savedGst = (partyId: string | null) =>
  (partyId && useStore.getState().parties.find((p) => p.id === partyId)?.gst) || ""

/**
 * Tell the user the driver got the live-location link.
 * Demo only: nothing is actually sent yet — the real SMS/WhatsApp send goes here (see LocationCard).
 */
function announceTrackingLink(driverId: string, lrNo: string, company: Company) {
  const driver = useStore.getState().drivers.find((d) => d.id === driverId)
  if (!driver) return
  if (!driver.phone) {
    toast.warning(`Add ${driver.name}'s phone number to send the location link`)
    return
  }
  showTrackingToast({ driverName: driver.name, phone: driver.phone, lrNo, company })
}

function LrForm({ existingId }: { existingId: string | null }) {
  const navigate = useNavigate()
  const lrs = useStore((s) => s.lrs)
  const saveLr = useStore((s) => s.saveLr)
  const updateParty = useStore((s) => s.updateParty)
  const company = useStore((s) => s.company)
  const existing = existingId ? lrs.find((l) => l.id === existingId) ?? null : null
  const received = existing?.receipts.reduce((t, p) => t + p.amount, 0) ?? 0
  const ownerPaid = existing?.ownerPayments.reduce((t, p) => t + p.amount, 0) ?? 0

  const [draft, setDraft] = useState<LrDraft>(() => {
    if (existing) return draftFromLr(existing, savedGst)
    const c: Company = company === "roadways" ? "roadways" : "logistics"
    return emptyDraft(c, nextLrNo(lrs, c))
  })
  const [errors, setErrors] = useState<LrErrors>({})

  const set = <K extends keyof LrDraft>(key: K, value: LrDraft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value }
      // New billing party → fill in the GST we have on file for it (empty if none yet)
      const payer = billingPartyId(next)
      if (payer !== billingPartyId(d)) next.billingGst = savedGst(payer)
      return next
    })
    const touchesGst = key === "billingGst" || key === "billTo" || key === "consignorId" || key === "consigneeId"
    setErrors((e) => (e[key] || (touchesGst && e.billingGst) ? { ...e, [key]: undefined, ...(touchesGst && { billingGst: undefined }) } : e))
  }

  const onCompany = (c: Company) => setDraft((d) => ({ ...d, company: c, lrNo: String(nextLrNo(lrs, c)) }))

  const taken = (c: Company, no: number) => lrs.some((l) => l.company === c && l.lrNo === no && l.id !== draft.id)

  const save = (andPrint: boolean) => {
    const errs = validateLr(draft, taken, { received, ownerPaid })
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields")
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()
      return
    }
    // Remember a new / corrected GST on the party so it fills in next time
    const payer = billingPartyId(draft)
    const gst = normalizeGst(draft.billingGst)
    if (payer && gst && gst !== savedGst(payer)) updateParty(payer, { gst })
    const savedId = saveLr(draftToLr(draft, existing))
    toast.success(existing ? "LR updated" : `LR ${draft.lrNo} booked`)
    // Printing the LR = truck is being dispatched, so always (re)send then; a plain save only for a new driver
    if (draft.driverId && (andPrint || draft.driverId !== existing?.driverId)) announceTrackingLink(draft.driverId, draft.lrNo, draft.company)
    else if (andPrint && !draft.driverId) toast.info("No driver on this LR yet — add one to send the location link")
    navigate(andPrint ? `/lr/${savedId}/print` : `/lr/${savedId}`)
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        save(false)
      }}
    >
      <PageHeader title={existing ? `Edit LR ${existing.lrNo}` : "New booking"} description="Grey boxes fill in by themselves" />
      <ShipmentSection draft={draft} errors={errors} set={set} onCompany={onCompany} />
      <MoneySection draft={draft} errors={errors} set={set} received={received} />
      <TruckSection draft={draft} errors={errors} set={set} ownerPaid={ownerPaid} />
      <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t bg-background/95 p-4 backdrop-blur md:-mx-6 md:px-6">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" variant="outline">
          Save
        </Button>
        <Button type="button" onClick={() => save(true)}>
          Save and print LR + invoice
        </Button>
      </div>
    </form>
  )
}
