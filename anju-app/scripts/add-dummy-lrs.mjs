// Adds made-up demo bookings (1 Oct → 22 Nov 2026) to src/data/seed.json, reusing the real
// parties, trucks and places from the Excel import. Deterministic: same output every run.
// Re-running replaces earlier dummy rows (ids starting "lrd" / "dd") instead of duplicating them.
// Run: node scripts/add-dummy-lrs.mjs
import { readFileSync, writeFileSync } from "node:fs"

const FILE = new URL("../src/data/seed.json", import.meta.url)
const START = "2026-10-01"
const END = "2026-11-22"

const db = JSON.parse(readFileSync(FILE, "utf8"))
db.lrs = db.lrs.filter((l) => !l.id.startsWith("lrd"))
db.drivers = db.drivers.filter((d) => !d.id.startsWith("dd"))

// mulberry32: tiny seeded PRNG so the demo data doesn't change between runs
let seed = 20261122
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (xs) => xs[Math.floor(rnd() * xs.length)]
const between = (a, b) => a + rnd() * (b - a)
const round500 = (n) => Math.max(500, Math.round(n / 500) * 500)
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)
const clampToday = (iso) => (iso > END ? END : iso)

// Who sends / receives in the real data, so made-up bookings look like real ones
const real = db.lrs
const consignors = [...new Set(real.map((l) => l.consignorId))]
const consignees = [...new Set(real.map((l) => l.consigneeId))]
const routes = real.filter((l) => l.from && l.to).map((l) => [l.from, l.to, l.material])
const trucks = db.trucks.filter((t) => t.ownerId)

const DRIVER_NAMES = ["Shaji", "Biju", "Rajeev", "Anwar", "Suresh", "Faisal", "Manoj", "Jithin"]
const newDrivers = DRIVER_NAMES.map((name, i) => ({ id: `dd${i + 1}`, name, phone: `9${String(846000000 + i * 1371).padStart(9, "0")}` }))
db.drivers.push(...newDrivers)
const drivers = db.drivers.filter((d) => d.phone)

const WAYPOINTS = ["Near Vapi", "Near Mumbai", "Near Kolhapur", "Near Belgaum", "Near Goa", "Near Mangalore", "Near Kasaragod"]

let lrNo = {
  logistics: Math.max(...real.filter((l) => l.company === "logistics").map((l) => l.lrNo)) + 1,
  roadways: Math.max(...real.filter((l) => l.company === "roadways").map((l) => l.lrNo)) + 1,
}

const added = []
let n = 0
for (let day = START; day <= END; day = addDays(day, 1)) {
  const count = new Date(day).getUTCDay() === 0 ? 0 : pick([0, 1, 1, 1, 2, 2])
  for (let k = 0; k < count; k++) {
    n++
    const company = rnd() < 0.65 ? "logistics" : "roadways"
    const [from, to, material] = pick(routes)
    const truck = pick(trucks)
    const age = daysBetween(day, END)
    const bill = round500(between(9000, 140000))
    const freight = round500(bill * between(0.82, 0.94))
    const topay = bill < 25000 && rnd() < 0.3

    // Owner: advance at loading, small balance cleared about a week later on older trips
    const keep = pick([500, 1000, 2000, 2000, 3000])
    const ownerPayments = topay ? [] : [{ id: `payd${n}o1`, date: day, amount: freight - keep, note: "Advance" }]
    if (!topay && age > 12 && rnd() < 0.75) {
      ownerPayments.push({ id: `payd${n}o2`, date: clampToday(addDays(day, Math.round(between(6, 12)))), amount: keep, note: "Balance" })
    }

    // Party: older bills mostly paid, recent ones mostly open, some part payments
    const discount = !topay && rnd() < 0.2 ? Math.round(bill * 0.01) : 0
    const due = bill - discount
    const chance = age > 30 ? [0.85, 0.1] : age > 10 ? [0.45, 0.3] : [0, 0.15] // [full, part]
    const r = rnd()
    const receipts = topay ? [] : r < chance[0]
      ? [{ id: `payd${n}r1`, date: clampToday(addDays(day, Math.round(between(7, 25)))), amount: due, note: "Receipt" }]
      : r < chance[0] + chance[1]
        ? [{ id: `payd${n}r1`, date: clampToday(addDays(day, Math.round(between(2, 10)))), amount: round500(due * between(0.3, 0.7)), note: "Part payment" }]
        : []

    const status = age === 0 ? "booked" : age <= 5 ? "in_transit" : "delivered"
    const pings = status === "in_transit"
      ? WAYPOINTS.slice(0, Math.min(WAYPOINTS.length, age + 1)).reverse().map((place, i) => ({
          id: `locd${n}${i}`, at: `${addDays(day, age - Math.floor(i / 3))}T${String(18 - (i % 3) * 4).padStart(2, "0")}:00:00.000Z`, place,
        }))
      : []

    let consignorId = pick(consignors), consigneeId = pick(consignees)
    if (consignorId === consigneeId) consigneeId = consignees.find((c) => c !== consignorId)

    added.push({
      id: `lrd${n}`, company, lrNo: lrNo[company]++, date: day, consignorId, consigneeId, from, to,
      material: material || "General Goods", billTo: "consignee", billAmount: bill, discount,
      payMode: topay ? "topay" : "tbb", receipts, truckId: truck.id, driverId: pick(drivers).id, freight,
      ownerPayments, includedIn: null, status, loadedOn: status === "booked" ? null : day,
      deliveredOn: status === "delivered" ? clampToday(addDays(day, Math.round(between(4, 6)))) : null,
      remarks: null, locations: pings,
    })
  }
}

// The real September rows still "on the road" would have arrived by now
for (const l of db.lrs) if (l.status === "in_transit") Object.assign(l, { status: "delivered", deliveredOn: addDays(l.date, 5) })

db.lrs.push(...added)
writeFileSync(FILE, JSON.stringify(db, null, 1) + "\n")
console.log(`Added ${added.length} dummy LRs and ${newDrivers.length} drivers. Total LRs: ${db.lrs.length}`)
