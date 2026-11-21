const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

export const money = (n: number | null | undefined) => (n == null ? "—" : inr.format(n))

/** ₹2.4L / ₹38K style for dashboard tiles */
export function moneyShort(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`
  return inr.format(n)
}

export function date(iso: string | null | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

/** YYYY-MM-DD in local (IST) time. toISOString() would shift to UTC and give yesterday before 5:30 am. */
export const localIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export const today = () => localIso(new Date())

export const text = (v: string | null | undefined) => (v && v.trim() ? v : "—")

export const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Indian rupees in words, for the invoice ("Rs. Ninety Thousand Only") */
export function inWords(n: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const two = (x: number) => (x < 20 ? a[x] : `${b[Math.floor(x / 10)]} ${a[x % 10]}`.trim())
  const three = (x: number) => (x >= 100 ? `${a[Math.floor(x / 100)]} Hundred ${two(x % 100)}` : two(x)).trim()
  n = Math.round(n)
  if (n === 0) return "Zero"
  const parts: string[] = []
  const units: [number, string][] = [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"]]
  for (const [size, name] of units) {
    if (n >= size) {
      parts.push(`${three(Math.floor(n / size))} ${name}`)
      n %= size
    }
  }
  if (n) parts.push(three(n))
  return parts.join(" ")
}
