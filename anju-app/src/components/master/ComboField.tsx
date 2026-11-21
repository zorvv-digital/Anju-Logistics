import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { MasterKind } from "@/lib/types"
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

/** Searchable dropdown with "+ Add new" that opens a popup instead of a new screen. */
export function ComboField({ kind, value, onChange, placeholder, invalid, id }: Props) {
  const items = useStore((s) => s[kind])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState(false)
  // "+ Add new" closes the dropdown first; the popup opens only once it has fully closed,
  // otherwise its focus-return and the same click land "outside" the popup and dismiss it.
  const [handoff, setHandoff] = useState(false)
  const noun = MASTER[kind].noun
  const selected = items.find((i) => i.id === value)

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
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${labelOf(kind, item)} ${item.id}`}
                    onSelect={() => {
                      onChange(item.id === value ? null : item.id)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn(item.id === value ? "opacity-100" : "opacity-0")} />
                    {labelOf(kind, item)}
                  </CommandItem>
                ))}
              </CommandGroup>
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
        onCreated={onChange}
      />
    </>
  )
}
