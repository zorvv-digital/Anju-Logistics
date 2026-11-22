import { Plus, Search } from "lucide-react"
import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { PAGE_SEARCH_ID } from "@/lib/pageSearch"
import { CompanySwitch } from "@/components/common/CompanySwitch"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { LoadingState } from "@/components/common/states"
import { buttonVariants } from "@/components/ui/button"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useHydrated } from "@/store/useHydrated"
import { useStore } from "@/store/useStore"
import { AppSidebar } from "./AppSidebar"
import { UserMenu } from "./UserMenu"

/** Logged-in layout: sidebar, top bar with company switch, and the page. */
export function AppShell() {
  const hydrated = useHydrated()
  const role = useStore((s) => s.role)
  const { pathname } = useLocation()
  // Search button: truck owners on the Truck owners page, bookings everywhere else
  const onOwners = pathname.startsWith("/owners")
  const searchLabel = onOwners ? "Search truck owners" : "Search bookings"

  if (!hydrated) return <LoadingState />
  if (!role) return <Navigate to="/login" replace />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* On phones the company switch drops to its own row so the buttons stay on screen */}
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-background/85 px-4 py-3 backdrop-blur md:px-6 print:hidden">
          <SidebarTrigger className="size-10 rounded-full bg-card shadow-xs ring-1 ring-black/[0.06]" />
          <div className="order-last w-full sm:order-none sm:w-auto">
            <CompanySwitch />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to={onOwners ? "/owners" : "/lr"}
              state={{ focusSearch: true }}
              aria-label={searchLabel}
              title={searchLabel}
              className={buttonVariants({ variant: "outline", size: "icon-lg", className: "size-10 shadow-xs" })}
              onClick={(e) => {
                // Page already has its own search box (Bookings, Truck owners) → just jump into it
                const box = document.getElementById(PAGE_SEARCH_ID)
                if (box) {
                  e.preventDefault()
                  box.focus()
                  box.scrollIntoView({ block: "center", behavior: "smooth" })
                }
              }}
            >
              <Search />
            </Link>
            <Link to="/lr/new" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
              <Plus /> <span className="hidden sm:inline">New booking</span>
            </Link>
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 space-y-6 p-4 md:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
