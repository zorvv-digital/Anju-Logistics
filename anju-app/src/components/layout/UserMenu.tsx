import { ChevronDown, LogOut, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Avatar } from "@/components/common/Avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/store/useStore"

/** Profile pill in the top bar: who is logged in, plus reset / log out. */
export function UserMenu() {
  const userName = useStore((s) => s.userName) ?? "User"
  const role = useStore((s) => s.role)
  const logout = useStore((s) => s.logout)
  const resetDemo = useStore((s) => s.resetDemo)
  const roleLabel = role === "owner" ? "Owner" : "Accountant"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account: ${userName}`}
        className="flex h-10 items-center gap-2 rounded-full bg-card py-1 pr-3 pl-1 shadow-xs ring-1 ring-black/[0.06] transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
      >
        <Avatar name={userName} tint={role === "owner" ? "rose" : "sky"} className="size-8" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{userName}</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <span className="block text-sm font-semibold text-foreground">{userName}</span>
            <span className="block font-normal">{roleLabel} login</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-lg px-2 py-1.5"
          onClick={() => {
            resetDemo()
            toast.success("Demo data reset")
          }}
        >
          <RotateCcw /> Reset demo data
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" className="rounded-lg px-2 py-1.5" onClick={logout}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
