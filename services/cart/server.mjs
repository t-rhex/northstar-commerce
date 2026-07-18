import { createJsonService, HttpError, requireString } from "../../packages/service-runtime/runtime.mjs"
import { createCartStore } from "./storage.mjs"

const port = Number(process.env.PORT || 4002)
const store = await createCartStore()

const view = async (id) => {
  const items = await store.get(id)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 12
  return { id, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal, shipping, total: subtotal + shipping }
}

createJsonService({ name: "cart", port, ready: store.ready, onShutdown: store.close, handle: async ({ req, url, body }) => {
  const match = url.pathname.match(/^\/carts\/([^/]+)(?:\/items(?:\/([^/]+))?)?$/)
  if (!match) return
  const [, cartId, productId] = match
  if (req.method === "GET") return { body: await view(cartId) }
  if (req.method === "DELETE" && productId) {
    await store.set(cartId, (await store.get(cartId)).filter((item) => item.productId !== productId))
    return { body: await view(cartId) }
  }
  if (req.method === "DELETE") {
    await store.delete(cartId)
    return { body: await view(cartId) }
  }
  if (req.method === "POST") {
    const incoming = await body()
    const id = requireString(incoming.productId, "productId")
    const quantity = Number(incoming.quantity || 1)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new HttpError(422, "VALIDATION_ERROR", "quantity must be an integer between 1 and 20", { field: "quantity" })
    if (!Number.isFinite(incoming.price) || incoming.price < 0) throw new HttpError(422, "VALIDATION_ERROR", "price must be a positive number", { field: "price" })
    const items = await store.get(cartId)
    const existing = items.find((item) => item.productId === id)
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, 20)
    else items.push({ productId: id, quantity, name: requireString(incoming.name, "name"), price: incoming.price, image: requireString(incoming.image, "image"), color: requireString(incoming.color, "color") })
    await store.set(cartId, items)
    return { status: 201, body: await view(cartId) }
  }
  throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method not allowed")
} })
