import { createJsonService, HttpError, requestJson, requireString } from "../../packages/service-runtime/runtime.mjs"

const port = Number(process.env.PORT || 4000)
const catalog = process.env.CATALOG_SERVICE_URL || "http://localhost:4001"
const cart = process.env.CART_SERVICE_URL || "http://localhost:4002"
const checkout = process.env.CHECKOUT_SERVICE_URL || "http://localhost:4007"
const analytics = process.env.ANALYTICS_SERVICE_URL || "http://localhost:4008"
const timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS || 2_500)
const cartId = "demo"

const downstream = (url, requestId, options = {}) => requestJson(url, { ...options, requestId, timeoutMs })
const health = (requestId) => Promise.all([
  downstream(`${catalog}/health/ready`, requestId),
  downstream(`${cart}/health/ready`, requestId),
  downstream(`${checkout}/health/ready`, requestId),
])

createJsonService({
  name: "gateway",
  port,
  ready: () => health("readiness-probe").then(() => true).catch(() => false),
  handle: async ({ req, url, requestId, body }) => {
    const apiPath = url.pathname.startsWith("/api/v1")
      ? url.pathname.slice("/api/v1".length)
      : url.pathname.startsWith("/api")
        ? url.pathname.slice("/api".length)
        : null
    if (apiPath === null) return

    if (apiPath === "/status") {
      const services = await health(requestId)
      return { body: { gateway: "up", services } }
    }
    if (apiPath === "/products") return { body: await downstream(`${catalog}/products${url.search}`, requestId) }
    if (apiPath.startsWith("/products/")) return { body: await downstream(`${catalog}${apiPath}`, requestId) }
    if (apiPath === "/cart" && req.method === "GET") return { body: await downstream(`${cart}/carts/${cartId}`, requestId) }
    if (apiPath === "/cart/items" && req.method === "POST") {
      const input = await body()
      const productId = requireString(input.productId, "productId")
      const quantity = Number(input.quantity || 1)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new HttpError(422, "VALIDATION_ERROR", "quantity must be an integer between 1 and 20", { field: "quantity" })
      const product = await downstream(`${catalog}/products/${encodeURIComponent(productId)}`, requestId)
      const payload = { productId, quantity, name: product.name, price: product.price, image: product.image, color: product.color }
      return { status: 201, body: await downstream(`${cart}/carts/${cartId}/items`, requestId, { method: "POST", body: JSON.stringify(payload) }) }
    }
    if (apiPath.startsWith("/cart/items/") && req.method === "DELETE") {
      const productId = apiPath.split("/").pop()
      return { body: await downstream(`${cart}/carts/${cartId}/items/${encodeURIComponent(productId)}`, requestId, { method: "DELETE" }) }
    }
    if (apiPath === "/checkout" && req.method === "POST") {
      const idempotencyKey = req.headers["idempotency-key"] || requestId
      const input = await body()
      const customer = { name: requireString(input.name, "name"), email: requireString(input.email, "email", { email: true }) }
      return { status: 202, body: await downstream(`${checkout}/checkouts`, requestId, { method: "POST", headers: { "idempotency-key": idempotencyKey }, body: JSON.stringify({ ...customer, cartId }) }) }
    }
    if (apiPath.startsWith("/checkouts/") && req.method === "GET") return { body: await downstream(`${checkout}${apiPath}`, requestId) }
    if (apiPath === "/analytics/summary" && req.method === "GET") return { body: await downstream(`${analytics}/analytics/summary`, requestId) }
  },
})
