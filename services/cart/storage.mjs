export async function createCartStore({ redisUrl = process.env.REDIS_URL, ttlSeconds = Number(process.env.CART_TTL_SECONDS || 86_400) } = {}) {
  if (!redisUrl) return createMemoryCartStore()
  const { createClient } = await import("redis")
  const client = createClient({ url: redisUrl, socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3_000) } })
  client.on("error", (error) => console.error(JSON.stringify({ level: "error", service: "cart", adapter: "redis", message: error.message })))
  await client.connect()
  const key = (id) => `northstar:cart:${id}`
  return {
    async get(id) {
      const value = await client.get(key(id))
      return value ? JSON.parse(value) : []
    },
    async set(id, items) {
      await client.set(key(id), JSON.stringify(items), { EX: ttlSeconds })
    },
    async delete(id) {
      await client.del(key(id))
    },
    async ready() {
      if (!client.isReady) return false
      return (await client.ping()) === "PONG"
    },
    async close() {
      if (client.isOpen) await client.quit()
    },
    adapter: "redis",
  }
}

export function createMemoryCartStore() {
  const carts = new Map()
  return {
    async get(id) { return carts.get(id) || [] },
    async set(id, items) { carts.set(id, items) },
    async delete(id) { carts.delete(id) },
    async ready() { return true },
    async close() {},
    adapter: "memory",
  }
}
