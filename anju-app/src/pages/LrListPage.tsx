import { Search, SearchX } from "lucide-react"
import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/states"
import { LrTable } from "@/components/lr/LrTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { lrMoney } from "@/lib/calc"
import { useCompanyLrs, useLookups } from "@/store/selectors"

type Filter = "all" | "due" | "road" | "delivered"

export function LrListPage() {
  const lrs = useCompanyLrs()
  const look = useLookups()
  const [params, setParams] = useSearchParams()
  const q = params.get("q") ?? ""
  const filter = (params.get("filter") ?? "all") as Filter

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== "all") next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return lrs
      .filter((lr) => {
        if (filter === "due" && lrMoney(lr).toCollect <= 0) return false
        if (filter === "road" && lr.status !== "in_transit") return false
        if (filter === "delivered" && lr.status !== "delivered") return false
        if (!needle) return true
        const hay = [lr.lrNo, lr.from, lr.to, lr.material, look.party(lr.consignorId)?.name, look.party(lr.consigneeId)?.name, look.truck(lr.truckId)?.number]
        return hay.join(" ").toLowerCase().includes(needle)
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.lrNo - a.lrNo)
  }, [lrs, q, filter, look])

  return (
    <>
      <PageHeader
        title="Bookings"
        description={`${rows.length} of ${lrs.length} LRs`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search LR no, party, place, truck…" value={q} onChange={(e) => update("q", e.target.value)} />
        </div>
        <Tabs value={filter} onValueChange={(v) => update("filter", String(v))}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="due">Money due</TabsTrigger>
            <TabsTrigger value="road">On the road</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {lrs.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Create your first LR with New booking at the top."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No LRs match"
          description="Try another search or filter."
          action={<Button variant="outline" onClick={() => setParams({}, { replace: true })}>Clear filters</Button>}
        />
      ) : (
        <LrTable lrs={rows} />
      )}
    </>
  )
}
