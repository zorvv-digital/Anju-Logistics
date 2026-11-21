import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  id?: string
}

/** Thin wrapper over shadcn Select for plain value/label lists. */
export function SimpleSelect<T extends string>({ value, onChange, options, id }: Props<T>) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
