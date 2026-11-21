import { useState } from "react"
import { toast } from "sonner"
import { Field } from "@/components/common/Field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { MasterKind } from "@/lib/types"
import { useStore } from "@/store/useStore"
import { ComboField } from "./ComboField"
import { labelOf, MASTER, validateMaster } from "./masterConfig"

interface Props {
  kind: MasterKind
  open: boolean
  initial: string
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}

/** Popup to add a new party / truck / owner / driver / place without leaving the form. */
export function QuickAddDialog({ kind, open, initial, onOpenChange, onCreated }: Props) {
  const cfg = MASTER[kind]
  const items = useStore((s) => s[kind])
  const addMaster = useStore((s) => s.addMaster)
  const primary = cfg.fields[0]
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const startValues = () => ({ [primary.key]: primary.upper ? initial.toUpperCase() : initial })
  const current = (key: string) => values[key] ?? startValues()[key] ?? ""

  const set = (key: string, v: string, upper?: boolean) => {
    setValues((s) => ({ ...startValues(), ...s, [key]: upper ? v.toUpperCase() : v }))
    setErrors((e) => ({ ...e, [key]: "" }))
  }

  const close = (o: boolean) => {
    if (!o) {
      setValues({})
      setErrors({})
    }
    onOpenChange(o)
  }

  const save = () => {
    const all = { ...startValues(), ...values }
    const errs = validateMaster(kind, all, items.map((i) => labelOf(kind, i)))
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    const clean = Object.fromEntries(
      cfg.fields.map((f) => [f.key, all[f.key]?.trim().replace(f.upper ? /\s/g : /^$/, "") || null]),
    )
    const id = addMaster(kind, clean as never)
    toast.success(`${cfg.noun[0].toUpperCase()}${cfg.noun.slice(1)} added`)
    onCreated(id)
    close(false)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cfg.title}</DialogTitle>
          <DialogDescription>Saved for next time. Your form stays as it is.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation() // React bubbles through portals: don't submit the booking form underneath
            save()
          }}
        >
          {cfg.fields.map((f) => (
            <Field key={f.key} label={f.label + (f.required ? "" : " (optional)")} htmlFor={`qa-${f.key}`} error={errors[f.key]}>
              {f.pick ? (
                <ComboField kind={f.pick} value={current(f.key) || null} onChange={(id) => set(f.key, id ?? "")} invalid={!!errors[f.key]} />
              ) : (
                <Input
                  id={`qa-${f.key}`}
                  autoFocus={f === primary}
                  value={current(f.key)}
                  placeholder={f.placeholder}
                  aria-invalid={!!errors[f.key]}
                  onChange={(e) => set(f.key, e.target.value, f.upper)}
                />
              )}
            </Field>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit">Save and use</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
