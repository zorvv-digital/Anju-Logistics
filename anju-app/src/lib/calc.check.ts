// Run: npx tsx src/lib/calc.check.ts
import assert from "node:assert/strict"
import { allocateOwnerPayment, lrMoney, ownerDues, totals } from "./calc"
import type { Lr } from "./types"

const base: Lr = {
  id: "x", company: "logistics", lrNo: 889, date: "2026-09-17", consignorId: "a", consigneeId: "b",
  from: "Vadodara", to: "Parappanangadi", material: "Fishing net", billTo: "consignee", billAmount: 90000,
  discount: 0, payMode: "tbb", receipts: [], truckId: "t1", driverId: null, freight: 85000,
  ownerPayments: [{ id: "p", date: "", amount: 83000, note: null }], includedIn: null,
  status: "in_transit", loadedOn: null, deliveredOn: null, remarks: null, locations: [],
}

const m = lrMoney(base)
assert.equal(m.toCollect, 90000)
assert.equal(m.toPayOwner, 2000)
assert.equal(m.profit, 5000)

const partial = lrMoney({ ...base, discount: 900, receipts: [{ id: "r", date: "", amount: 50000, note: null }] })
assert.equal(partial.toCollect, 39100)

const topay = lrMoney({ ...base, payMode: "topay", ownerPayments: [] })
assert.equal(topay.toCollect, 0)
assert.equal(topay.toPayOwner, 0)

const t = totals([base, { ...base, id: "y", company: "roadways" }])
assert.equal(t.toPayOwner, 4000)
assert.equal(t.onRoad, 2)

const dues = ownerDues([base, { ...base, id: "y", company: "roadways" }], () => "o1")
assert.equal(dues.get("o1")?.due, 4000)
assert.equal(dues.get("o1")?.freight, 170000)
assert.equal(dues.get("o1")?.paid, 166000)

// Part payment to an owner clears the oldest trip first
const older = { ...base, id: "old", date: "2026-09-01", ownerPayments: [] }
const newer = { ...base, id: "new", date: "2026-09-20", ownerPayments: [] }
const split = allocateOwnerPayment([newer, older], 100000)
assert.deepEqual(split.map((s) => [s.lr.id, s.amount]), [["old", 85000], ["new", 15000]])

console.log("calc checks passed")
