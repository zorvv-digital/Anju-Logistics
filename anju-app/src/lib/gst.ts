/** GSTIN: 2-digit state code + PAN + entity no + "Z" + check digit, e.g. 32ALIPP8511G1Z6 */
export const GST: [RegExp, string] = [/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/, "GST number should be 15 characters, like 32ALIPP8511G1Z6"]

export const normalizeGst = (s: string) => s.replace(/\s+/g, "").toUpperCase()
