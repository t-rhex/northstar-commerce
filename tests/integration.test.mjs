import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"

const base = 42_000 + (process.pid % 1_000)
const ports = { gateway: base, catalog: base + 1, cart: base + 2, orders: base + 3, inventory: base + 5, payments: base + 6, checkout: base + 7 }
const children = []

function start(file, env) {
  const child = spawn(process.execPath, [file], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  })
  child.label = file
  child.output = ""
  child.stdout.on("data", (chunk) => { child.output += chunk })
  child.stderr.on("data", (chunk) => { child.output += chunk })
  children.push(child)
  return child
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await delay(100)
  }
  throw new Error(`Timed out waiting for ${url}\n${children.map((child) => `${child.label} (exit ${child.exitCode}):\n${child.output}`).join("\n")}`)
}

async function waitForTransaction(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const transaction = await fetch(url).then((response) => response.json())
    if (transaction.status !== "processing") return transaction
    await delay(50)
  }
  throw new Error(`Timed out waiting for transaction ${url}`)
}

test("versioned gateway runs an observable checkout workflow", async (t) => {
  start("services/catalog/server.mjs", { PORT: String(ports.catalog) })
  start("services/cart/server.mjs", { PORT: String(ports.cart) })
  start("services/orders/server.mjs", { PORT: String(ports.orders) })
  start("services/inventory/server.mjs", { PORT: String(ports.inventory), SIMULATED_LATENCY_MS: "10" })
  start("services/payments/server.mjs", { PORT: String(ports.payments), SIMULATED_LATENCY_MS: "10" })
  start("services/checkout/server.mjs", {
    PORT: String(ports.checkout),
    CART_SERVICE_URL: `http://127.0.0.1:${ports.cart}`,
    INVENTORY_SERVICE_URL: `http://127.0.0.1:${ports.inventory}`,
    PAYMENT_SERVICE_URL: `http://127.0.0.1:${ports.payments}`,
    ORDER_SERVICE_URL: `http://127.0.0.1:${ports.orders}`,
    UPSTREAM_TIMEOUT_MS: "1000",
  })
  start("services/gateway/server.mjs", {
    PORT: String(ports.gateway),
    CATALOG_SERVICE_URL: `http://127.0.0.1:${ports.catalog}`,
    CART_SERVICE_URL: `http://127.0.0.1:${ports.cart}`,
    CHECKOUT_SERVICE_URL: `http://127.0.0.1:${ports.checkout}`,
    UPSTREAM_TIMEOUT_MS: "1000",
  })
  t.after(async () => {
    await Promise.all(children.map((child) => {
      if (child.exitCode !== null) return Promise.resolve()
      return new Promise((resolve) => {
        child.once("exit", resolve)
        child.kill("SIGTERM")
      })
    }))
  })

  const origin = `http://127.0.0.1:${ports.gateway}`
  await waitFor(`${origin}/health/ready`)

  const traceId = "integration-trace-001"
  const products = await fetch(`${origin}/api/v1/products?category=Audio`, { headers: { "x-request-id": traceId } })
  assert.equal(products.status, 200)
  assert.equal(products.headers.get("x-request-id"), traceId)
  const catalog = await products.json()
  assert.equal(catalog.total, 2)

  const invalid = await fetch(`${origin}/api/v1/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test", email: "not-an-email" }),
  })
  assert.equal(invalid.status, 422)
  assert.equal((await invalid.json()).error.code, "VALIDATION_ERROR")

  const added = await fetch(`${origin}/api/v1/cart/items`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": traceId },
    body: JSON.stringify({ productId: "arc-chair", quantity: 2 }),
  })
  assert.equal(added.status, 201)
  assert.equal((await added.json()).itemCount, 2)

  const checkout = await fetch(`${origin}/api/v1/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": traceId, "idempotency-key": "checkout-001" },
    body: JSON.stringify({ name: "Enterprise Tester", email: "tester@example.com" }),
  })
  assert.equal(checkout.status, 202)
  const started = await checkout.json()
  assert.match(started.id, /^CHK-[A-F0-9]{8}$/)
  assert.equal(started.traceId, traceId)
  const transaction = await waitForTransaction(`${origin}/api/v1/checkouts/${started.id}`)
  assert.equal(transaction.status, "completed")
  assert.match(transaction.orderId, /^NS-[A-F0-9]{8}$/)
  assert.match(transaction.paymentId, /^PAY-[A-F0-9]{8}$/)
  assert.match(transaction.reservationId, /^RSV-[A-F0-9]{8}$/)
  assert.deepEqual(transaction.steps.map((step) => step.status), Array(5).fill("completed"))

  const retriedCheckout = await fetch(`${origin}/api/v1/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "checkout-001" },
    body: JSON.stringify({ name: "Enterprise Tester", email: "tester@example.com" }),
  })
  assert.equal(retriedCheckout.status, 202)
  assert.equal((await retriedCheckout.json()).id, started.id)

  const cart = await fetch(`${origin}/api/v1/cart`).then((response) => response.json())
  assert.equal(cart.itemCount, 0)
})
