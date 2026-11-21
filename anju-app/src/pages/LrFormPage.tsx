import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/PageHeader"
import { ErrorState } from "@/components/common/states"
import { MoneySection } from "@/components/lr/form/MoneySection"
import { ShipmentSection } from "@/components/lr/form/ShipmentSection"
import { TruckSection } from "@/components/lr/form/TruckSection"
import { Button, buttonVariants } from "@/components/ui/button"
import { nextLrNo } from "@/lib/calc"
import { draftFromLr, draftToLr, emptyDraft, validateLr, type LrDraft, type LrErrors } from "@/lib/lrForm"
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

function LrForm({ existingId }: { existingId: string | null }) {
  const navigate = useNavigate()
  const lrs = useStore((s) => s.lrs)
  const saveLr = useStore((s) => s.saveLr)
  const company = useStore((s) => s.company)
  const existing = existingId ? lrs.find((l) => l.id === existingId) ?? null : null

  const [draft, setDraft] = useState<LrDraft>(() => {
    if (existing) return draftFromLr(existing)
    const c: Company = company === "roadways" ? "roadways" : "logistics"
    return emptyDraft(c, nextLrNo(lrs, c))
  })
  const [errors, setErrors] = useState<LrErrors>({})

  const set = <K extends keyof LrDraft>(key: K, value: LrDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onCompany = (c: Company) => setDraft((d) => ({ ...d, company: c, lrNo: String(nextLrNo(lrs, c)) }))

  const taken = (c: Company, no: number) => lrs.some((l) => l.company === c && l.lrNo === no && l.id !== draft.id)

  const save = (andPrint: boolean) => {
    const errs = validateLr(draft, taken)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields")
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()
      return
    }
    const savedId = saveLr(draftToLr(draft, existing))
    toast.success(existing ? "LR updated" : `LR ${draft.lrNo} booked`)
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
      <PageHeader title={existing ? `Edit LR ${existing.lrNo}` : "New booking"} description="Blue boxes fill in by themselves" />
      <ShipmentSection draft={draft} errors={errors} set={set} onCompany={onCompany} />
      <TruckSection draft={draft} errors={errors} set={set} />
      <MoneySection draft={draft} errors={errors} set={set} />
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
