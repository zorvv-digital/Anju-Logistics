import { Link2, MapPin, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Field } from "@/components/common/Field"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Lr } from "@/lib/types"
import { useStore } from "@/store/useStore"

/**
 * Demo of truck tracking. The real version gets the driver's phone location every 3–5 hours
 * from the shared link; here the update is typed in by hand.
 */
export function LocationCard({ lr }: { lr: Lr }) {
  const addLocation = useStore((s) => s.addLocation)
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState("")
  const [error, setError] = useState<string | null>(null)
  const link = `${window.location.origin}/track/${lr.id}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Tracking link copied. Send it to the driver on WhatsApp.")
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it.")
    }
  }

  const save = () => {
    if (!place.trim()) return setError("Enter where the truck is")
    addLocation(lr.id, place.trim())
    setPlace("")
    setOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
        <CardDescription>Saved every 3–5 hours from the driver's link</CardDescription>
        <CardAction className="flex gap-1">
          <Button size="sm" variant="outline" onClick={copy}>
            <Link2 /> Link
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus /> Update
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {lr.locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No location yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {lr.locations.slice(0, 5).map((l, i) => (
              <li key={l.id} className="flex items-center gap-2">
                <MapPin className={i === 0 ? "size-4 text-primary" : "size-4 text-muted-foreground"} />
                <span className={i === 0 ? "font-medium" : ""}>{l.place}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(l.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Where is the truck now?</DialogTitle>
          </DialogHeader>
          <Field label="Place" htmlFor="loc" error={error}>
            <Input id="loc" autoFocus placeholder="Near Mangalore" value={place} onChange={(e) => { setPlace(e.target.value); setError(null) }} onKeyDown={(e) => e.key === "Enter" && save()} />
          </Field>
          <DialogFooter>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
