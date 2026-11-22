import { useId, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useStore } from "@/store/useStore"

const MAX = 6

/**
 * Material box with suggestions from earlier bookings (most used first).
 * The rest of the top match shows greyed out after the cursor — Tab fills it in.
 * ↑/↓ pick another match, Enter also fills, Esc closes the list.
 */
export function MaterialField({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const lrs = useStore((s) => s.lrs)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  // Distinct materials, ranked by how often they were used, then how recently
  const known = useMemo(() => {
    const seen = new Map<string, { text: string; count: number; last: string }>()
    for (const lr of lrs) {
      const text = (lr.material ?? "").trim()
      if (!text) continue
      const key = text.toLowerCase()
      const row = seen.get(key)
      if (row) {
        row.count++
        if (lr.date > row.last) row.last = lr.date
      } else seen.set(key, { text, count: 1, last: lr.date })
    }
    return [...seen.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).map((r) => r.text)
  }, [lrs])

  const q = value.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q) return known.slice(0, MAX)
    const starts = known.filter((m) => m.toLowerCase().startsWith(q) && m.toLowerCase() !== q)
    const contains = known.filter((m) => !m.toLowerCase().startsWith(q) && m.toLowerCase().includes(q))
    return [...starts, ...contains].slice(0, MAX)
  }, [known, q])

  const showList = open && matches.length > 0
  // While typing, the top match is ready for Tab; on an empty box nothing is picked until ↑/↓
  const current = showList ? (active >= 0 ? matches[active] : q ? matches[0] : undefined) : undefined
  const ghost =
    current && value && current.toLowerCase().startsWith(value.toLowerCase()) ? current.slice(value.length) : ""

  const pick = (m: string) => {
    onChange(m)
    setOpen(false)
    setActive(-1)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (el) el.setSelectionRange(m.length, m.length)
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!matches.length) return
      e.preventDefault()
      setOpen(true)
      const base = active >= 0 ? active : q ? 0 : -1
      const next = e.key === "ArrowDown" ? base + 1 : base - 1
      setActive((next + matches.length) % matches.length)
    } else if ((e.key === "Tab" && !e.shiftKey) || e.key === "Enter") {
      // Only take over Tab/Enter when there's something to fill; otherwise they work as usual
      if (current) {
        e.preventDefault()
        pick(current)
      }
    } else if (e.key === "Escape" && showList) {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      {/* Ghost completion sits behind the transparent input, lined up with the typed text */}
      {ghost && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden rounded-lg border border-transparent px-2.5 py-1 text-base whitespace-pre md:text-sm"
        >
          <span className="invisible">{value}</span>
          <span className="text-muted-foreground">{ghost}</span>
          <kbd className="ml-2 rounded border bg-muted px-1 text-[10px] text-muted-foreground">Tab</kbd>
        </div>
      )}
      <Input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-autocomplete="both"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        autoComplete="off"
        placeholder="Fishing net, 12 MT"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border bg-popover p-1 text-sm shadow-md"
        >
          {!q && <li className="px-2 py-1 text-xs text-muted-foreground">Used before</li>}
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={m === current}
              // mousedown so the click lands before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault()
                pick(m)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("cursor-pointer rounded-md px-2 py-1.5", m === current && "bg-accent text-accent-foreground")}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
