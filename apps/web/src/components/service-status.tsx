import { useQuery } from "@tanstack/react-query"
import { Check, CloudOff } from "lucide-react"
import { commerceApi } from "@/lib/api"

export function ServiceStatus() {
  const status = useQuery({
    queryKey: ["service-status"],
    queryFn: commerceApi.status,
    refetchInterval: 15_000,
    retry: 1,
  })
  const online = status.isSuccess
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
      <span className={`grid size-5 place-items-center rounded-full ${online ? "bg-emerald-400 text-emerald-950" : "bg-amber-300 text-amber-950"}`}>
        {online ? <Check className="size-3" /> : <CloudOff className="size-3" />}
      </span>
      {online ? `${status.data.services.length} services connected` : "Connecting to services"}
    </div>
  )
}
