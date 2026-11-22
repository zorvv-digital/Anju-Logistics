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

/**
 * Balance per truck owner across BOTH companies (client wants one amount per owner).
 * Freight and paid cover the same open trips, so freight − paid = due.
 */
export function ownerDues(lrs: Lr[], ownerOf: (truckId: string | null) => string | null) {
  const map = new Map<string, { lrs: Lr[]; freight: number; paid: number; due: number }>()
  for (const lr of lrs) {
    const ownerId = ownerOf(lr.truckId)
    const m = lrMoney(lr)
    if (!ownerId || m.toPayOwner <= 0) continue
    const row = map.get(ownerId) ?? { lrs: [], freight: 0, paid: 0, due: 0 }
    row.lrs.push(lr)
    row.freight += m.freight
    row.paid += m.ownerPaid
    row.due += m.toPayOwner
    map.set(ownerId, row)
  }
  return map
}

/**
 * Split one owner payment across trips, oldest first. Each trip is cleared before the next
 * gets anything, so a part payment leaves the newest trips open.
 */
export function allocateOwnerPayment(lrs: Lr[], amount: number) {
  const out: { lr: Lr; amount: number; due: number }[] = []
  let left = amount
  const oldestFirst = [...lrs].sort((a, b) => a.date.localeCompare(b.date) || a.lrNo - b.lrNo)
  for (const lr of oldestFirst) {
    if (left <= 0) break
    const due = lrMoney(lr).toPayOwner
    if (due <= 0) continue
    const pay = Math.min(due, left)
    out.push({ lr, amount: pay, due })
    left = Math.round((left - pay) * 100) / 100
  }
  return out
}

export const paymentState = (m: LrMoney) => (m.bill === 0 ? "none" : m.toCollect === 0 ? "paid" : m.received > 0 ? "partial" : "unpaid")
