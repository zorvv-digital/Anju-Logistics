import type { ReactNode } from "react"
import { useIsOwner } from "@/store/selectors"

/** Renders children only for the owner login (profit, monthly totals). */
export function OwnerOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useIsOwner() ? children : fallback
}
