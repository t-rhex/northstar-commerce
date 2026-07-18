import { createServer } from "node:http"
import { randomUUID } from "node:crypto"
import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

let telemetrySdk
let telemetryService

function initializeTelemetry(name) {
  if (telemetrySdk || !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return
  telemetryService = name
  const base = process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")
  telemetrySdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || name }),
    traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || `${base}/v1/traces` }),
  })
  telemetrySdk.start()
}

const tracer = () => trace.getTracer(telemetryService || "northstar-runtime")

export function currentTraceId() {
  const spanContext = trace.getActiveSpan()?.spanContext()
  return spanContext?.traceId && spanContext.traceId !== "00000000000000000000000000000000" ? spanContext.traceId : undefined
}

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function writeJson(res, status, payload, requestId) {
  const traceId = currentTraceId()
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "x-request-id": requestId,
    ...(traceId ? { "x-trace-id": traceId } : {}),
    "access-control-allow-origin": process.env.CORS_ORIGIN || "http://localhost:3000",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,x-request-id,idempotency-key,traceparent,tracestate,baggage",
    "access-control-expose-headers": "x-request-id,x-trace-id",
  })
  res.end(status === 204 ? undefined : JSON.stringify(payload))
}

async function readBody(req, limit = 65_536) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request payload is too large")
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON")
  }
}

export function createJsonService({ name, port, handle, ready = () => true, onShutdown = async () => {} }) {
  initializeTelemetry(name)
  let draining = false
  const server = createServer((req, res) => {
    const startedAt = performance.now()
    const requestId = req.headers["x-request-id"] || randomUUID()
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
    const parentContext = propagation.extract(context.active(), req.headers)
    context.with(parentContext, () => tracer().startActiveSpan(`${req.method} ${url.pathname}`, {
      kind: SpanKind.SERVER,
      attributes: { "http.request.method": req.method, "url.path": url.pathname, "server.address": req.headers.host || "localhost", "northstar.request_id": requestId },
    }, async (span) => {
      let status = 500
      try {
        if (req.method === "OPTIONS") { status = 204; return writeJson(res, status, undefined, requestId) }
        if (url.pathname === "/health/live") { status = 200; return writeJson(res, status, { service: name, status: "up" }, requestId) }
        if (url.pathname === "/health/ready") {
          const isReady = !draining && await ready()
          status = isReady ? 200 : 503
          return writeJson(res, status, { service: name, status: isReady ? "ready" : "not-ready" }, requestId)
        }
        if (url.pathname === "/health") { status = 200; return writeJson(res, status, { service: name, status: "up" }, requestId) }

        const result = await handle({ req, url, requestId, traceId: currentTraceId(), body: () => readBody(req) })
        if (!result) throw new HttpError(404, "NOT_FOUND", "Route not found")
        status = result.status || 200
        writeJson(res, status, result.body, requestId)
      } catch (error) {
        status = Number(error.status) || 500
        span.recordException(error)
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
        const code = error.code || "INTERNAL_ERROR"
        const message = status >= 500 ? "The service could not complete the request" : error.message
        writeJson(res, status, { error: { code, message, details: error.details }, requestId }, requestId)
        if (status >= 500) console.error(JSON.stringify({ level: "error", service: name, requestId, traceId: currentTraceId(), message: error.message, stack: error.stack }))
      } finally {
        span.setAttribute("http.response.status_code", status)
        console.log(JSON.stringify({ level: "info", service: name, requestId, traceId: currentTraceId(), method: req.method, path: url.pathname, status, durationMs: Math.round((performance.now() - startedAt) * 100) / 100 }))
        span.end()
      }
    }))
  })

  server.requestTimeout = 10_000
  server.headersTimeout = 12_000
  server.keepAliveTimeout = 5_000
  server.listen(port, "0.0.0.0", () => console.log(JSON.stringify({ level: "info", service: name, event: "started", port })))

  const shutdown = (signal) => {
    draining = true
    console.log(JSON.stringify({ level: "info", service: name, event: "shutdown", signal }))
    server.close(async () => {
      await onShutdown()
      await telemetrySdk?.shutdown()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 8_000).unref()
  }
  process.once("SIGTERM", () => shutdown("SIGTERM"))
  process.once("SIGINT", () => shutdown("SIGINT"))
  return server
}

export async function requestJson(url, { requestId, timeoutMs = 2_500, ...options } = {}) {
  const target = new URL(url)
  return tracer().startActiveSpan(`${options.method || "GET"} ${target.hostname}${target.pathname}`, {
    kind: SpanKind.CLIENT,
    attributes: { "http.request.method": options.method || "GET", "url.full": url, "server.address": target.hostname },
  }, async (span) => {
    let response
    try {
      const headers = { "content-type": "application/json", "x-request-id": requestId, ...options.headers }
      propagation.inject(context.active(), headers)
      response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs), headers })
      span.setAttribute("http.response.status_code", response.status)
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      span.end()
      if (error.name === "TimeoutError") throw new HttpError(504, "UPSTREAM_TIMEOUT", "A downstream service timed out")
      throw new HttpError(502, "UPSTREAM_UNAVAILABLE", "A downstream service is unavailable")
    }
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const upstream = payload.error || {}
      span.setStatus({ code: SpanStatusCode.ERROR, message: upstream.message })
      span.end()
      throw new HttpError(response.status, upstream.code || "UPSTREAM_ERROR", upstream.message || "A downstream service rejected the request", upstream.details)
    }
    span.end()
    return payload
  })
}

export function withSpan(name, attributes, operation) {
  return tracer().startActiveSpan(name, { attributes }, async (span) => {
    try { return await operation(span) }
    catch (error) { span.recordException(error); span.setStatus({ code: SpanStatusCode.ERROR, message: error.message }); throw error }
    finally { span.end() }
  })
}

export function traceHeaders() {
  const carrier = {}
  propagation.inject(context.active(), carrier)
  return carrier
}

export function withRemoteSpan(name, carrier, attributes, operation) {
  const parent = propagation.extract(context.active(), carrier || {})
  return context.with(parent, () => tracer().startActiveSpan(name, { kind: SpanKind.CONSUMER, attributes }, async (span) => {
    try { return await operation(span) }
    catch (error) { span.recordException(error); span.setStatus({ code: SpanStatusCode.ERROR, message: error.message }); throw error }
    finally { span.end() }
  }))
}

export function requireString(value, field, { email = false } = {}) {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(422, "VALIDATION_ERROR", `${field} is required`, { field })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new HttpError(422, "VALIDATION_ERROR", `${field} must be a valid email`, { field })
  return value.trim()
}
