import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Company } from "@/lib/types"
import { useStore } from "@/store/useStore"

/** Global switch: show Logistics, Roadways, or both together. */
export function CompanySwitch() {
  const company = useStore((s) => s.company)
  const setCompany = useStore((s) => s.setCompany)
  return (
    <Tabs value={company} onValueChange={(v) => setCompany(v as Company | "all")}>
      <TabsList>
        <TabsTrigger value="all">Both</TabsTrigger>
        <TabsTrigger value="logistics" className="data-active:bg-primary data-active:text-primary-foreground">Logistics</TabsTrigger>
        <TabsTrigger value="roadways" className="data-active:bg-navy data-active:text-white">Roadways</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
