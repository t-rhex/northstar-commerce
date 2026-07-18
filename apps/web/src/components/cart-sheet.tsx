import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Check, Circle, ExternalLink, LoaderCircle, RotateCcw, ShoppingBag, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { commerceApi, jaegerUrl } from "@/lib/api"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function CartSheet() {
  const cart = useQuery({ queryKey: ["cart"], queryFn: commerceApi.cart, retry: 1 })
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: commerceApi.removeFromCart,
    onSuccess: (value) => queryClient.setQueryData(["cart"], value),
  })
  const [transactionId, setTransactionId] = useState("")
  const checkout = useMutation({
    mutationFn: commerceApi.checkout,
    onSuccess: (transaction) => setTransactionId(transaction.id),
  })
  const transaction = useQuery({
    queryKey: ["checkout", transactionId],
    queryFn: () => commerceApi.checkoutStatus(transactionId),
    enabled: !!transactionId,
    initialData: transactionId && checkout.data?.id === transactionId ? checkout.data : undefined,
    refetchInterval: (query) => query.state.data?.status === "processing" ? 400 : false,
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    checkout.mutate({ name: String(data.get("name")), email: String(data.get("email")) })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative h-11 rounded-full border-[#d6d0c5] bg-transparent px-4 text-[#14221e] hover:bg-white">
          <ShoppingBag className="size-4" /><span className="hidden sm:inline">Bag</span>
          {!!cart.data?.itemCount && <span className="grid size-5 place-items-center rounded-full bg-[#ff5c35] text-[10px] font-bold text-white">{cart.data.itemCount}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full bg-[#f7f4ed] sm:max-w-md">
        <SheetHeader className="border-b border-[#ded8cd] p-6"><SheetTitle className="font-serif text-3xl">Your bag</SheetTitle><SheetDescription>{cart.data?.itemCount || 0} thoughtfully selected {cart.data?.itemCount === 1 ? "piece" : "pieces"}</SheetDescription></SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {!cart.data?.items.length ? (
            <div className="grid h-full place-items-center py-16 text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-full bg-[#ebe5da]"><ShoppingBag className="size-6 text-[#80796d]" /></div><p className="mt-5 font-medium text-[#14221e]">Your bag is waiting</p><p className="mt-1 text-sm text-[#787166]">Add a piece from the collection to begin.</p></div></div>
          ) : cart.data.items.map((item) => (
            <div key={item.productId} className="flex gap-4 border-b border-[#ded8cd] py-5">
              <img src={item.image} alt="" className="size-24 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-[#14221e]">{item.name}</p><p className="mt-1 text-xs text-[#797267]">{item.color} · Qty {item.quantity}</p></div><p className="font-medium">{money.format(item.price * item.quantity)}</p></div><Button variant="ghost" size="sm" className="mt-4 -ml-2 text-[#81796d]" onClick={() => remove.mutate(item.productId)}><Trash2 className="size-3.5" /> Remove</Button></div>
            </div>
          ))}
        </div>
        {!!cart.data?.items.length && (
          <div className="border-t border-[#ded8cd] bg-white/50 p-6">
            <div className="space-y-2 text-sm"><div className="flex justify-between text-[#746d62]"><span>Subtotal</span><span>{money.format(cart.data.subtotal)}</span></div><div className="flex justify-between text-[#746d62]"><span>Shipping</span><span>{cart.data.shipping ? money.format(cart.data.shipping) : "Complimentary"}</span></div></div>
            <Separator className="my-4 bg-[#d8d1c6]" /><div className="flex justify-between font-semibold"><span>Total</span><span>{money.format(cart.data.total)}</span></div>
            <Dialog onOpenChange={(open) => { if (!open) { setTransactionId(""); checkout.reset(); queryClient.invalidateQueries({ queryKey: ["cart"] }) } }}>
              <DialogTrigger asChild><Button className="mt-5 h-12 w-full rounded-full bg-[#14221e] text-white hover:bg-[#233a33]">Checkout <ArrowRight /></Button></DialogTrigger>
              <DialogContent className="border-0 bg-[#f7f4ed] sm:max-w-md">
                {transactionId ? (
                  <div className="py-2">
                    <DialogHeader><DialogTitle className="font-serif text-3xl">{transaction.data?.status === "completed" ? "Order confirmed" : transaction.data?.status === "failed" ? "Checkout interrupted" : "Processing checkout"}</DialogTitle><DialogDescription>Transaction <strong>{transactionId}</strong> is moving across the service mesh.</DialogDescription></DialogHeader>
                    <div className="my-6 space-y-2">
                      {transaction.data?.steps.map((step) => (
                        <div key={step.key} className="flex items-start gap-3 rounded-xl border border-[#ded8cd] bg-white/60 px-3 py-3">
                          <div className="mt-0.5">
                            {step.status === "running" ? <LoaderCircle className="size-4 animate-spin text-[#ff5c35]" /> : step.status === "completed" ? <Check className="size-4 text-emerald-700" /> : step.status === "failed" ? <X className="size-4 text-red-600" /> : step.status === "compensated" ? <RotateCcw className="size-4 text-amber-700" /> : <Circle className="size-4 text-[#aaa398]" />}
                          </div>
                          <div><p className="text-sm font-medium text-[#14221e]">{step.label}</p>{step.detail && <p className="mt-0.5 text-xs text-[#777064]">{step.detail}</p>}</div>
                        </div>
                      ))}
                    </div>
                    {transaction.data?.status === "completed" && <div className="rounded-2xl bg-emerald-50 p-4 text-center"><div className="mx-auto grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-800"><Check className="size-5" /></div><p className="mt-2 font-medium text-emerald-950">Order {transaction.data.orderId}</p><p className="text-xs text-emerald-800">The confirmation event is queued for the notification worker.</p></div>}
                    {transaction.data?.status === "failed" && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{transaction.data.error?.message || "The workflow failed. Completed side effects were compensated."}</p>}
                    {transaction.data?.traceId && <a href={`${jaegerUrl}/trace/${transaction.data.traceId}`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-between rounded-xl border border-[#d7d0c5] bg-[#14221e] px-4 py-3 text-sm text-white hover:bg-[#233a33]"><span><span className="block font-medium">Follow this transaction in Jaeger</span><span className="block font-mono text-[10px] text-white/65">{transaction.data.traceId}</span></span><ExternalLink className="size-4" /></a>}
                  </div>
                ) : (
                  <><DialogHeader><DialogTitle className="font-serif text-3xl">Almost yours</DialogTitle><DialogDescription>This lab simulates inventory reservation and payment authorization, then creates an order and publishes a RabbitMQ event. No real payment is collected.</DialogDescription></DialogHeader><form onSubmit={submit} className="mt-3 space-y-3"><Input name="name" required placeholder="Full name" className="h-11 bg-white" /><Input name="email" required type="email" placeholder="Email address" className="h-11 bg-white" />{checkout.isError && <p className="text-sm text-red-600">{checkout.error.message}</p>}<Button disabled={checkout.isPending} className="h-11 w-full rounded-full bg-[#ff5c35] text-white hover:bg-[#e84a25]">{checkout.isPending ? "Starting transaction…" : `Place simulated order · ${money.format(cart.data.total)}`}</Button></form></>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
