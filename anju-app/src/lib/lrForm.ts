import { money, today, uid } from "./format"
import { GST } from "./gst"
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
  /** GST of the billing party — auto-filled from the party, saved back to it on save */
  billingGst: string
  billAmount: string
  discount: string
  /** Amount received from the party with this save (added as a new receipt) */
  receipt: string
  payMode: PayMode
  truckId: string | null
  driverId: string | null
  freight: string
  /** Amount paid to the truck owner with this save (added as a new owner payment) */
  paid: string
  remarks: string
}

export type LrErrors = Partial<Record<keyof LrDraft, string>>

export const emptyDraft = (company: Company, lrNo: number): LrDraft => ({
  company, lrNo: String(lrNo), date: today(), consignorId: null, consigneeId: null, from: "", to: "",
  material: "", billTo: "consignee", billingGst: "", billAmount: "", discount: "", receipt: "", payMode: "tbb", truckId: null,
  driverId: null, freight: "", paid: "", remarks: "",
})

export const draftFromLr = (lr: Lr, gstOf: (partyId: string | null) => string): LrDraft => ({
  id: lr.id, company: lr.company, lrNo: String(lr.lrNo), date: lr.date, consignorId: lr.consignorId,
  consigneeId: lr.consigneeId, from: lr.from, to: lr.to, material: lr.material, billTo: lr.billTo,
  billingGst: gstOf(billingPartyId(lr)),
  billAmount: String(lr.billAmount || ""), discount: String(lr.discount || ""), receipt: "", payMode: lr.payMode,
  truckId: lr.truckId, driverId: lr.driverId, freight: String(lr.freight || ""), paid: "", remarks: lr.remarks ?? "",
})

/** Which party the bill goes to. */
export const billingPartyId = (d: { billTo: BillTo; consignorId: string | null; consigneeId: string | null }) =>
  d.billTo === "consignee" ? d.consigneeId : d.consignorId

const amount = (s: string) => (s.trim() === "" ? 0 : Number(s))

/** What is still to collect after the receipts already saved (before this form's new receipt). */
export const billBalance = (d: LrDraft, alreadyReceived: number) =>
  Math.max(0, amount(d.billAmount) - amount(d.discount) - alreadyReceived)

/** What is still owed to the truck owner after payments already saved (before this form's new payment). */
export const ownerBalance = (d: LrDraft, alreadyPaid: number) => Math.max(0, amount(d.freight) - alreadyPaid)

/** Money already saved on the LR being edited (0 for a new one). */
export interface AlreadySaved {
  received: number
  ownerPaid: number
}

export function validateLr(
  d: LrDraft,
  taken: (company: Company, lrNo: number) => boolean,
  { received: alreadyReceived, ownerPaid: alreadyPaid }: AlreadySaved = { received: 0, ownerPaid: 0 },
): LrErrors {
  const e: LrErrors = {}
  const no = Number(d.lrNo)
  if (!Number.isInteger(no) || no <= 0) e.lrNo = "Enter a valid LR number"
  else if (taken(d.company, no)) e.lrNo = `LR ${no} already exists in this company`
  if (!d.date) e.date = "Pick a date"
  if (!d.consignorId) e.consignorId = "Choose the consignor"
  if (!d.consigneeId) e.consigneeId = "Choose the consignee"
  else if (d.consigneeId === d.consignorId) e.consigneeId = "Consignor and consignee can't be the same"
  if (d.billingGst && !GST[0].test(d.billingGst)) e.billingGst = GST[1]
  if (!d.from) e.from = "Choose starting place"
  if (!d.to) e.to = "Choose destination"
  if (!d.material.trim()) e.material = "Write what is being sent"
  for (const k of ["billAmount", "discount", "receipt", "freight", "paid"] as const) {
    const v = amount(d[k])
    if (Number.isNaN(v) || v < 0) e[k] = "Enter an amount in rupees"
  }
  // Imported LRs billed under another LR ("Incl in LR#") legitimately have 0, so only enforce on new ones
  if (!d.id && !e.billAmount && amount(d.billAmount) === 0) e.billAmount = "Enter the bill amount"
  if (d.freight && !d.truckId) e.truckId = "Choose the truck this freight is for"
  if (amount(d.discount) > amount(d.billAmount)) e.discount = "Discount can't be more than the bill"
  if (!e.receipt && d.payMode !== "topay" && amount(d.receipt) > billBalance(d, alreadyReceived)) {
    e.receipt = `Only ${money(billBalance(d, alreadyReceived))} is left to collect`
  }
  if (!e.paid && d.payMode !== "topay" && amount(d.paid) > 0) {
    if (!d.truckId) e.paid = "Choose the truck first"
    else if (amount(d.paid) > ownerBalance(d, alreadyPaid)) e.paid = `Only ${money(ownerBalance(d, alreadyPaid))} is due to the owner`
  }
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
    receipts: [
      ...(existing?.receipts ?? []),
      ...(d.payMode !== "topay" && amount(d.receipt) > 0
        ? [{ id: uid("pay"), date: today(), amount: amount(d.receipt), note: existing ? "Receipt" : "Received at booking" }]
        : []),
    ],
    ownerPayments: [
      ...(existing?.ownerPayments ?? []),
      ...(d.payMode !== "topay" && d.truckId && amount(d.paid) > 0
        ? [{ id: uid("pay"), date: today(), amount: amount(d.paid), note: existing ? "Paid" : "Paid at booking" }]
        : []),
    ],
    includedIn: existing?.includedIn ?? null,
    status: existing?.status ?? "booked",
    loadedOn: existing?.loadedOn ?? null,
    deliveredOn: existing?.deliveredOn ?? null,
    locations: existing?.locations ?? [],
  }
}

export const margin = (d: LrDraft) => amount(d.billAmount) - amount(d.discount) - amount(d.freight)
