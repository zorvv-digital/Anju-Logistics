import { BarChart3, FileText, Home, LogOut, RotateCcw, Sheet, Truck } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { toast } from "sonner"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar"
import { useStore } from "@/store/useStore"

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/lr", label: "Bookings", icon: FileText },
  { to: "/owners", label: "Truck owners", icon: Truck },
  { to: "/analytics", label: "Analytics", icon: BarChart3, ownerOnly: true },
  { to: "/sheet", label: "Sheet view", icon: Sheet },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const userName = useStore((s) => s.userName)
  const role = useStore((s) => s.role)
  const logout = useStore((s) => s.logout)
  const resetDemo = useStore((s) => s.resetDemo)

  const active = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to))

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" onClick={() => setOpenMobile(false)} className="block px-2 py-2">
          <img src="/logo.png" alt="Anju Logistics" className="h-auto w-full" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.filter((n) => !n.ownerOnly || role === "owner").map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton isActive={active(to)} render={<Link to={to} onClick={() => setOpenMobile(false)} />}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {userName} · {role === "owner" ? "Owner" : "Accountant"}
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                resetDemo()
                toast.success("Demo data reset")
              }}
            >
              <RotateCcw />
              <span>Reset demo data</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
