/** Pastel fills for dashboard tiles and avatars (colours defined in index.css). */
export type Tint = "rose" | "lavender" | "mint" | "cream" | "sky"

export const TINTS: Tint[] = ["rose", "lavender", "mint", "cream", "sky"]

export const tintBg: Record<Tint, string> = {
  rose: "bg-tint-rose",
  lavender: "bg-tint-lavender",
  mint: "bg-tint-mint",
  cream: "bg-tint-cream",
  sky: "bg-tint-sky",
}
