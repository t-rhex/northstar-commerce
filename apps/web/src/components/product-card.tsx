import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Heart, Plus, Star, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { commerceApi, type Product } from "@/lib/api"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const queryClient = useQueryClient()
  const add = useMutation({ mutationFn: () => commerceApi.addToCart(product.id), onSuccess: (cart) => queryClient.setQueryData(["cart"], cart) })
  const discount = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0

  return (
    <article className="product-card group flex min-w-0 flex-col" style={{ animationDelay: `${index * 45}ms` }}>
      <div className="relative overflow-hidden rounded-xl bg-[#f1f3f3]">
        <div className="aspect-square overflow-hidden"><img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" loading={index < 5 ? "eager" : "lazy"} /></div>
        {product.badge && <Badge className="absolute left-2 top-2 rounded-md border-0 bg-[#c83d17] px-2 py-1 text-[10px] text-white shadow-sm">{product.badge}</Badge>}
        <button aria-label={`Save ${product.name}`} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-[#4b565d] shadow-sm hover:text-[#c83d17]"><Heart className="size-4" /></button>
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#768087]">{product.category} · {product.color}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#172126] group-hover:text-[#b44800]">{product.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs"><span className="font-medium text-[#a44300]">{product.rating}</span><span className="flex text-[#f0a000]">{Array.from({ length: 5 }).map((_, star) => <Star key={star} className={`size-3 ${star < Math.round(product.rating) ? "fill-current" : ""}`} />)}</span><span className="text-[#3175a1]">{product.reviews}</span></div>
        <div className="mt-2 flex items-baseline gap-1"><span className="text-lg font-bold">{money.format(product.price)}</span>{product.compareAt && <span className="text-xs text-[#778087] line-through">{money.format(product.compareAt)}</span>}</div>
        {discount > 0 && <p className="mt-0.5 text-xs font-semibold text-[#c83d17]">Save {discount}% today</p>}
        <p className="mt-2 flex items-center gap-1 text-xs text-[#455159]"><Truck className="size-3.5 text-[#28715b]" /> FREE delivery <strong>Tomorrow</strong></p>
        <p className={`mt-1 text-xs font-semibold ${product.stock <= 8 ? "text-[#c83d17]" : "text-[#28715b]"}`}>{product.stock <= 8 ? `Only ${product.stock} left in stock` : "In stock"}</p>
        <Button aria-label={`Add ${product.name} to cart`} onClick={() => add.mutate()} disabled={add.isPending} size="sm" className="mt-3 w-full rounded-full bg-[#ffca28] font-semibold text-[#172126] shadow-none hover:bg-[#f5bb00]">{add.isSuccess ? <><Check className="size-3.5" /> Added</> : <><Plus className="size-3.5" /> Add to cart</>}</Button>
      </div>
    </article>
  )
}
