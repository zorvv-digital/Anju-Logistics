import { ArrowLeft, Printer } from "lucide-react"
import { Link, Navigate, useParams } from "react-router-dom"
import { ErrorState, LoadingState } from "@/components/common/states"
import { InvoiceSheet } from "@/components/print/InvoiceSheet"
import { LrCopySheet } from "@/components/print/LrCopySheet"
import { Button, buttonVariants } from "@/components/ui/button"
import { useLookups, useLr } from "@/store/selectors"
import { useHydrated } from "@/store/useHydrated"
import { useStore } from "@/store/useStore"

/** Page 1 invoice + page 2 LR, same as the PDF they send today. Browser "Save as PDF" makes the file. */
export function InvoicePage() {
  const { id } = useParams()
  const hydrated = useHydrated()
  const role = useStore((s) => s.role)
  const lr = useLr(id)
  const look = useLookups()

  if (!hydrated) return <LoadingState />
  if (!role) return <Navigate to="/login" replace />
  if (!lr) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState title="LR not found" message="Can't make an invoice for an LR that doesn't exist." action={<Link to="/lr" className={buttonVariants({ variant: "outline" })}>Back to bookings</Link>} />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-muted print:bg-white">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background p-3 print:hidden">
        <Link to={`/lr/${lr.id}`} className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft /> Back
        </Link>
        <p className="text-sm text-muted-foreground">Choose "Save as PDF" in the print window to get the file.</p>
        <Button className="ml-auto" onClick={() => window.print()}>
          <Printer /> Print / Save PDF
        </Button>
      </div>
      <div className="mx-auto max-w-[210mm] space-y-6 py-6 text-black print:space-y-0 print:py-0">
        <InvoiceSheet lr={lr} look={look} />
        <LrCopySheet lr={lr} look={look} />
      </div>
    </div>
  )
}
