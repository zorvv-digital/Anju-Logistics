import { Badge } from "@/components/ui/badge"
import type { LrMoney } from "@/lib/calc"
import { paymentState } from "@/lib/calc"
import { COMPANY_LABEL, STATUS_LABEL, type Company, type LrStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const companyClass: Record<Company, string> = {
  logistics: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  roadways: "bg-navy/10 text-navy dark:bg-navy/40 dark:text-blue-200",
}

export function CompanyBadge({ company, short }: { company: Company; short?: boolean }) {
  return (
    <Badge variant="secondary" className={companyClass[company]}>
      {short ? COMPANY_LABEL[company].replace("Anju ", "") : COMPANY_LABEL[company]}
    </Badge>
  )
}

/** "LR 1042" in the company's colour (red Logistics, navy Roadways). */
export function LrBadge({ company, lrNo }: { company: Company; lrNo: number | string }) {
  return (
    <Badge variant="secondary" className={cn("tabular-nums", companyClass[company])}>
      LR {lrNo}
    </Badge>
  )
}

const statusClass: Record<LrStatus, string> = {
  booked: "",
  in_transit: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
}

export function StatusBadge({ status }: { status: LrStatus }) {
  return (
    <Badge variant={status === "booked" ? "outline" : "secondary"} className={cn(statusClass[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

const payLabel = { none: "No bill", paid: "Paid", partial: "Part paid", unpaid: "Unpaid" }

export function PaymentBadge({ money }: { money: LrMoney }) {
  const s = paymentState(money)
  return (
    <Badge
      variant={s === "unpaid" ? "destructive" : s === "paid" ? "secondary" : "outline"}
      className={cn(s === "paid" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200")}
    >
      {payLabel[s]}
    </Badge>
  )
}
