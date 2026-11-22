import { Plus } from "lucide-react"
import { Link, Navigate, Outlet } from "react-router-dom"
import { CompanySwitch } from "@/components/common/CompanySwitch"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { LoadingState } from "@/components/common/states"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useHydrated } from "@/store/useHydrated"
import { useStore } from "@/store/useStore"
import { AppSidebar } from "./AppSidebar"

/** Logged-in layout: sidebar, top bar with company switch, and the page. */
export function AppShell() {
  const hydrated = useHydrated()
  const role = useStore((s) => s.role)

  if (!hydrated) return <LoadingState />
  if (!role) return <Navigate to="/login" replace />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-t-[3px] border-b border-t-primary bg-background/95 px-4 backdrop-blur print:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <CompanySwitch />
          <Link to="/lr/new" className={buttonVariants({ className: "ml-auto" })}>
            <Plus /> <span className="hidden sm:inline">New booking</span>
          </Link>
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
