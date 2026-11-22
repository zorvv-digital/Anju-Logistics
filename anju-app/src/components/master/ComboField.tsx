import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Lr, MasterKind } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useStore } from "@/store/useStore"
import { labelOf, MASTER } from "./masterConfig"
import { QuickAddDialog } from "./QuickAddDialog"

interface Props {
  kind: MasterKind
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
  invalid?: boolean
  id?: string
}

const RECENT_MAX = 5

/** Ids used on the latest bookings — fills "Recently used" before anything has been picked here. */
function usedOnLatestLrs(kind: MasterKind, lrs: Lr[], placeId: (name: string | null) => string | undefined): string[] {
  const latest = [...lrs].sort((a, b) => b.date.localeCompare(a.date) || b.lrNo - a.lrNo)
  return latest.flatMap((lr) => {
    if (kind === "parties") return [lr.consignorId, lr.consigneeId]
    if (kind === "trucks") return [lr.truckId]
    if (kind === "drivers") return [lr.driverId]
    if (kind === "places") return [placeId(lr.from), placeId(lr.to)]
    return []
  }).filter((x): x is string => !!x)
}

/** Searchable dropdown with "+ Add new" that opens a popup instead of a new screen.
 *  The last few picked show at the top under "Recently used". */
export function ComboField({ kind, value, onChange, placeholder, invalid, id }: Props) {
  const items = useStore((s) => s[kind])
  const picked = useStore((s) => s.recent[kind])
  const lrs = useStore((s) => s.lrs)
  const markRecent = useStore((s) => s.markRecent)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState(false)
  // "+ Add new" closes the dropdown first; the popup opens only once it has fully closed,
  // otherwise its focus-return and the same click land "outside" the popup and dismiss it.
  const [handoff, setHandoff] = useState(false)
  const noun = MASTER[kind].noun
  const selected = items.find((i) => i.id === value)

  const [recentItems, otherItems] = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]))
    // Imported LRs can have a blank place
    const placeId = (name: string | null) =>
      name ? (items as { id: string; name?: string }[]).find((i) => i.name?.toLowerCase() === name.toLowerCase())?.id : undefined
    const ids = [...new Set([...(picked ?? []), ...usedOnLatestLrs(kind, lrs, placeId)])].filter((id) => byId.has(id))
    const recent = ids.slice(0, RECENT_MAX).map((id) => byId.get(id)!)
    // Only worth a separate section when there's a longer list below it
    if (items.length <= RECENT_MAX) return [[], items] as const
    const inRecent = new Set(recent.map((i) => i.id))
    return [recent, items.filter((i) => !inRecent.has(i.id))] as const
  }, [items, picked, lrs, kind])

  const choose = (id: string) => {
    if (id === value) return onChange(null)
    markRecent(kind, id)
    onChange(id)
  }

  const renderItem = (item: (typeof items)[number]) => (
    <CommandItem
      key={item.id}
      value={`${labelOf(kind, item)} ${item.id}`}
      onSelect={() => {
        choose(item.id)
        setOpen(false)
      }}
    >
      <Check className={cn(item.id === value ? "opacity-100" : "opacity-0")} />
      {labelOf(kind, item)}
    </CommandItem>
  )

  const startAdd = () => {
    setHandoff(true)
    setOpen(false)
  }

  const onDropdownDone = (isOpen: boolean) => {
    if (isOpen) return
    if (handoff) setAdding(true)
    else setSearch("")
  }

  const onPopupChange = (o: boolean) => {
    setAdding(o)
    if (!o) {
      setHandoff(false)
      setSearch("")
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} onOpenChangeComplete={onDropdownDone}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={invalid}
              className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground")}
            />
          }
        >
          <span className="truncate">{selected ? labelOf(kind, selected) : (placeholder ?? `Choose ${noun}`)}</span>
          <ChevronsUpDown className="opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) min-w-64 p-0" align="start" finalFocus={!handoff}>
          <Command>
            <CommandInput autoFocus placeholder={`Search ${noun}…`} value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>No {noun} found.</CommandEmpty>
              {recentItems.length > 0 && <CommandGroup heading="Recently used">{recentItems.map(renderItem)}</CommandGroup>}
              <CommandGroup heading={recentItems.length > 0 ? "All" : undefined}>{otherItems.map(renderItem)}</CommandGroup>
            </CommandList>
            <div className="border-t p-1">
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-primary" onClick={startAdd}>
                <Plus /> {search ? `Add "${search}" as new ${noun}` : `Add new ${noun}`}
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <QuickAddDialog
        kind={kind}
        open={adding}
        initial={search}
        onOpenChange={onPopupChange}
        onCreated={(id) => {
          markRecent(kind, id)
          onChange(id)
        }}
      />
    </>
  )
}
