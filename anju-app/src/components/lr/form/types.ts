import type { LrDraft, LrErrors } from "@/lib/lrForm"

export interface SectionProps {
  draft: LrDraft
  errors: LrErrors
  set: <K extends keyof LrDraft>(key: K, value: LrDraft[K]) => void
}
