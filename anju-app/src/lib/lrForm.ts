import { today } from "./format"
import type { BillTo, Company, Lr, PayMode } from "./types"

/** Form-side shape: amounts kept as text so inputs can be empty while typing. */
export interface LrDraft {
  id?: string
  company: Company
  lrNo: string
  date: string
  consignorId: string | null
  consigneeId: string | null
  from: string
  to: string
  material: string
  billTo: BillTo
  billAmount: string
  discount: string
  payMode: PayMode
  truckId: string | null
  driverId: string | null
  freight: string
  remarks: string
}

export type LrErrors = Partial<Record<keyof LrDraft, string>>

export const emptyDraft = (company: Company, lrNo: number): LrDraft => ({
  company, lrNo: String(lrNo), date: today(), consignorId: null, consigneeId: null, from: "", to: "",
  material: "", billTo: "consignee", billAmount: "", discount: "", payMode: "tbb", truckId: null,
  driverId: null, freight: "", remarks: "",
})

export const draftFromLr = (lr: Lr): LrDraft => ({
  id: lr.id, company: lr.company, lrNo: String(lr.lrNo), date: lr.date, consignorId: lr.consignorId,
  consigneeId: lr.consigneeId, from: lr.from, to: lr.to, material: lr.material, billTo: lr.billTo,
  billAmount: String(lr.billAmount || ""), discount: String(lr.discount || ""), payMode: lr.payMode,
  truckId: lr.truckId, driverId: lr.driverId, freight: String(lr.freight || ""), remarks: lr.remarks ?? "",
})

const amount = (s: string) => (s.trim() === "" ? 0 : Number(s))

export function validateLr(d: LrDraft, taken: (company: Company, lrNo: number) => boolean): LrErrors {
  const e: LrErrors = {}
  const no = Number(d.lrNo)
  if (!Number.isInteger(no) || no <= 0) e.lrNo = "Enter a valid LR number"
  else if (taken(d.company, no)) e.lrNo = `LR ${no} already exists in this company`
  if (!d.date) e.date = "Pick a date"
  if (!d.consignorId) e.consignorId = "Choose who is sending"
  if (!d.consigneeId) e.consigneeId = "Choose who is receiving"
  else if (d.consigneeId === d.consignorId) e.consigneeId = "Sender and receiver can't be the same"
  if (!d.from) e.from = "Choose starting place"
  if (!d.to) e.to = "Choose destination"
  if (!d.material.trim()) e.material = "Write what is being sent"
  for (const k of ["billAmount", "discount", "freight"] as const) {
    const v = amount(d[k])
    if (Number.isNaN(v) || v < 0) e[k] = "Enter an amount in rupees"
  }
  // Imported LRs billed under another LR ("Incl in LR#") legitimately have 0, so only enforce on new ones
  if (!d.id && !e.billAmount && amount(d.billAmount) === 0) e.billAmount = "Enter the bill amount"
  if (d.freight && !d.truckId) e.truckId = "Choose the truck this freight is for"
  if (amount(d.discount) > amount(d.billAmount)) e.discount = "Discount can't be more than the bill"
  return e
}

/** Convert a valid draft into an LR, keeping payments and history from the existing record. */
export function draftToLr(d: LrDraft, existing: Lr | null): Omit<Lr, "id"> & { id?: string } {
  return {
    id: d.id,
    company: d.company,
    lrNo: Number(d.lrNo),
    date: d.date,
    consignorId: d.consignorId!,
    consigneeId: d.consigneeId!,
    from: d.from,
    to: d.to,
    material: d.material.trim(),
    billTo: d.billTo,
    billAmount: amount(d.billAmount),
    discount: amount(d.discount),
    payMode: d.payMode,
    truckId: d.truckId,
    driverId: d.driverId,
    freight: amount(d.freight),
    remarks: d.remarks.trim() || null,
    receipts: existing?.receipts ?? [],
    ownerPayments: existing?.ownerPayments ?? [],
    includedIn: existing?.includedIn ?? null,
    status: existing?.status ?? "booked",
    loadedOn: existing?.loadedOn ?? null,
    deliveredOn: existing?.deliveredOn ?? null,
    locations: existing?.locations ?? [],
  }
}

export const margin = (d: LrDraft) => amount(d.billAmount) - amount(d.discount) - amount(d.freight)
