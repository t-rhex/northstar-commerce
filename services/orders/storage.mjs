export async function createOrderStore(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    const orders = []
    const idempotency = new Map()
    return {
      async create(order, key) { const existing = idempotency.get(key); if (existing) return { order: existing, created: false }; orders.unshift(order); idempotency.set(key, order); return { order, created: true } },
      async list() { return orders }, async pending() { return [] }, async markPublished() {}, async ready() { return true }, async close() {}, adapter: "memory",
    }
  }
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: databaseUrl, max: Number(process.env.DB_POOL_SIZE || 10), connectionTimeoutMillis: 2_000 })
  const mapOrder = (row) => ({ id: row.id, status: row.status, createdAt: row.created_at.toISOString(), customer: row.customer, cart: row.cart, transactionId: row.transaction_id, paymentId: row.payment_id, reservationId: row.reservation_id })
  return {
    async create(order, key, requestId) {
      const client = await pool.connect()
      try {
        await client.query("BEGIN")
        const existing = await client.query("SELECT * FROM orders.orders WHERE idempotency_key = $1", [key])
        if (existing.rows[0]) { await client.query("ROLLBACK"); return { order: mapOrder(existing.rows[0]), created: false } }
        await client.query("INSERT INTO orders.orders (id, idempotency_key, status, customer, cart, transaction_id, payment_id, reservation_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [order.id, key, order.status, order.customer, order.cart, order.transactionId, order.paymentId, order.reservationId, order.createdAt])
        const outbox = await client.query("INSERT INTO orders.outbox (aggregate_id, event_type, payload, request_id) VALUES ($1, 'order.confirmed.v1', $2, $3) RETURNING id", [order.id, order, requestId])
        await client.query("COMMIT")
        return { order, created: true, outboxId: outbox.rows[0].id }
      } catch (error) {
        await client.query("ROLLBACK")
        if (error.code === "23505") {
          const existing = await client.query("SELECT * FROM orders.orders WHERE idempotency_key = $1", [key])
          if (existing.rows[0]) return { order: mapOrder(existing.rows[0]), created: false }
        }
        throw error
      } finally { client.release() }
    },
    async list() { const result = await pool.query("SELECT * FROM orders.orders ORDER BY created_at DESC LIMIT 100"); return result.rows.map(mapOrder) },
    async pending() { const result = await pool.query("SELECT id, payload, request_id FROM orders.outbox WHERE published_at IS NULL ORDER BY id LIMIT 25"); return result.rows.map((row) => ({ id: row.id, order: row.payload, requestId: row.request_id })) },
    async markPublished(id) { await pool.query("UPDATE orders.outbox SET published_at = now() WHERE id = $1", [id]) },
    async ready() { try { await pool.query("SELECT 1"); return true } catch { return false } },
    async close() { await pool.end() }, adapter: "postgres",
  }
}
