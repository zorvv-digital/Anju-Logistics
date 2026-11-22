import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { tintBg, type Tint } from "@/lib/tint"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string
  icon: LucideIcon
  /** Pastel fill of the tile */
  tint?: Tint
  /** "bad" shows the value in red (e.g. a loss); otherwise numbers stay in ink */
  tone?: "default" | "good" | "bad"
  /** Small note bottom-right: a change vs last period, "₹2.7L still to collect", … */
  hint?: ReactNode
  className?: string
}

/**
 * Dashboard tile: big figure and label on a pastel fill, icon in a white chip bottom-left,
 * note bottom-right.
 */
export function StatCard({ label, value, icon: Icon, tint = "lavender", tone = "default", hint, className }: Props) {
  return (
    <div className={cn("flex min-h-36 flex-col justify-between gap-5 rounded-2xl p-4", tintBg[tint], className)}>
      <div className="min-w-0">
        <p className={cn("truncate text-2xl leading-tight font-bold tracking-tight", tone === "bad" && "text-destructive")}>{value}</p>
        <p className="mt-0.5 text-sm text-foreground/60">{label}</p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)] dark:bg-white/10">
          <Icon className="size-5" strokeWidth={2.2} />
        </span>
        {hint && <p className="text-right text-xs leading-snug text-foreground/60">{hint}</p>}
      </div>
    </div>
  )
}
