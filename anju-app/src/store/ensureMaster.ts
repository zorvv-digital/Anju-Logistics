import { labelOf } from "@/components/master/masterConfig"
import type { MasterKind } from "@/lib/types"
import { useStore } from "./useStore"

const BLANK: Record<MasterKind, (label: string) => Record<string, string | null>> = {
  parties: (name) => ({ name, gst: null, address: null, phone: null }),
  owners: (name) => ({ name, pan: null, phone: null }),
  trucks: (number) => ({ number, ownerId: null }),
  drivers: (name) => ({ name, phone: null }),
  places: (name) => ({ name }),
}

/** Find a party/truck/… by name, or create it. Used by Excel upload. */
export function ensureMaster(kind: MasterKind, label: string, extra: Record<string, string | null> = {}) {
  const s = useStore.getState()
  const found = s[kind].find((i) => labelOf(kind, i).toLowerCase() === label.toLowerCase())
  if (found) return found.id
  return s.addMaster(kind, { ...BLANK[kind](label), ...extra } as never)
}
