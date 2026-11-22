import { create } from "zustand"
import { persist } from "zustand/middleware"
import seed from "@/data/seed.json"
import { allocateOwnerPayment, nextLrNo } from "@/lib/calc"
import { dummyGst, dummyPan } from "@/lib/dummyIds"
import { today, uid } from "@/lib/format"
import type { Company, Db, LocationPing, Lr, LrStatus, MasterKind, Party, Payment, Role } from "@/lib/types"

export type PaymentSide = "receipts" | "ownerPayments"
type MasterItem<K extends MasterKind> = Db[K][number]

interface State extends Db {
  role: Role | null
  userName: string | null
  company: Company | "all"
  /** Ids picked most recently in each dropdown, newest first — shown at the top of the list */
  recent: Partial<Record<MasterKind, string[]>>
  markRecent: (kind: MasterKind, id: string) => void
  login: (role: Role, name: string) => void
  logout: () => void
  setCompany: (c: Company | "all") => void
  addMaster: <K extends MasterKind>(kind: K, item: Omit<MasterItem<K>, "id">) => string
  saveLr: (lr: Omit<Lr, "id"> & { id?: string }) => string
  updateParty: (id: string, patch: Partial<Omit<Party, "id">>) => void
  addPayment: (lrId: string, side: PaymentSide, p: Omit<Payment, "id">) => void
  removePayment: (lrId: string, side: PaymentSide, paymentId: string) => void
  setStatus: (lrId: string, status: LrStatus) => void
  addLocation: (lrId: string, place: string) => void
  /** Pay an owner across several trips, oldest first. Leave out amount to clear them all. */
  settleOwner: (lrIds: string[], date: string, note: string, amount?: number) => void
  importLrs: (lrs: Omit<Lr, "id">[]) => number
  resetDemo: () => void
}

const seedDb = seed as unknown as Db

const patchLr = (lrs: Lr[], id: string, fn: (lr: Lr) => Lr) => lrs.map((l) => (l.id === id ? fn(l) : l))

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seedDb,
      role: null,
      userName: null,
      company: "all",
      recent: {},
      login: (role, userName) => set({ role, userName }),
      logout: () => set({ role: null, userName: null }),
      setCompany: (company) => set({ company }),
      markRecent: (kind, id) => {
        const list = [id, ...(get().recent[kind] ?? []).filter((x) => x !== id)].slice(0, 20)
        set({ recent: { ...get().recent, [kind]: list } })
      },

      addMaster: (kind, item) => {
        const id = uid(kind[0])
        set({ [kind]: [...get()[kind], { ...item, id }] } as Partial<State>)
        return id
      },

      updateParty: (id, patch) => set({ parties: get().parties.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),

      saveLr: (lr) => {
        if (lr.id) {
          const id = lr.id
          set({ lrs: patchLr(get().lrs, id, () => ({ ...lr, id })) })
          return id
        }
        const id = uid("lr")
        set({ lrs: [{ ...lr, id }, ...get().lrs] })
        return id
      },

      addPayment: (lrId, side, p) =>
        set({ lrs: patchLr(get().lrs, lrId, (l) => ({ ...l, [side]: [...l[side], { ...p, id: uid("pay") }] })) }),

      removePayment: (lrId, side, paymentId) =>
        set({ lrs: patchLr(get().lrs, lrId, (l) => ({ ...l, [side]: l[side].filter((p) => p.id !== paymentId) })) }),

      setStatus: (lrId, status) =>
        set({
          lrs: patchLr(get().lrs, lrId, (l) => ({
            ...l,
            status,
            loadedOn: status !== "booked" ? (l.loadedOn ?? today()) : l.loadedOn,
            deliveredOn: status === "delivered" ? today() : null,
          })),
        }),

      addLocation: (lrId, place) => {
        const ping: LocationPing = { id: uid("loc"), at: new Date().toISOString(), place }
        set({ lrs: patchLr(get().lrs, lrId, (l) => ({ ...l, locations: [ping, ...l.locations] })) })
      },

      settleOwner: (lrIds, date, note, amount = Infinity) => {
        const lrs = get().lrs
        const split = new Map(
          allocateOwnerPayment(lrs.filter((l) => lrIds.includes(l.id)), amount).map((a) => [a.lr.id, a.amount]),
        )
        set({
          lrs: lrs.map((l) => {
            const pay = split.get(l.id)
            if (!pay) return l
            return { ...l, ownerPayments: [...l.ownerPayments, { id: uid("pay"), date, amount: pay, note }] }
          }),
        })
      },

      importLrs: (rows) => {
        const existing = get().lrs
        const added = rows.map((r) => ({
          ...r,
          id: uid("lr"),
          lrNo: r.lrNo || nextLrNo(existing, r.company),
        }))
        const keep = existing.filter((e) => !added.some((a) => a.company === e.company && a.lrNo === e.lrNo))
        set({ lrs: [...added, ...keep] })
        return added.length
      },

      resetDemo: () => set({ ...seedDb, recent: {} }),
    }),
    {
      name: "anju-demo",
      version: 2,
      // v2: every party gets a GST and every owner a PAN (dummy where none was given)
      migrate: (persisted, version) => {
        const s = persisted as State
        if (version < 2) {
          const seedGst = new Map(seedDb.parties.map((p) => [p.id, p.gst]))
          const seedPan = new Map(seedDb.owners.map((o) => [o.id, o.pan]))
          let g = 100, n = 100 // start past the seed's dummies so added ones don't collide
          s.parties = s.parties?.map((p) => (p.gst ? p : { ...p, gst: seedGst.get(p.id) ?? dummyGst(g++) }))
          s.owners = s.owners?.map((o) => (o.pan ? o : { ...o, pan: seedPan.get(o.id) ?? dummyPan(n++) }))
        }
        return s
      },
    },
  ),
)

export const useMaster = <K extends MasterKind>(kind: K) => useStore((s) => s[kind])
