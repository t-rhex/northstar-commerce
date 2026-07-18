import { demoProducts } from "./products.mjs"

const mapProduct = (row) => ({ id: row.id, name: row.name, category: row.category, price: Number(row.price), ...(row.compare_at == null ? {} : { compareAt: Number(row.compare_at) }), rating: Number(row.rating), reviews: row.reviews, stock: row.stock, badge: row.badge, color: row.color, image: row.image, description: row.description })

export async function createCatalogStore(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    return {
      async search(query, category) { return demoProducts.filter((product) => (category === "All" || product.category === category) && (!query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase()))) },
      async find(id) { return demoProducts.find((product) => product.id === id) },
      async categories() { return ["All", ...new Set(demoProducts.map((product) => product.category))] },
      async ready() { return true }, async close() {}, adapter: "memory",
    }
  }
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: databaseUrl, max: Number(process.env.DB_POOL_SIZE || 10), connectionTimeoutMillis: 2_000 })
  return {
    async search(query, category) {
      const result = await pool.query("SELECT * FROM catalog.products WHERE ($1 = 'All' OR category = $1) AND ($2 = '' OR to_tsvector('english', name || ' ' || category || ' ' || description) @@ plainto_tsquery('english', $2)) ORDER BY created_at, id", [category, query])
      return result.rows.map(mapProduct)
    },
    async find(id) { const result = await pool.query("SELECT * FROM catalog.products WHERE id = $1", [id]); return result.rows[0] ? mapProduct(result.rows[0]) : undefined },
    async categories() { const result = await pool.query("SELECT DISTINCT category FROM catalog.products ORDER BY category"); return ["All", ...result.rows.map((row) => row.category)] },
    async ready() { try { await pool.query("SELECT 1"); return true } catch { return false } },
    async close() { await pool.end() }, adapter: "postgres",
  }
}
