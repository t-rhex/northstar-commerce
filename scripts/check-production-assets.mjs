import assert from "node:assert/strict"

const origin = process.env.STOREFRONT_ORIGIN || "http://127.0.0.1:3000"
const page = await fetch(origin)
assert.equal(page.status, 200, `storefront returned ${page.status}`)

const html = await page.text()
const stylesheetHref = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1]
assert.ok(stylesheetHref, "rendered HTML has no stylesheet link")

const stylesheetUrl = new URL(stylesheetHref, origin)
const stylesheet = await fetch(stylesheetUrl)
assert.equal(stylesheet.status, 200, `stylesheet returned ${stylesheet.status}: ${stylesheetUrl}`)
assert.match(stylesheet.headers.get("content-type") || "", /text\/css/, "stylesheet has the wrong content type")

const css = await stylesheet.text()
assert.match(css, /\.product-card/, "storefront CSS is missing its marketplace product styles")
assert.ok(css.length > 10_000, `stylesheet is unexpectedly small (${css.length} bytes)`)

console.log(`PASS ${stylesheetUrl.pathname} (${css.length} bytes, ${stylesheet.headers.get("content-type")})`)
