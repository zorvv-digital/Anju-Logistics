import { date, inWords, money } from "@/lib/format"
import type { Lr } from "@/lib/types"
import type { Lookups } from "@/store/selectors"
import { BANKS, LETTERHEAD, Letterhead } from "./letterhead"

const MODE = { tbb: "TBB", topay: "TOPAY", paid: "PAID" }

export function InvoiceSheet({ lr, look }: { lr: Lr; look: Lookups }) {
  const payer = look.party(lr.billTo === "consignee" ? lr.consigneeId : lr.consignorId)
  const truck = look.truck(lr.truckId)
  const amount = lr.billAmount

  return (
    <section className="sheet">
      <Letterhead
        company={lr.company}
        right={<><p className="text-base font-bold">INVOICE</p><p>GST: {LETTERHEAD[lr.company].gst}</p><p>Original copy</p></>}
      />
      <div className="grid grid-cols-2 border-b border-black text-sm">
        <div className="border-r border-black p-3">
          <p className="font-bold italic">Billing / shipping details</p>
          <p className="font-bold">{payer?.name ?? "—"}</p>
          {payer?.address && <p>{payer.address}</p>}
          <p className="mt-2">GST No: {payer?.gst ?? "—"}</p>
        </div>
        <table className="m-3 text-sm">
          <tbody>
            {[
              ["Invoice No", lr.lrNo],
              ["Date", date(lr.date)],
              ["M.V. No", truck?.number ?? "—"],
              ["Topay/Paid/TBB", MODE[lr.payMode]],
              ["G.C. No", lr.lrNo],
              ["G.C. Date", date(lr.date)],
            ].map(([k, v]) => (
              <tr key={k}><td className="pr-3 font-semibold">{k}</td><td>: {v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-black [&_td]:p-2 [&_th]:border [&_th]:border-black [&_th]:p-2">
        <thead>
          <tr><th>Sr</th><th>Truck No</th><th>From</th><th>To</th><th>Product</th><th>Pkg</th><th>Qty</th><th>Amount (₹)</th></tr>
        </thead>
        <tbody>
          <tr className="h-64 align-top">
            <td>1</td><td>{truck?.number ?? "—"}</td><td>{lr.from}</td><td>{lr.to}</td><td>{lr.material}</td>
            <td>As per inv</td><td>1.000</td><td className="text-right">{money(amount)}</td>
          </tr>
          <tr><td colSpan={7} className="text-right font-bold">Grand total</td><td className="text-right font-bold">{money(amount)}</td></tr>
        </tbody>
      </table>
      <p className="border-x border-b border-black p-2 text-sm">Rs. {inWords(amount)} Only</p>
      <div className="grid grid-cols-[2fr_1fr] border-x border-b border-black text-xs">
        <div className="space-y-1 border-r border-black p-2">
          {BANKS.map((b) => <p key={b} className="font-semibold">{b}</p>)}
          <p className="pt-2"><b>Note:</b> Tax payable under reverse charge mechanism @ 5% by the recipient.</p>
          <p className="pt-2 text-center">Subject to Ahmedabad jurisdiction only.</p>
        </div>
        <div className="flex flex-col justify-between p-2 text-center">
          <p className="font-bold">For, {LETTERHEAD[lr.company].name}</p>
          <p className="font-bold">Authorised sign.</p>
        </div>
      </div>
    </section>
  )
}
