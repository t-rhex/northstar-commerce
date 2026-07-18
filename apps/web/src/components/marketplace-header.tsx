import { ChevronDown, MapPin, Menu, Search, Sparkles, UserRound } from "lucide-react"
import { CartSheet } from "@/components/cart-sheet"
import { ServiceStatus } from "@/components/service-status"

type HeaderProps = {
  search: string
  category: string
  categories: string[]
  onSearch: (value: string) => void
  onCategory: (value: string) => void
}

export function MarketplaceHeader({ search, category, categories, onSearch, onCategory }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 shadow-md">
      <div className="bg-[#101b21] text-white">
        <div className="mx-auto flex max-w-[1540px] items-center gap-3 px-3 py-2.5 sm:px-5">
          <a href="#" className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 font-bold tracking-[-0.03em] hover:outline hover:outline-1 hover:outline-white" aria-label="Northstar Supply home"><span className="grid size-8 place-items-center rounded-md bg-[#ffca28] text-[#172126]"><Sparkles className="size-4" /></span><span className="hidden sm:inline">NORTHSTAR<span className="font-normal text-white/55">.market</span></span></a>
          <button className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-left hover:outline hover:outline-1 hover:outline-white lg:flex"><MapPin className="size-4"/><span><span className="block text-[10px] leading-none text-white/60">Delivering to</span><span className="text-xs font-bold">Chicago 60601</span></span></button>
          <div className="flex h-11 min-w-0 flex-1 overflow-hidden rounded-lg bg-white ring-[#ffca28] focus-within:ring-3">
            <select aria-label="Search department" value={category} onChange={(event) => onCategory(event.target.value)} className="hidden border-r border-[#d6dadd] bg-[#f3f4f4] px-3 text-xs text-[#43505a] outline-none sm:block">{categories.map((item) => <option key={item}>{item}</option>)}</select>
            <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search Northstar Market" className="min-w-0 flex-1 px-4 text-sm text-[#172126] outline-none" />
            <button aria-label="Search" className="grid w-12 place-items-center bg-[#ffca28] text-[#172126] hover:bg-[#f5bb00]"><Search className="size-5" /></button>
          </div>
          <button className="hidden shrink-0 rounded-md px-2 py-1 text-left hover:outline hover:outline-1 hover:outline-white md:block"><span className="block text-[10px] leading-none text-white/60">Hello, learner</span><span className="flex items-center text-xs font-bold">Account & labs <ChevronDown className="size-3" /></span></button>
          <button className="hidden shrink-0 rounded-md px-2 py-1 text-left hover:outline hover:outline-1 hover:outline-white xl:block"><span className="block text-[10px] leading-none text-white/60">Returns</span><span className="text-xs font-bold">& Orders</span></button>
          <div className="[&_button]:border-white/20 [&_button]:text-white"><CartSheet /></div>
        </div>
      </div>
      <div className="bg-[#21323b] text-white">
        <div className="mx-auto flex h-9 max-w-[1540px] items-center gap-1 overflow-x-auto px-3 text-xs sm:px-5">
          <button className="flex shrink-0 items-center gap-1 rounded px-2 py-1 font-bold hover:outline hover:outline-1 hover:outline-white"><Menu className="size-4" /> All</button>
          {categories.slice(1).map((item) => <button key={item} onClick={() => onCategory(item)} className={`shrink-0 rounded px-2 py-1 hover:outline hover:outline-1 hover:outline-white ${category === item ? "bg-white/15 font-bold" : ""}`}>{item}</button>)}
          <a href="#deals" className="shrink-0 rounded px-2 py-1 text-[#ffd65c] hover:outline hover:outline-1 hover:outline-white">Today’s deals</a>
          <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex"><ServiceStatus /></div>
          <UserRound className="ml-auto size-4 shrink-0 lg:hidden" />
        </div>
      </div>
    </header>
  )
}
