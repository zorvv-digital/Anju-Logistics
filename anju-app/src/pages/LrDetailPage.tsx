import { Pencil, Printer, Share2 } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { CompanyBadge } from "@/components/common/badges"
import { PageHeader } from "@/components/common/PageHeader"
import { ErrorState } from "@/components/common/states"
import { OwnerOnly } from "@/components/layout/OwnerOnly"
import { LocationCard } from "@/components/lr/LocationCard"
import { PaymentCard } from "@/components/lr/PaymentCard"
import { StatusCard } from "@/components/lr/StatusCard"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { lrMoney } from "@/lib/calc"
import { date, money, text } from "@/lib/format"
import { PAYMODE_LABEL } from "@/lib/types"
import { useLookups, useLr } from "@/store/selectors"

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export function LrDetailPage() {
  const { id } = useParams()
  const lr = useLr(id)
  const look = useLookups()

  if (!lr) {
    return <ErrorState title="LR not found" message="It may have been deleted or the link is wrong." action={<Link to="/lr" className={buttonVariants({ variant: "outline" })}>Back to bookings</Link>} />
  }

  const m = lrMoney(lr)
  const truck = look.truck(lr.truckId)
  const owner = look.owner(truck?.ownerId ?? null)
  const driver = look.driver(lr.driverId)
  const topay = lr.payMode === "topay" ? "Consignee pays the driver directly on delivery." : null

  const share = async () => {
    const msg = `Anju Logistics · LR ${lr.lrNo}\n${lr.from} → ${lr.to}\nTruck ${truck?.number ?? "-"}\nAmount ${money(m.bill)}`
    try {
      if (navigator.share) await navigator.share({ text: msg })
      else {
        await navigator.clipboard.writeText(msg)
        toast.success("Details copied. Paste in WhatsApp.")
      }
    } catch {
      /* user closed the share sheet */
    }
  }

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2">LR {lr.lrNo} <CompanyBadge company={lr.company} /></span>}
        description={`${look.party(lr.consignorId)?.name} → ${look.party(lr.consigneeId)?.name}`}
        actions={
          <>
            <Button variant="outline" onClick={share}><Share2 /> Share</Button>
            <Link to={`/lr/${lr.id}/edit`} className={buttonVariants({ variant: "outline" })}><Pencil /> Edit</Link>
            <Link to={`/lr/${lr.id}/print`} className={buttonVariants()}><Printer /> Invoice PDF</Link>
          </>
        }
      />
      <StatusCard lr={lr} />
      <div className="grid gap-4 md:grid-cols-2">
        <PaymentCard lr={lr} side="receipts" title="Received from party" total={m.bill - lr.discount} balance={m.toCollect} blockedReason={topay} />
        <PaymentCard lr={lr} side="ownerPayments" title={`Paid to ${owner?.name ?? "truck owner"}`} total={m.freight} balance={m.toPayOwner} blockedReason={topay} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="divide-y">
            <Row label="Date" value={date(lr.date)} />
            <Row label="Invoice No" value={lr.lrNo} />
            <Row label="Route" value={`${lr.from} → ${lr.to}`} />
            <Row label="Material" value={text(lr.material)} />
            <Row label="Truck" value={truck?.number ?? "Not assigned"} />
            <Row label="Owner · PAN" value={owner ? `${owner.name} · ${text(owner.pan)}` : "—"} />
            <Row label="Driver" value={driver ? `${driver.name} · ${text(driver.phone)}` : "—"} />
            <Row label="Payment type" value={PAYMODE_LABEL[lr.payMode]} />
            {lr.includedIn && <Row label="Billed with" value={`LR ${lr.includedIn}`} />}
            {lr.discount > 0 && <Row label="Discount / TDS" value={money(lr.discount)} />}
            <OwnerOnly><Row label="Profit" value={<span className="text-emerald-600">{money(m.profit)}</span>} /></OwnerOnly>
            {lr.remarks && <Row label="Notes" value={lr.remarks} />}
          </CardContent>
        </Card>
        <LocationCard lr={lr} />
      </div>
    </>
  )
}
