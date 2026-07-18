import { randomUUID } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"
import { createJsonService, HttpError, requireString, withSpan } from "../../packages/service-runtime/runtime.mjs"

const port = Number(process.env.PORT || 4006)
const latencyMs = Number(process.env.SIMULATED_LATENCY_MS || 650)
const failureRate = Number(process.env.SIMULATED_FAILURE_RATE || 0)
const payments = new Map()

createJsonService({ name: "payments", port, handle: async ({ req, url, body }) => {
  if (url.pathname === "/payments/authorize" && req.method === "POST") {
    const input = await body()
    const transactionId = requireString(input.transactionId, "transactionId")
    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(422, "VALIDATION_ERROR", "amount must be greater than zero", { field: "amount" })
    requireString(input.customer?.email, "customer.email", { email: true })
    return withSpan("payment.authorize", { "checkout.transaction_id": transactionId, "payment.amount": amount, "payment.currency": "USD" }, async () => {
      await delay(latencyMs)
      if (Math.random() < failureRate) throw new HttpError(402, "PAYMENT_DECLINED", "Payment simulation declined the authorization")
      const payment = { id: `PAY-${randomUUID().slice(0, 8).toUpperCase()}`, transactionId, amount, currency: "USD", status: "authorized", provider: "northstar-simulator", createdAt: new Date().toISOString() }
      payments.set(payment.id, payment)
      return { status: 201, body: payment }
    })
  }
  const match = url.pathname.match(/^\/payments\/([^/]+)\/void$/)
  if (match && req.method === "POST") {
    const payment = payments.get(match[1])
    if (payment) { payment.status = "voided"; payment.voidedAt = new Date().toISOString() }
    return { body: payment || { id: match[1], status: "not-found" } }
  }
  throw new HttpError(404, "NOT_FOUND", "Payment route not found")
} })
