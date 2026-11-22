import type { Company } from "@/lib/types"

// From the client's current invoice. Roadways GST/PAN not provided yet — ask the client.
export const LETTERHEAD: Record<Company, { name: string; gst: string; pan: string }> = {
  logistics: { name: "ANJU LOGISTICS", gst: "24COOPB8522C1Z8", pan: "COOPB8522C" },
  roadways: { name: "ANJU ROADWAYS", gst: "—", pan: "—" },
}

export const ADDRESS = "C-11, Bijal Business Center, Nr Aslali Circle Ring Road, Aslali, Ahmedabad - 382427, Gujarat"
export const CONTACT = "Phone: +91 8320015545, 9562080175 · anjulogisticsinfo@gmail.com · www.anjulogistics.com"
export const BANKS = [
  "HDFC Bank, Narol Branch · A/c 99900007571155 · IFSC HDFC0005303",
  "Federal Bank, Makarpura, Baroda · A/c 18060200004277 · IFSC FDRL0001806",
]

export function Letterhead({ company, right }: { company: Company; right: React.ReactNode }) {
  const lh = LETTERHEAD[company]
  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
      {company === "logistics" ? (
        <div>
          <img src="/logo.png" alt={lh.name} className="mb-1 h-14 w-auto" />
          <p className="text-[11px]">{ADDRESS}</p>
          <p className="text-[11px]">{CONTACT}</p>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <img src="/logo-mark.png" alt="" className="size-14" />
          <div>
            <p className="text-2xl font-black tracking-wide text-navy">{lh.name}</p>
            <p className="text-[11px]">{ADDRESS}</p>
            <p className="text-[11px]">{CONTACT}</p>
          </div>
        </div>
      )}
      <div className="text-right text-xs">{right}</div>
    </div>
  )
}
