import { randomUUID } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"
import { createJsonService, HttpError, requireString, withSpan } from "../../packages/service-runtime/runtime.mjs"

const port = Number(process.env.PORT || 4005)
const latencyMs = Number(process.env.SIMULATED_LATENCY_MS || 450)
const failureRate = Number(process.env.SIMULATED_FAILURE_RATE || 0)
const reservations = new Map()

createJsonService({ name: "inventory", port, handle: async ({ req, url, body }) => {
  if (url.pathname === "/reservations" && req.method === "POST") {
    const input = await body()
    const transactionId = requireString(input.transactionId, "transactionId")
    if (!Array.isArray(input.items) || !input.items.length) throw new HttpError(422, "VALIDATION_ERROR", "items must contain at least one product", { field: "items" })
    return withSpan("inventory.reserve", { "checkout.transaction_id": transactionId, "inventory.item_count": input.items.length }, async () => {
      await delay(latencyMs)
      if (Math.random() < failureRate) throw new HttpError(409, "OUT_OF_STOCK", "Inventory simulation rejected the reservation")
      const reservation = { id: `RSV-${randomUUID().slice(0, 8).toUpperCase()}`, transactionId, status: "reserved", items: input.items, createdAt: new Date().toISOString() }
      reservations.set(reservation.id, reservation)
      return { status: 201, body: reservation }
    })
  }
  const match = url.pathname.match(/^\/reservations\/([^/]+)$/)
  if (match && req.method === "DELETE") {
    const reservation = reservations.get(match[1])
    if (reservation) { reservation.status = "released"; reservation.releasedAt = new Date().toISOString() }
    return { body: reservation || { id: match[1], status: "not-found" } }
  }
  throw new HttpError(404, "NOT_FOUND", "Reservation route not found")
} })
