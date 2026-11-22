import * as XLSX from "xlsx"
import type { Lookups } from "@/store/selectors"
import { lrMoney } from "./calc"
import { localIso } from "./format"
import { COMPANY_LABEL, STATUS_LABEL, type Company, type Lr, type MasterKind } from "./types"

/** Same column names as the client's current Excel, so files go both ways. */
export const COLUMNS = [
  "Company", "Date", "LR NO", "Consignor Name", "Consignee Name", "Place From", "Place To", "Material Description",
  "INV NO", "Billing Party", "GST No Billing Party", "Billing Amount", "Receipts", "Discount /TDS", "Billing Balance",
  "Vehicle No", "Freight", "Paid", "Balance", "Owner/Brocker Name", "Owner/Brocker Number", "Driver Name", "Driver No",
  "Owner/Brocker PAN", "Status",
] as const

export type SheetRow = Record<(typeof COLUMNS)[number], string | number>

export function toRow(lr: Lr, look: Lookups): SheetRow {
  const m = lrMoney(lr)
  const payer = look.party(lr.billTo === "consignee" ? lr.consigneeId : lr.consignorId)
  const truck = look.truck(lr.truckId)
  const owner = look.owner(truck?.ownerId ?? null)
  const driver = look.driver(lr.driverId)
  return {
    Company: COMPANY_LABEL[lr.company], Date: lr.date, "LR NO": lr.lrNo,
    "Consignor Name": look.party(lr.consignorId)?.name ?? "", "Consignee Name": look.party(lr.consigneeId)?.name ?? "",
    "Place From": lr.from, "Place To": lr.to, "Material Description": lr.material, "INV NO": lr.lrNo,
    "Billing Party": payer?.name ?? "", "GST No Billing Party": payer?.gst ?? "", "Billing Amount": m.bill,
    Receipts: m.received, "Discount /TDS": lr.discount, "Billing Balance": m.toCollect, "Vehicle No": truck?.number ?? "",
    Freight: m.freight, Paid: lr.payMode === "topay" ? "TOPAY" : m.ownerPaid, Balance: m.toPayOwner,
    "Owner/Brocker Name": owner?.name ?? "", "Owner/Brocker Number": owner?.phone ?? "", "Driver Name": driver?.name ?? "",
    "Driver No": driver?.phone ?? "", "Owner/Brocker PAN": owner?.pan ?? "", Status: STATUS_LABEL[lr.status],
  }
}

export function downloadExcel(lrs: Lr[], look: Lookups, fileName: string) {
  const ws = XLSX.utils.json_to_sheet(lrs.map((l) => toRow(l, look)), { header: [...COLUMNS] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "LRs")
  XLSX.writeFile(wb, fileName)
}

type Ensure = (kind: MasterKind, label: string, extra?: Record<string, string | null>) => string

const num = (v: unknown) => (typeof v === "number" ? v : Number(String(v ?? "").replace(/[,₹\s]/g, "")) || 0)
const str = (v: unknown) => String(v ?? "").trim()

function isoDate(v: unknown): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str(v))) return str(v)
  const d = v instanceof Date ? v : new Date(str(v))
  return Number.isNaN(d.getTime()) ? null : localIso(d)
}

/** Read an uploaded sheet. Returns LRs ready to save plus a list of row problems. */
export async function parseExcel(file: File, fallback: Company | null, ensure: Ensure) {
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) throw new Error("The file has no sheets")
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  const rows = raw.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v])))
  if (rows.length && !("LR NO" in rows[0] || "LR Number" in rows[0])) throw new Error('Column "LR NO" not found. Use the same headings as the downloaded sheet.')

  const lrs: Omit<Lr, "id">[] = []
  const errors: string[] = []
  rows.forEach((r, i) => {
    const line = i + 2
    const lrNo = num(r["LR NO"] ?? r["LR Number"])
    const date = isoDate(r.Date)
    const companyText = str(r.Company).toLowerCase()
    const company: Company | null = companyText.includes("road") ? "roadways" : companyText.includes("logis") ? "logistics" : fallback
    const consignor = str(r["Consignor Name"]), consignee = str(r["Consignee Name"])
    if (!lrNo && !consignor) return // blank line
    if (!company) return errors.push(`Row ${line}: company missing. Pick Logistics or Roadways at the top.`)
    if (!date) return errors.push(`Row ${line}: date is not valid`)
    if (!consignor || !consignee) return errors.push(`Row ${line}: consignor or consignee name missing`)
    const billingParty = str(r["Billing Party"])
    const gst = str(r["GST No Billing Party"] ?? r["Billing Party GST No"]) || null
    const consigneeId = ensure("parties", consignee, billingParty === consignee ? { gst } : {})
    const consignorId = ensure("parties", consignor, billingParty === consignor ? { gst } : {})
    const vehicle = str(r["Vehicle No"]).toUpperCase()
    const ownerName = str(r["Owner/Brocker Name"])
    const ownerId = ownerName ? ensure("owners", ownerName, { pan: str(r["Owner/Brocker PAN"]) || null, phone: str(r["Owner/Brocker Number"]) || null }) : null
    const driverName = str(r["Driver Name"])
    const from = str(r["Place From"]), to = str(r["Place To"])
    if (from) ensure("places", from)
    if (to) ensure("places", to)
    const topay = str(r.Paid).toUpperCase() === "TOPAY"
    const received = num(r.Receipts), paid = topay ? 0 : num(r.Paid)
    lrs.push({
      company, lrNo, date, consignorId, consigneeId, from, to, material: str(r["Material Description"] ?? r[" Material Description "]),
      billTo: billingParty === consignor ? "consignor" : "consignee", billAmount: num(r["Billing Amount"]), discount: num(r["Discount /TDS"]),
      payMode: topay ? "topay" : "tbb",
      receipts: received ? [{ id: `imp${line}r`, date, amount: received, note: "Imported" }] : [],
      truckId: vehicle ? ensure("trucks", vehicle, { ownerId }) : null,
      driverId: driverName ? ensure("drivers", driverName, { phone: str(r["Driver No"]) || null }) : null,
      freight: num(r.Freight), ownerPayments: paid ? [{ id: `imp${line}o`, date, amount: paid, note: "Imported" }] : [],
      includedIn: null, status: /deliver/i.test(str(r.Status)) ? "delivered" : "in_transit", loadedOn: date,
      deliveredOn: null, remarks: str(r.Status) || null, locations: [],
    })
  })
  return { lrs, errors }
}
