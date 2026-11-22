import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { HomePage } from "@/pages/HomePage"
import { InvoicePage } from "@/pages/InvoicePage"
import { LoginPage } from "@/pages/LoginPage"
import { LrDetailPage } from "@/pages/LrDetailPage"
import { LrFormPage } from "@/pages/LrFormPage"
import { LrListPage } from "@/pages/LrListPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { OwnersPage } from "@/pages/OwnersPage"
import { SheetPage } from "@/pages/SheetPage"

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lr/:id/print" element={<InvoicePage />} />
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="lr" element={<LrListPage />} />
            <Route path="lr/new" element={<LrFormPage />} />
            <Route path="lr/:id" element={<LrDetailPage />} />
            <Route path="lr/:id/edit" element={<LrFormPage />} />
            <Route path="owners" element={<OwnersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="sheet" element={<SheetPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      {/* print:hidden so a message still on screen never ends up on the printed LR / invoice */}
      <Toaster position="top-center" className="print:hidden" />
    </TooltipProvider>
  )
}
