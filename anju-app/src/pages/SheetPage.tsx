import { Download, FileSpreadsheet } from "lucide-react"
import { useMemo } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { COLUMNS, downloadExcel, toRow } from "@/lib/excel"
import { today } from "@/lib/format"
import { useCompanyLrs, useLookups } from "@/store/selectors"
import { useStore } from "@/store/useStore"

const MONEY_COLS = new Set(["Billing Amount", "Receipts", "Discount /TDS", "Billing Balance", "Freight", "Paid", "Balance"])

export function SheetPage() {
  const lrs = useCompanyLrs()
  const look = useLookups()
  const company = useStore((s) => s.company)

  const rows = useMemo(() => [...lrs].sort((a, b) => a.date.localeCompare(b.date)).map((l) => toRow(l, look)), [lrs, look])

  return (
    <>
      <PageHeader
        title="Sheet view"
        description="Same columns as your Excel. Download to share."
        actions={
          <Button disabled={!lrs.length} onClick={() => downloadExcel(lrs, look, `anju-${company}-${today()}.xlsx`)}>
            <Download /> Download Excel
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="No rows" description="Bookings you add show up here." />
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-xl border">
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-muted">
              <TableRow>
                {COLUMNS.map((c) => (
                  <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((c) => (
                    <TableCell key={c} className={MONEY_COLS.has(c) ? "text-right tabular-nums" : "whitespace-nowrap"}>
                      {MONEY_COLS.has(c) && typeof r[c] === "number" ? (r[c] as number).toLocaleString("en-IN") : r[c] || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
