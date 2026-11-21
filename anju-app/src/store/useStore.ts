import { create } from "zustand"
import { persist } from "zustand/middleware"
import seed from "@/data/seed.json"
import { lrMoney, nextLrNo } from "@/lib/calc"
import { today, uid } from "@/lib/format"
import type { Company, Db, LocationPing, Lr, LrStatus, MasterKind, Payment, Role } from "@/lib/types"

export type PaymentSide = "receipts" | "ownerPayments"
type MasterItem<K extends MasterKind> = Db[K][number]

interface State extends Db {
  role: Role | null
  userName: string | null
  company: Company | "all"
  login: (role: Role, name: string) => void
  logout: () => void
  setCompany: (c: Company | "all") => void
  addMaster: <K extends MasterKind>(kind: K, item: Omit<MasterItem<K>, "id">) => string
  saveLr: (lr: Omit<Lr, "id"> & { id?: string }) => string
  addPayment: (lrId: string, side: PaymentSide, p: Omit<Payment, "id">) => void
  removePayment: (lrId: string, side: PaymentSide, paymentId: string) => void
  setStatus: (lrId: string, status: LrStatus) => void
  addLocation: (lrId: string, place: string) => void
  settleOwner: (lrIds: string[], date: string, note: string) => void
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
      login: (role, userName) => set({ role, userName }),
      logout: () => set({ role: null, userName: null }),
      setCompany: (company) => set({ company }),

      addMaster: (kind, item) => {
        const id = uid(kind[0])
        set({ [kind]: [...get()[kind], { ...item, id }] } as Partial<State>)
        return id
      },

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

      settleOwner: (lrIds, date, note) =>
        set({
          lrs: get().lrs.map((l) => {
            const due = lrMoney(l).toPayOwner
            if (!lrIds.includes(l.id) || due <= 0) return l
            return { ...l, ownerPayments: [...l.ownerPayments, { id: uid("pay"), date, amount: due, note }] }
          }),
        }),

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

      resetDemo: () => set({ ...seedDb }),
    }),
    { name: "anju-demo", version: 1 },
  ),
)

export const useMaster = <K extends MasterKind>(kind: K) => useStore((s) => s[kind])
