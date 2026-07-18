import { createJsonService, HttpError } from "../../packages/service-runtime/runtime.mjs"
import { createCatalogStore } from "./storage.mjs"

const port = Number(process.env.PORT || 4001)
const store = await createCatalogStore()

createJsonService({ name: "catalog", port, ready: store.ready, onShutdown: store.close, handle: async ({ url }) => {
  if (url.pathname === "/products") {
    const search = url.searchParams.get("q") || ""
    const category = url.searchParams.get("category") || "All"
    const items = await store.search(search, category)
    return { body: { items, total: items.length, categories: await store.categories(), storage: store.adapter } }
  }
  if (url.pathname.startsWith("/products/")) {
    const product = await store.find(decodeURIComponent(url.pathname.split("/").pop()))
    if (!product) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found")
    return { body: product }
  }
} })
