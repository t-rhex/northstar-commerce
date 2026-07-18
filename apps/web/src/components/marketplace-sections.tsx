import { useQuery } from "@tanstack/react-query"
import { Activity, ArrowRight, Box, CheckCircle2, ChevronRight, Headphones, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { commerceApi, type Product } from "@/lib/api"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export function PromoHero({ onShop }: { onShop: () => void }) {
  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl bg-[#d9e9e4] shadow-sm">
      <div className="grid min-h-[390px] lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative z-10 flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
          <div className="flex w-fit items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold text-[#235747]"><Sparkles className="size-3.5" /> NORTHSTAR PRIME PICKS</div>
          <h1 className="mt-5 max-w-xl text-[clamp(2.6rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-0.06em] text-[#183b31]">Good design,<br/><span className="text-[#c45500]">delivered daily.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#49625a]">One marketplace for considered home, tech, travel, and everyday essentials—backed by a checkout you can trace service by service.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Button onClick={onShop} className="h-11 rounded-full bg-[#ffca28] px-6 font-bold text-[#172126] shadow-sm hover:bg-[#f5bb00]">Shop all departments <ArrowRight /></Button><Button asChild variant="outline" className="h-11 rounded-full border-[#78988d] bg-white/50 px-6"><a href="#architecture">See how it ships</a></Button></div>
        </div>
        <div className="relative min-h-[300px] overflow-hidden lg:min-h-full">
          <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=88" alt="Warm contemporary living room with curated furniture" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#d9e9e4] to-transparent" />
          <div className="absolute bottom-5 right-5 rounded-xl bg-white/90 p-4 shadow-xl backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#657078]">Deal of the day</p><p className="mt-1 text-lg font-bold">Up to 20% off home</p><p className="text-xs text-[#657078]">Ends at midnight</p></div>
        </div>
      </div>
    </section>
  )
}

const benefits = [
  { icon: Truck, title: "Fast delivery", body: "Clear arrival estimates" },
  { icon: RotateCcw, title: "30-day returns", body: "Simple and transparent" },
  { icon: ShieldCheck, title: "Secure simulation", body: "No real payment collected" },
  { icon: Headphones, title: "Service support", body: "Trace every transaction" },
]

export function FulfillmentBar() {
  return <section aria-label="Shopping benefits" className="mt-4 grid overflow-hidden rounded-xl bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, body }) => <div key={title} className="flex items-center gap-3 border-b border-[#e4e7e8] p-4 last:border-0 sm:border-r lg:border-b-0"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f3f7f5] text-[#28715b]"><Icon className="size-5" /></span><span><strong className="block text-sm">{title}</strong><span className="text-xs text-[#68737a]">{body}</span></span></div>)}</section>
}

export function CommercePulse() {
  const analytics = useQuery({ queryKey: ["analytics-summary"], queryFn: commerceApi.analytics, refetchInterval: 10_000, retry: 1 })
  if (!analytics.data) return null
  return <section className="mt-5 flex flex-col gap-4 rounded-2xl bg-[#17372e] px-5 py-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-emerald-300 text-emerald-950"><Activity className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-200">Live commerce pulse</p><p className="text-sm text-white/65">Aggregated asynchronously by the Python analytics worker</p></div></div><div className="grid grid-cols-3 gap-6 text-center sm:text-right"><PulseValue label="Orders" value={String(analytics.data.orders)} /><PulseValue label="Revenue" value={money.format(analytics.data.revenue)} /><PulseValue label="Avg. order" value={money.format(analytics.data.averageOrderValue)} /></div></section>
}

function PulseValue({ label, value }: { label: string; value: string }) { return <div><p className="text-lg font-bold">{value}</p><p className="text-[10px] uppercase tracking-wider text-white/50">{label}</p></div> }

const categoryMeta = [
  { name: "Furniture", line: "Make the room yours" },
  { name: "Audio", line: "Sound worth sharing" },
  { name: "Lighting", line: "Set the atmosphere" },
  { name: "Accessories", line: "Everyday upgrades" },
]

export function CategoryShowcase({ products, onCategory }: { products: Product[]; onCategory: (category: string) => void }) {
  return <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{categoryMeta.map((category) => { const product = products.find((item) => item.category === category.name); return <article key={category.name} className="group rounded-2xl bg-white p-4 shadow-sm"><h2 className="text-xl font-bold tracking-[-.025em]">{category.name}</h2><p className="mt-0.5 text-xs text-[#68737a]">{category.line}</p><button onClick={() => onCategory(category.name)} className="mt-4 block w-full overflow-hidden rounded-xl bg-[#f1f3f3] text-left"><img src={product?.image} alt="" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" /></button><button onClick={() => onCategory(category.name)} className="mt-4 flex items-center text-sm font-semibold text-[#16705a] hover:text-[#c45500]">Shop {category.name.toLowerCase()} <ChevronRight className="size-4" /></button></article> })}</section>
}

export function DealRail({ products }: { products: Product[] }) {
  return <section id="deals" className="mt-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c45500]">Limited-time savings</p><h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">Today’s deals</h2></div><a href="#products" className="hidden items-center text-sm font-semibold text-[#16705a] sm:flex">See all deals <ChevronRight className="size-4" /></a></div><div className="mt-5 flex gap-4 overflow-x-auto pb-2">{products.map((product) => { const discount = Math.round((1 - product.price / (product.compareAt || product.price)) * 100); return <article key={product.id} className="w-44 shrink-0 sm:w-52"><div className="overflow-hidden rounded-xl bg-[#f2f3f3]"><img src={product.image} alt={product.name} className="aspect-square w-full object-cover" /></div><div className="mt-3 flex items-center gap-2"><span className="rounded bg-[#c83d17] px-2 py-1 text-xs font-bold text-white">{discount}% off</span><span className="text-xs font-bold text-[#c83d17]">Deal</span></div><h3 className="mt-2 line-clamp-1 text-sm font-semibold">{product.name}</h3><p className="mt-1 text-sm"><strong>{money.format(product.price)}</strong> <span className="text-xs text-[#768087] line-through">{money.format(product.compareAt!)}</span></p></article> })}</div></section>
}

export function RecommendationRail({ products, title, eyebrow }: { products: Product[]; title: string; eyebrow: string }) {
  return <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c45500]">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">{title}</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{products.map((product) => <a key={product.id} href="#products" className="group min-w-0"><div className="overflow-hidden rounded-xl bg-[#f2f3f3]"><img src={product.image} alt={product.name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" /></div><h3 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-[#c45500]">{product.name}</h3><p className="mt-1 text-sm font-bold">{money.format(product.price)}</p></a>)}</div></section>
}

export function MarketplaceFooter() {
  return <footer id="architecture" className="bg-[#101b21] text-white"><a href="#" className="block bg-[#2d424d] py-3 text-center text-xs font-semibold hover:bg-[#38515e]">Back to top</a><div className="mx-auto grid max-w-[1300px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4"><FooterColumn title="Get to know us" items={["Northstar story", "Architecture", "DevOps labs", "Service contracts"]}/><FooterColumn title="Shop with us" items={["Your account", "Your orders", "Returns center", "Delivery policies"]}/><FooterColumn title="Operate the platform" items={["Jaeger traces", "RabbitMQ queues", "Redis state", "Health probes"]}/><div><h3 className="text-sm font-bold">Built to be taken apart</h3><p className="mt-3 text-sm leading-6 text-white/60">A TanStack, shadcn, Redis, RabbitMQ, and OpenTelemetry commerce lab for deployment teams.</p><div className="mt-5 flex items-center gap-2 text-[#ffca28]"><Box className="size-5"/><span className="font-bold">NORTHSTAR.market</span></div><div className="mt-3 flex items-center gap-2 text-xs text-white/55"><CheckCircle2 className="size-4 text-emerald-400" /> Production-shaped demo</div></div></div><div className="border-t border-white/10 py-5 text-center text-xs text-white/45">© 2026 Northstar Market · Simulated commerce for real infrastructure learning</div></footer>
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="text-sm font-bold">{title}</h3><ul className="mt-3 space-y-2 text-sm text-white/60">{items.map((item) => <li key={item}><a href="#" className="hover:text-white hover:underline">{item}</a></li>)}</ul></div>
}
