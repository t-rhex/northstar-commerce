import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MarketplaceHeader } from "@/components/marketplace-header"
import { CategoryShowcase, CommercePulse, DealRail, FulfillmentBar, MarketplaceFooter, PromoHero, RecommendationRail } from "@/components/marketplace-sections"
import { ProductCard } from "@/components/product-card"
import { commerceApi } from "@/lib/api"

export const Route = createFileRoute("/")({ component: Storefront })

const categories = ["All", "Furniture", "Lighting", "Audio", "Accessories", "Footwear"]

function Storefront() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const catalog = useQuery({
    queryKey: ["products", search, category],
    queryFn: () => commerceApi.products(search, category),
    retry: 1,
  })
  const allProducts = useQuery({ queryKey: ["products", "", "All"], queryFn: () => commerceApi.products("", "All"), retry: 1 })

  const chooseCategory = (value: string) => {
    setCategory(value)
    setSearch("")
    requestAnimationFrame(() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" }))
  }

  return (
    <main className="min-h-screen bg-[#eaeded] text-[#172126]">
      <MarketplaceHeader search={search} category={category} categories={categories} onSearch={setSearch} onCategory={chooseCategory} />

      <div className="mx-auto max-w-[1500px] px-3 pb-12 sm:px-5 lg:px-7">
        <PromoHero onShop={() => chooseCategory("All")} />
        <FulfillmentBar />
        <CommercePulse />

        {allProducts.data && <CategoryShowcase products={allProducts.data.items} onCategory={chooseCategory} />}
        {allProducts.data && <DealRail products={allProducts.data.items.filter((product) => product.compareAt)} />}
        {allProducts.data && <RecommendationRail products={allProducts.data.items.slice(1, 7)} title="Inspired by your browsing" eyebrow="Recommended for you" />}

        <section id="products" className="mt-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-[#e2e6e8] pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c45500]">Northstar marketplace</p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{search ? `Results for “${search}”` : category === "All" ? "Explore all products" : `Shop ${category}`}</h2>
              <p className="mt-1 text-sm text-[#657078]">Independent products, one reliable delivery experience.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full"><SlidersHorizontal className="size-3.5" /> Filters</Button>
              <span className="text-sm text-[#657078]">{catalog.data?.total ?? 0} results</span>
            </div>
          </div>

          {catalog.isError && <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-6"><p className="font-semibold">The catalog service is taking a pause.</p><p className="mt-1 text-sm text-[#776f63]">Start the Docker Compose stack to reconnect products, cart, and checkout.</p></div>}
          {catalog.isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 10 }).map((_, index) => <div key={index}><Skeleton className="aspect-square rounded-xl"/><Skeleton className="mt-4 h-5 w-3/4"/><Skeleton className="mt-2 h-4 w-1/3"/></div>)}</div>}
          {catalog.data && <div className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{catalog.data.items.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>}
          {catalog.data?.total === 0 && <div className="py-20 text-center"><p className="text-2xl font-bold">No exact matches</p><p className="mt-2 text-sm text-[#657078]">Try another term or browse every department.</p><Button className="mt-5 rounded-full bg-[#ffca28] text-[#172126] hover:bg-[#f5bb00]" onClick={() => chooseCategory("All")}>See all products</Button></div>}
        </section>

        {allProducts.data && <RecommendationRail products={[...allProducts.data.items].reverse().slice(0, 6)} title="Customers also explore" eyebrow="More to discover" />}
      </div>
      <MarketplaceFooter />
    </main>
  )
}
