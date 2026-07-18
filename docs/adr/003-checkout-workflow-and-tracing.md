# ADR 003: Asynchronous checkout orchestration and distributed tracing

## Status

Accepted.

## Decision

Checkout is owned by a dedicated orchestration service. The public POST returns `202 Accepted` with a transaction resource, and clients poll that resource while the service validates the cart, reserves inventory, authorizes a simulated payment, creates an order, and publishes a notification event. If a later step fails, previously authorized payment and reserved inventory are compensated.

Every HTTP server and client call creates an OpenTelemetry span and propagates W3C trace context. Order publishers inject that context into RabbitMQ headers and notification consumers extract it. Services export OTLP/HTTP to an OpenTelemetry Collector, which batches and forwards traces to Jaeger.

## Consequences

The user can observe progress without holding an HTTP request open, retries are safe through idempotency keys, and DevOps learners can correlate one transaction across synchronous and asynchronous boundaries. Transaction state remains in memory for the lab; a production implementation would persist workflow state and use durable workflow execution or an outbox pattern.
