import type { Company, Lr, Payment } from "./types"

const sum = (ps: Payment[]) => ps.reduce((t, p) => t + p.amount, 0)

export interface LrMoney {
  bill: number
  received: number
  toCollect: number
  freight: number
  ownerPaid: number
  toPayOwner: number
  profit: number
}

/**
 * Money for one LR.
 * "To pay": the receiver pays the driver directly, so nothing is collected or paid by Anju.
 */
export function lrMoney(lr: Lr): LrMoney {
  const topay = lr.payMode === "topay"
  const received = topay ? lr.billAmount : sum(lr.receipts)
  const ownerPaid = topay ? lr.freight : sum(lr.ownerPayments)
  return {
    bill: lr.billAmount,
    received,
    toCollect: Math.max(0, lr.billAmount - received - lr.discount),
    freight: lr.freight,
    ownerPaid,
    toPayOwner: Math.max(0, lr.freight - ownerPaid),
    profit: lr.billAmount - lr.discount - lr.freight,
  }
}

export interface Totals extends LrMoney {
  count: number
  onRoad: number
}

export function totals(lrs: Lr[]): Totals {
  const t: Totals = { bill: 0, received: 0, toCollect: 0, freight: 0, ownerPaid: 0, toPayOwner: 0, profit: 0, count: 0, onRoad: 0 }
  for (const lr of lrs) {
    const m = lrMoney(lr)
    for (const k of Object.keys(m) as (keyof LrMoney)[]) t[k] += m[k]
    t.count++
    if (lr.status === "in_transit") t.onRoad++
  }
  return t
}

export function byCompany(lrs: Lr[], company: Company | "all") {
  return company === "all" ? lrs : lrs.filter((l) => l.company === company)
}

export function nextLrNo(lrs: Lr[], company: Company) {
  const nums = lrs.filter((l) => l.company === company).map((l) => l.lrNo)
  return nums.length ? Math.max(...nums) + 1 : company === "logistics" ? 1 : 3001
}

/** Balance per truck owner across BOTH companies (client wants one amount per owner). */
export function ownerDues(lrs: Lr[], ownerOf: (truckId: string | null) => string | null) {
  const map = new Map<string, { lrs: Lr[]; due: number }>()
  for (const lr of lrs) {
    const ownerId = ownerOf(lr.truckId)
    const due = lrMoney(lr).toPayOwner
    if (!ownerId || due <= 0) continue
    const row = map.get(ownerId) ?? { lrs: [], due: 0 }
    row.lrs.push(lr)
    row.due += due
    map.set(ownerId, row)
  }
  return map
}

export const paymentState = (m: LrMoney) => (m.bill === 0 ? "none" : m.toCollect === 0 ? "paid" : m.received > 0 ? "partial" : "unpaid")
