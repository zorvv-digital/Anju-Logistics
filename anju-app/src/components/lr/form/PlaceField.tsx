import { ComboField } from "@/components/master/ComboField"
import { useStore } from "@/store/useStore"

/** LRs store place names, the dropdown works with ids — this bridges the two. */
export function PlaceField({ value, onChange, invalid, id }: { value: string; onChange: (name: string) => void; invalid?: boolean; id?: string }) {
  const places = useStore((s) => s.places)
  const current = places.find((p) => p.name.toLowerCase() === value.toLowerCase())
  return (
    <ComboField
      id={id}
      kind="places"
      value={current?.id ?? null}
      invalid={invalid}
      placeholder={value || "Choose place"}
      onChange={(pid) => {
        const latest = useStore.getState().places.find((p) => p.id === pid)
        onChange(latest?.name ?? "")
      }}
    />
  )
}
