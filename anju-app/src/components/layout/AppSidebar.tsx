import { BarChart3, FileText, Home, Sheet, Truck } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
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

/** Account actions (reset demo data, log out) live in the profile menu in the top bar. */
export function AppSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const role = useStore((s) => s.role)

  const active = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to))

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link to="/" onClick={() => setOpenMobile(false)} className="block">
          <img src="/logo.png" alt="Anju Logistics" className="h-auto w-full" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Menu</p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.filter((n) => !n.ownerOnly || role === "owner").map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    isActive={active(to)}
                    className="data-active:bg-primary data-active:font-semibold data-active:text-primary-foreground data-active:shadow-sm data-active:hover:bg-primary/90 data-active:hover:text-primary-foreground"
                    render={<Link to={to} onClick={() => setOpenMobile(false)} />}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-4">
        <p className="text-xs text-muted-foreground">Anju Logistics · Since 1992</p>
      </SidebarFooter>
    </Sidebar>
  )
}
