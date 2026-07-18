export type Product = {
  id: string
  name: string
  category: string
  price: number
  compareAt?: number
  rating: number
  reviews: number
  stock: number
  badge?: string
  color: string
  image: string
  description: string
}

export type Catalog = {
  items: Product[]
  total: number
  categories: string[]
}

export type CartItem = Pick<Product, "name" | "price" | "image" | "color"> & {
  productId: string
  quantity: number
}

export type Cart = {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: number
  shipping: number
  total: number
}

export type ServiceStatus = {
  gateway: string
  services: Array<{ service: string; status: string }>
}

export type AnalyticsSummary = { orders: number; revenue: number; averageOrderValue: number; items: number; generatedAt: string }

export type CheckoutStep = {
  key: "cart" | "inventory" | "payment" | "order" | "notification"
  label: string
  status: "pending" | "running" | "completed" | "failed" | "compensated"
  detail?: string
  startedAt?: string
  completedAt?: string
}

export type CheckoutTransaction = {
  id: string
  status: "processing" | "completed" | "failed"
  traceId: string
  orderId?: string
  paymentId?: string
  reservationId?: string
  amount?: number
  steps: CheckoutStep[]
  error?: { code: string; message: string }
}

const apiUrl = import.meta.env.VITE_GATEWAY_URL || "http://localhost:4000/api/v1"
export const jaegerUrl = import.meta.env.VITE_JAEGER_URL || "http://localhost:16686"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options?.headers },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.message || "Something went wrong")
  return body as T
}

export const commerceApi = {
  products: (search: string, category: string) => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (category !== "All") params.set("category", category)
    const query = params.toString()
    return request<Catalog>(`/products${query ? `?${query}` : ""}`)
  },
  cart: () => request<Cart>("/cart"),
  status: () => request<ServiceStatus>("/status"),
  analytics: () => request<AnalyticsSummary>("/analytics/summary"),
  addToCart: (productId: string) => request<Cart>("/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity: 1 }) }),
  removeFromCart: (productId: string) => request<Cart>(`/cart/items/${productId}`, { method: "DELETE" }),
  checkout: (customer: { name: string; email: string }) => request<CheckoutTransaction>("/checkout", { method: "POST", headers: { "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(customer) }),
  checkoutStatus: (id: string) => request<CheckoutTransaction>(`/checkouts/${encodeURIComponent(id)}`),
}
