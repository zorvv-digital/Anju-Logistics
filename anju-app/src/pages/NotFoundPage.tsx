import { MapPinOff } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/common/states"
import { buttonVariants } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <EmptyState
      icon={MapPinOff}
      title="Page not found"
      description="This page doesn't exist."
      action={<Link to="/" className={buttonVariants()}>Go home</Link>}
    />
  )
}
