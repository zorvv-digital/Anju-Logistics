import { Download, FileSpreadsheet, Upload } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { COLUMNS, downloadExcel, parseExcel, toRow } from "@/lib/excel"
import { today } from "@/lib/format"
import { ensureMaster } from "@/store/ensureMaster"
import { useCompanyLrs, useLookups } from "@/store/selectors"
import { useStore } from "@/store/useStore"

const MONEY_COLS = new Set(["Billing Amount", "Receipts", "Discount /TDS", "Billing Balance", "Freight", "Paid", "Balance"])

export function SheetPage() {
  const lrs = useCompanyLrs()
  const look = useLookups()
  const company = useStore((s) => s.company)
  const importLrs = useStore((s) => s.importLrs)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problems, setProblems] = useState<string[]>([])

  const rows = useMemo(() => [...lrs].sort((a, b) => a.date.localeCompare(b.date)).map((l) => toRow(l, look)), [lrs, look])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setProblems([])
    try {
      const { lrs: parsed, errors } = await parseExcel(file, company === "all" ? null : company, ensureMaster)
      setProblems(errors)
      if (parsed.length) toast.success(`${importLrs(parsed)} LRs imported. Same LR numbers were replaced.`)
      else if (!errors.length) toast.error("No rows found in the file")
    } catch (e) {
      setProblems([e instanceof Error ? e.message : "Couldn't read this file. Is it an Excel (.xlsx) file?"])
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <>
      <PageHeader
        title="Sheet view"
        description="Same columns as your Excel. Upload to update, download to share."
        actions={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload /> {busy ? "Reading…" : "Upload Excel"}
            </Button>
            <Button disabled={!lrs.length} onClick={() => downloadExcel(lrs, look, `anju-${company}-${today()}.xlsx`)}>
              <Download /> Download Excel
            </Button>
          </>
        }
      />
      {problems.length > 0 && (
        <ErrorState
          title={`${problems.length} row(s) skipped`}
          message={problems.slice(0, 5).join(" · ") + (problems.length > 5 ? ` · and ${problems.length - 5} more` : "")}
        />
      )}
      {rows.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="No rows" description="Upload your Excel sheet to get started." />
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
