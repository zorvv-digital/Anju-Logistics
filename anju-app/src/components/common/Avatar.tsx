import { TINTS, tintBg, type Tint } from "@/lib/tint"
import { cn } from "@/lib/utils"

/** Same name → same colour every time. */
const tintFor = (name: string) => TINTS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TINTS.length]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?"

/** Initials on a pastel circle — for people, parties and truck owners. */
export function Avatar({ name, tint, className }: { name: string; tint?: Tint; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground/80",
        tintBg[tint ?? tintFor(name)],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
