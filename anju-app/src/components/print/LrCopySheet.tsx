import { date } from "@/lib/format"
import type { Lr } from "@/lib/types"
import type { Lookups } from "@/store/selectors"
import { BANKS, LETTERHEAD, Letterhead } from "./letterhead"

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 border-b border-black px-2 py-1.5 text-sm">
      <span className="shrink-0 font-bold">{label}</span>
      <span className="font-[cursive] text-blue-900">{value || ""}</span>
    </div>
  )
}

/** The lorry receipt (G.C. note), consignee copy, filled from the booking. */
export function LrCopySheet({ lr, look }: { lr: Lr; look: Lookups }) {
  const consignor = look.party(lr.consignorId)
  const consignee = look.party(lr.consigneeId)
  const truck = look.truck(lr.truckId)
  const lh = LETTERHEAD[lr.company]
  const box = (on: boolean) => (on ? "☑" : "☐")

  return (
    <section className="sheet">
      <Letterhead company={lr.company} right={<><p>M: 9562080175</p><p>8320015545</p></>} />
      <div className="grid grid-cols-[1fr_2fr_1fr] border-b border-black text-sm">
        <div className="space-y-1 border-r border-black p-2">
          <p className="font-bold text-rose-600">AT OWNER'S RISK</p>
          <p className="font-bold text-rose-600">DELIVERY AT</p>
          <p className="font-[cursive] text-blue-900">{lr.to}</p>
          <p className="pt-2 text-xs">GSTIN {lh.gst}</p>
          <p className="text-xs">PAN {lh.pan}</p>
        </div>
        <div className="border-r border-black p-2">
          <p className="text-center font-bold text-rose-600">CONSIGNEE COPY</p>
          <p className="mt-2 font-bold">Insurance</p>
          <p className="text-xs">{box(true)} Customer has not insured the consignment</p>
          <p className="text-xs">{box(false)} Customer has insured the consignment</p>
        </div>
        <div>
          <Line label="G.C. No" value={<span className="text-lg">{lr.lrNo}</span>} />
          <Line label="Date" value={date(lr.date)} />
          <Line label="MV No" value={truck?.number} />
          <p className="p-2 text-xs">GST payable under reverse charge by the recipient.</p>
        </div>
      </div>
      <Line label="From" value={`${lr.from}  →  ${lr.to}`} />
      <Line label="Consignor's name and address:" value={`${consignor?.name ?? ""} ${consignor?.address ?? ""}`} />
      <Line label="GST No:" value={consignor?.gst} />
      <Line label="Consignee's name and address:" value={`${consignee?.name ?? ""} ${consignee?.address ?? ""}`} />
      <Line label="GST No:" value={consignee?.gst} />
      <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-black [&_td]:p-2 [&_th]:border [&_th]:border-black [&_th]:p-2">
        <thead>
          <tr><th>Packages</th><th className="w-1/2">Description (said to contain)</th><th>Weight</th><th>Rate</th><th>Freight</th></tr>
        </thead>
        <tbody>
          <tr className="h-40 align-top font-[cursive] text-blue-900">
            <td>As per invoice</td><td>{lr.material}</td><td /><td />
            <td className="font-sans text-xs text-black">
              Topay {box(lr.payMode === "topay")} Paid {box(lr.payMode === "paid")} TBB {box(lr.payMode === "tbb")}
            </td>
          </tr>
          <tr><td colSpan={4} className="text-right font-bold">S.T. charges</td><td className="text-right">100.00</td></tr>
        </tbody>
      </table>
      <div className="grid grid-cols-[2fr_1fr] border-x border-b border-black text-xs">
        <div className="space-y-1 border-r border-black p-2 text-rose-600">
          {BANKS.map((b) => <p key={b}>{b}</p>)}
          <p className="pt-2 text-black">Remarks: {lr.remarks ?? ""}</p>
        </div>
        <div className="flex flex-col justify-between p-2 text-center font-bold text-rose-600">
          <p>For, {lh.name}</p>
          <p>Booking clerk</p>
        </div>
      </div>
      <p className="mt-1 text-[10px]">Consignment booked subject to terms and conditions printed overleaf.</p>
    </section>
  )
}
