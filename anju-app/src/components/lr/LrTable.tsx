import { useNavigate } from "react-router-dom"
import { CompanyBadge, PaymentBadge, StatusBadge } from "@/components/common/badges"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { lrMoney } from "@/lib/calc"
import { date, money } from "@/lib/format"
import type { Lr } from "@/lib/types"
import { useLookups } from "@/store/selectors"

export function LrTable({ lrs }: { lrs: Lr[] }) {
  const navigate = useNavigate()
  const look = useLookups()

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>LR</TableHead>
            <TableHead>Bill to</TableHead>
            <TableHead className="hidden md:table-cell">Route</TableHead>
            <TableHead className="hidden lg:table-cell">Truck</TableHead>
            <TableHead className="text-right">Bill</TableHead>
            <TableHead className="text-right">To collect</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lrs.map((lr) => {
            const m = lrMoney(lr)
            const payer = look.party(lr.billTo === "consignee" ? lr.consigneeId : lr.consignorId)
            return (
              <TableRow
                key={lr.id}
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => navigate(`/lr/${lr.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/lr/${lr.id}`)}
              >
                <TableCell>
                  <div className="font-medium">{lr.lrNo}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {date(lr.date)} <CompanyBadge company={lr.company} short />
                  </div>
                </TableCell>
                <TableCell className="max-w-48 truncate">{payer?.name ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {lr.from} → {lr.to}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{look.truck(lr.truckId)?.number ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {lr.includedIn ? <span className="text-xs text-muted-foreground">In LR {lr.includedIn}</span> : money(m.bill)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.toCollect > 0 ? <span className="font-medium text-destructive">{money(m.toCollect)}</span> : <PaymentBadge money={m} />}
                </TableCell>
                <TableCell>
                  <StatusBadge status={lr.status} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
