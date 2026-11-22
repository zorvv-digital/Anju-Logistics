import { Clock3, MapPin, X } from "lucide-react"
import { toast } from "sonner"
import { LrBadge } from "@/components/common/badges"
import type { Company } from "@/lib/types"

interface Props {
  driverName: string
  phone: string
  lrNo: string
  company: Company
}

/** 9562080175 → 95620 80175 */
const phoneText = (p: string) => (/^\d{10}$/.test(p) ? `${p.slice(0, 5)} ${p.slice(5)}` : p)

/**
 * "Tracking link sent" notice, drawn as an app card rather than a stock toast.
 * Demo only: nothing is actually sent yet — the real SMS/WhatsApp send goes where this is called.
 */
export function showTrackingToast({ driverName, phone, lrNo, company }: Props) {
  toast.custom(
    (id) => (
      <div
        role="status"
        className="flex w-full items-start gap-3 overflow-hidden rounded-xl border bg-popover py-3 pr-2 text-sm text-popover-foreground shadow-lg"
      >
        <span aria-hidden className="w-1 self-stretch rounded-r-full bg-primary" />
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Tracking link sent</p>
            <LrBadge company={company} lrNo={lrNo} />
          </div>
          <p className="mt-0.5 truncate text-muted-foreground">
            {driverName} · <span className="tabular-nums">{phoneText(phone)}</span>
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" /> Live location every 3–5 hours
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => toast.dismiss(id)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    ),
    { duration: 6000 },
  )
}
