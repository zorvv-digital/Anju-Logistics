import type { Db, MasterKind } from "@/lib/types"
import { GST } from "@/lib/gst"

export interface MasterField {
  key: string
  label: string
  placeholder?: string
  required?: boolean
  /** Validation pattern + message */
  pattern?: [RegExp, string]
  /** Pick from another master list (e.g. truck → owner) */
  pick?: MasterKind
  upper?: boolean
}

export interface MasterConfig {
  title: string
  noun: string
  fields: MasterField[]
}

const PAN: [RegExp, string] = [/^[A-Z]{5}\d{4}[A-Z]$/, "PAN should be like ABCDE1234F"]
const PHONE: [RegExp, string] = [/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"]
const TRUCK: [RegExp, string] = [/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{3,4}$/, "Truck number should be like KL10AB1234"]

export const MASTER: Record<MasterKind, MasterConfig> = {
  parties: {
    title: "New party",
    noun: "party",
    fields: [
      { key: "name", label: "Party name", required: true, placeholder: "Pee Key Enterprises" },
      { key: "gst", label: "GST number", pattern: GST, upper: true, placeholder: "32ALIPP8511G1Z6" },
      { key: "phone", label: "Phone", pattern: PHONE, placeholder: "9562080175" },
      { key: "address", label: "Address", placeholder: "Main Road, Parappanangadi" },
    ],
  },
  owners: {
    title: "New truck owner",
    noun: "owner",
    fields: [
      { key: "name", label: "Owner or broker name", required: true, placeholder: "MM Najeeb" },
      { key: "pan", label: "PAN", pattern: PAN, upper: true, placeholder: "ABCDE1234F" },
      { key: "phone", label: "Phone", pattern: PHONE, placeholder: "9544800756" },
    ],
  },
  trucks: {
    title: "New truck",
    noun: "truck",
    fields: [
      { key: "number", label: "Truck number", required: true, pattern: TRUCK, upper: true, placeholder: "KL10AB1234" },
      { key: "ownerId", label: "Owner", required: true, pick: "owners" },
    ],
  },
  drivers: {
    title: "New driver",
    noun: "driver",
    fields: [
      { key: "name", label: "Driver name", required: true, placeholder: "Latheesh" },
      { key: "phone", label: "Phone", pattern: PHONE, placeholder: "9037002412" },
    ],
  },
  places: {
    title: "New place",
    noun: "place",
    fields: [{ key: "name", label: "Place name", required: true, placeholder: "Kondotty" }],
  },
}

/** Text shown for an item in dropdowns. */
export function labelOf(kind: MasterKind, item: Db[MasterKind][number]): string {
  if (kind === "trucks") return (item as Db["trucks"][number]).number
  return (item as { name: string }).name
}

/** Validate a quick-add form. Returns field → message for every problem. */
export function validateMaster(kind: MasterKind, values: Record<string, string>, existing: string[]) {
  const errors: Record<string, string> = {}
  for (const f of MASTER[kind].fields) {
    const v = values[f.key]?.trim() ?? ""
    if (f.required && !v) errors[f.key] = `${f.label} is required`
    else if (v && f.pattern && !f.pattern[0].test(v.replace(/\s/g, ""))) errors[f.key] = f.pattern[1]
  }
  const primary = MASTER[kind].fields[0].key
  const name = values[primary]?.trim().toLowerCase()
  if (name && existing.some((e) => e.toLowerCase() === name)) errors[primary] = `This ${MASTER[kind].noun} already exists`
  return errors
}
