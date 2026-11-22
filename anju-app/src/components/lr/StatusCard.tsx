import { Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { date } from "@/lib/format"
import { STATUS_LABEL, type Lr, type LrStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useStore } from "@/store/useStore"

const ORDER: LrStatus[] = ["booked", "in_transit", "delivered"]
const NEXT_LABEL: Partial<Record<LrStatus, string>> = { booked: "Mark loaded", in_transit: "Mark delivered" }

export function StatusCard({ lr }: { lr: Lr }) {
  const setStatus = useStore((s) => s.setStatus)
  const at = ORDER.indexOf(lr.status)
  const next = ORDER[at + 1]
  const when: Record<LrStatus, string | null> = { booked: lr.date, in_transit: lr.loadedOn, delivered: lr.deliveredOn }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="grid grid-cols-3 gap-2">
          {ORDER.map((s, i) => (
            <li
              key={s}
              className={cn(
                "rounded-lg border p-2 text-center text-xs",
                i <= at ? "border-primary/30 bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <span className="flex items-center justify-center gap-1 font-medium">
                {i <= at && <Check className="size-3" />}
                {STATUS_LABEL[s]}
              </span>
              <span>{i <= at ? date(when[s]) : "—"}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {next && (
            <Button
              onClick={() => {
                setStatus(lr.id, next)
                toast.success(STATUS_LABEL[next])
              }}
            >
              {NEXT_LABEL[lr.status]}
            </Button>
          )}
          {at > 0 && (
            <Button variant="ghost" onClick={() => setStatus(lr.id, ORDER[at - 1])}>
              Undo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
