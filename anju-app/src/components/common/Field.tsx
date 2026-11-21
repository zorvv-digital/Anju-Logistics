import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  htmlFor?: string
  error?: string | null
  hint?: ReactNode
  className?: string
  children: ReactNode
}

/** Label + control + inline error. Used by every form in the app. */
export function Field({ label, htmlFor, error, hint, className, children }: Props) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
