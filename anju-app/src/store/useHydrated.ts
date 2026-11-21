import { useEffect, useState } from "react"
import { useStore } from "./useStore"

/** True once saved data has loaded from browser storage. */
export function useHydrated() {
  const [done, setDone] = useState(() => useStore.persist.hasHydrated())
  useEffect(() => {
    if (done) return
    return useStore.persist.onFinishHydration(() => setDone(true))
  }, [done])
  return done
}
