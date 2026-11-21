import { Badge } from "@/components/ui/badge"
import type { LrMoney } from "@/lib/calc"
import { paymentState } from "@/lib/calc"
import { COMPANY_LABEL, STATUS_LABEL, type Company, type LrStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const companyClass: Record<Company, string> = {
  logistics: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  roadways: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
}

export function CompanyBadge({ company, short }: { company: Company; short?: boolean }) {
  return (
    <Badge variant="secondary" className={companyClass[company]}>
      {short ? COMPANY_LABEL[company].replace("Anju ", "") : COMPANY_LABEL[company]}
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
    <Badge variant={s === "unpaid" ? "destructive" : s === "paid" ? "secondary" : "outline"}>
      {payLabel[s]}
    </Badge>
  )
}
