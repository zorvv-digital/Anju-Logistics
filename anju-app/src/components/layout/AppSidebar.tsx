import { FileText, Home, LogOut, RotateCcw, Sheet, Truck } from "lucide-react"
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
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">A</div>
          <div className="leading-tight">
            <p className="font-semibold">Anju</p>
            <p className="text-xs text-muted-foreground">Logistics · Roadways</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ to, label, icon: Icon }) => (
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
