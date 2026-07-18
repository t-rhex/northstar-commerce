import { randomUUID } from "node:crypto"
import { createJsonService, HttpError, requireString } from "../../packages/service-runtime/runtime.mjs"
import { createOrderEventPublisher } from "./event-bus.mjs"
import { createOrderStore } from "./storage.mjs"

const port = Number(process.env.PORT || 4003)
const store = await createOrderStore()
const events = await createOrderEventPublisher()
let flushing = false

async function flushOutbox() {
  if (flushing) return
  flushing = true
  try {
    for (const event of await store.pending()) {
      await events.publish(event.order, event.requestId)
      await store.markPublished(event.id)
    }
  } catch (error) {
    console.error(JSON.stringify({ level: "error", service: "orders", event: "outbox.publish_failed", message: error.message }))
  } finally { flushing = false }
}

const outboxTimer = setInterval(flushOutbox, Number(process.env.OUTBOX_POLL_MS || 2_000))
outboxTimer.unref()

createJsonService({
  name: "orders",
  port,
  ready: async () => (await store.ready()) && (await events.ready()),
  onShutdown: async () => { clearInterval(outboxTimer); await store.close(); await events.close() },
  handle: async ({ req, url, requestId, body }) => {
    if (url.pathname !== "/orders") return
    if (req.method === "GET") return { body: { items: await store.list(), storage: store.adapter } }
    if (req.method === "POST") {
      const idempotencyKey = req.headers["idempotency-key"] || requestId
      const payload = await body()
      if (!payload.cart?.items?.length) throw new HttpError(422, "VALIDATION_ERROR", "cart must contain at least one item", { field: "cart" })
      const customer = { name: requireString(payload.customer?.name, "customer.name"), email: requireString(payload.customer?.email, "customer.email", { email: true }) }
      const order = { id: `NS-${randomUUID().slice(0, 8).toUpperCase()}`, status: "confirmed", createdAt: new Date().toISOString(), customer, cart: payload.cart, transactionId: payload.transactionId, paymentId: payload.paymentId, reservationId: payload.reservationId }
      const result = await store.create(order, idempotencyKey, requestId)
      if (result.created) {
        if (result.outboxId) void flushOutbox()
        else await events.publish(result.order, requestId)
      }
      return { status: result.created ? 201 : 200, body: result.order }
    }
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method not allowed")
  },
})
