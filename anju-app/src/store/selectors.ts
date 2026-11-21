import { useMemo } from "react"
import { byCompany, lrMoney, ownerDues, totals } from "@/lib/calc"
import type { Lr } from "@/lib/types"
import { useStore } from "./useStore"

/** Lookups by id, rebuilt only when the master lists change. */
export function useLookups() {
  const parties = useStore((s) => s.parties)
  const trucks = useStore((s) => s.trucks)
  const owners = useStore((s) => s.owners)
  const drivers = useStore((s) => s.drivers)
  return useMemo(() => {
    const index = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]))
    const p = index(parties), t = index(trucks), o = index(owners), d = index(drivers)
    return {
      party: (id: string | null) => (id ? p.get(id) ?? null : null),
      truck: (id: string | null) => (id ? t.get(id) ?? null : null),
      owner: (id: string | null) => (id ? o.get(id) ?? null : null),
      driver: (id: string | null) => (id ? d.get(id) ?? null : null),
      ownerOfTruck: (truckId: string | null) => (truckId ? t.get(truckId)?.ownerId ?? null : null),
    }
  }, [parties, trucks, owners, drivers])
}

export type Lookups = ReturnType<typeof useLookups>

/** LRs filtered by the company switch in the header. */
export function useCompanyLrs() {
  const lrs = useStore((s) => s.lrs)
  const company = useStore((s) => s.company)
  return useMemo(() => byCompany(lrs, company), [lrs, company])
}

export function useTotals(lrs: Lr[]) {
  return useMemo(() => totals(lrs), [lrs])
}

export function useOwnerDues() {
  const lrs = useStore((s) => s.lrs)
  const look = useLookups()
  return useMemo(() => {
    const dues = ownerDues(lrs, look.ownerOfTruck)
    return [...dues.entries()]
      .map(([ownerId, v]) => ({ owner: look.owner(ownerId), ...v }))
      .sort((a, b) => b.due - a.due)
  }, [lrs, look])
}

/** LRs that need attention: money to collect, oldest first. */
export function useNeedsAction(lrs: Lr[], limit = 6) {
  return useMemo(
    () =>
      lrs
        .map((lr) => ({ lr, m: lrMoney(lr) }))
        .filter(({ m }) => m.toCollect > 0)
        .sort((a, b) => a.lr.date.localeCompare(b.lr.date))
        .slice(0, limit),
    [lrs, limit],
  )
}

export function useLr(id: string | undefined) {
  return useStore((s) => (id ? s.lrs.find((l) => l.id === id) ?? null : null))
}

export const useIsOwner = () => useStore((s) => s.role === "owner")
