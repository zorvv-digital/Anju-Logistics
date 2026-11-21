import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string
  icon: LucideIcon
  tone?: "default" | "good" | "bad"
  hint?: string
}

const toneClass = { default: "", good: "text-emerald-600 dark:text-emerald-400", bad: "text-red-600 dark:text-red-400" }

export function StatCard({ label, value, icon: Icon, tone = "default", hint }: Props) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-semibold tabular-nums", toneClass[tone])}>{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}
