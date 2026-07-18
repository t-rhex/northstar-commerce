import { randomUUID } from "node:crypto"
import { createJsonService, currentTraceId, HttpError, requestJson, requireString, withSpan } from "../../packages/service-runtime/runtime.mjs"

const port = Number(process.env.PORT || 4007)
const cartUrl = process.env.CART_SERVICE_URL || "http://localhost:4002"
const inventoryUrl = process.env.INVENTORY_SERVICE_URL || "http://localhost:4005"
const paymentUrl = process.env.PAYMENT_SERVICE_URL || "http://localhost:4006"
const orderUrl = process.env.ORDER_SERVICE_URL || "http://localhost:4003"
const timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS || 3_000)
const transactions = new Map()
const idempotency = new Map()

const call = (url, transaction, options = {}) => requestJson(url, { ...options, requestId: transaction.requestId, timeoutMs })
const snapshot = (transaction) => JSON.parse(JSON.stringify(transaction))
const logWorkflow = (transaction, event, fields = {}) => console.log(JSON.stringify({
  level: "info",
  service: "checkout",
  event,
  transactionId: transaction.id,
  requestId: transaction.requestId,
  traceId: transaction.traceId,
  ...fields,
}))
const setStep = (transaction, key, status, detail) => {
  const step = transaction.steps.find((candidate) => candidate.key === key)
  step.status = status
  step.detail = detail
  if (status === "running") step.startedAt = new Date().toISOString()
  if (["completed", "failed", "compensated"].includes(status)) step.completedAt = new Date().toISOString()
  transaction.updatedAt = new Date().toISOString()
  logWorkflow(transaction, "checkout.step", { step: key, stepStatus: status, detail })
}

async function runWorkflow(transaction, customer, cartId, idempotencyKey) {
  return withSpan("checkout.workflow", { "checkout.transaction_id": transaction.id, "checkout.cart_id": cartId }, async (span) => {
    span.setAttribute("checkout.idempotency_key", idempotencyKey)
    let reservation
    let payment
    try {
      setStep(transaction, "cart", "running", "Loading and validating the cart")
      const cart = await call(`${cartUrl}/carts/${encodeURIComponent(cartId)}`, transaction)
      if (!cart.items.length) throw new HttpError(409, "EMPTY_CART", "Your cart is empty")
      transaction.amount = cart.total
      setStep(transaction, "cart", "completed", `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"} validated`)

      setStep(transaction, "inventory", "running", "Reserving stock")
      reservation = await call(`${inventoryUrl}/reservations`, transaction, { method: "POST", body: JSON.stringify({ transactionId: transaction.id, items: cart.items }) })
      transaction.reservationId = reservation.id
      setStep(transaction, "inventory", "completed", `Reservation ${reservation.id}`)

      setStep(transaction, "payment", "running", "Authorizing simulated payment")
      payment = await call(`${paymentUrl}/payments/authorize`, transaction, { method: "POST", body: JSON.stringify({ transactionId: transaction.id, amount: cart.total, customer }) })
      transaction.paymentId = payment.id
      setStep(transaction, "payment", "completed", `Authorization ${payment.id}`)

      setStep(transaction, "order", "running", "Creating the order")
      const order = await call(`${orderUrl}/orders`, transaction, { method: "POST", headers: { "idempotency-key": idempotencyKey }, body: JSON.stringify({ customer, cart, transactionId: transaction.id, paymentId: payment.id, reservationId: reservation.id }) })
      transaction.orderId = order.id
      setStep(transaction, "order", "completed", `Order ${order.id}`)

      setStep(transaction, "notification", "running", "Publishing confirmation event")
      setStep(transaction, "notification", "completed", "order.confirmed.v1 queued in RabbitMQ")
      await call(`${cartUrl}/carts/${encodeURIComponent(cartId)}`, transaction, { method: "DELETE" })
      transaction.status = "completed"
      transaction.completedAt = new Date().toISOString()
      logWorkflow(transaction, "checkout.completed", { orderId: transaction.orderId, amount: transaction.amount })
    } catch (error) {
      const running = transaction.steps.find((step) => step.status === "running")
      if (running) setStep(transaction, running.key, "failed", error.message)
      transaction.status = "failed"
      transaction.error = { code: error.code || "CHECKOUT_FAILED", message: error.message }
      logWorkflow(transaction, "checkout.failed", { errorCode: transaction.error.code, message: error.message })
      if (payment) {
        await call(`${paymentUrl}/payments/${encodeURIComponent(payment.id)}/void`, transaction, { method: "POST" }).catch(() => {})
        setStep(transaction, "payment", "compensated", `Authorization ${payment.id} voided`)
      }
      if (reservation) {
        await call(`${inventoryUrl}/reservations/${encodeURIComponent(reservation.id)}`, transaction, { method: "DELETE" }).catch(() => {})
        setStep(transaction, "inventory", "compensated", `Reservation ${reservation.id} released`)
      }
    }
  })
}

const health = (requestId) => Promise.all([cartUrl, inventoryUrl, paymentUrl, orderUrl].map((url) => requestJson(`${url}/health/ready`, { requestId, timeoutMs })))

createJsonService({ name: "checkout", port, ready: () => health("readiness-probe").then(() => true).catch(() => false), handle: async ({ req, url, requestId, traceId, body }) => {
  if (url.pathname === "/checkouts" && req.method === "POST") {
    const key = req.headers["idempotency-key"] || requestId
    const existingId = idempotency.get(key)
    if (existingId) return { status: 202, body: snapshot(transactions.get(existingId)) }
    const input = await body()
    const customer = { name: requireString(input.name, "name"), email: requireString(input.email, "email", { email: true }) }
    const cartId = typeof input.cartId === "string" && input.cartId ? input.cartId : "demo"
    const now = new Date().toISOString()
    const transaction = {
      id: `CHK-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "processing",
      traceId: traceId || currentTraceId() || requestId,
      requestId,
      createdAt: now,
      updatedAt: now,
      steps: [
        { key: "cart", label: "Validate cart", status: "pending" },
        { key: "inventory", label: "Reserve inventory", status: "pending" },
        { key: "payment", label: "Authorize payment", status: "pending" },
        { key: "order", label: "Create order", status: "pending" },
        { key: "notification", label: "Queue notification", status: "pending" },
      ],
    }
    transactions.set(transaction.id, transaction)
    idempotency.set(key, transaction.id)
    logWorkflow(transaction, "checkout.started", { cartId })
    void runWorkflow(transaction, customer, cartId, key)
    return { status: 202, body: snapshot(transaction) }
  }
  const match = url.pathname.match(/^\/checkouts\/([^/]+)$/)
  if (match && req.method === "GET") {
    const transaction = transactions.get(match[1])
    if (!transaction) throw new HttpError(404, "CHECKOUT_NOT_FOUND", "Checkout transaction not found")
    return { body: snapshot(transaction) }
  }
  throw new HttpError(404, "NOT_FOUND", "Checkout route not found")
} })
