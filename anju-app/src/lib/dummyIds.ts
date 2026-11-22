// Placeholder GST / PAN numbers for demo data. They pass the format checks but are
// recognisable as fake: every one has "DMY" where the real PAN letters would be.
// Replace them with the client's real numbers before going live.

const letter = (n: number) => String.fromCharCode(65 + (((n % 26) + 26) % 26))

/** Dummy PAN, e.g. DMYPA1001K. kind "P" = person (truck owner), "F" = firm (party). */
export function dummyPan(i: number, kind: "P" | "F" = "P") {
  return `DMY${kind}${letter(i)}${1001 + i}${letter(i * 7 + 10)}`
}

/** Dummy GSTIN, e.g. 32DMYFA1001K1Z5 (32 = Kerala). */
export function dummyGst(i: number) {
  return `32${dummyPan(i, "F")}1Z${(i * 3 + 5) % 10}`
}
