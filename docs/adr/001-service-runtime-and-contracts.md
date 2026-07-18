# ADR 001: Shared service runtime and versioned contracts

## Status

Accepted.

## Context

The catalog, cart, order, and gateway modules must vary independently while presenting consistent operational behavior. Duplicating transport code in each implementation creates drift in error handling, observability, health checks, and shutdown behavior.

## Decision

Business capabilities remain separate deployable modules. A shared service-runtime module owns the HTTP seam: request parsing, request IDs, error envelopes, structured logs, security headers, probes, timeouts, and graceful shutdown. The gateway exposes a versioned `/api/v1` interface documented by OpenAPI. Internal capability interfaces remain smaller HTTP contracts and are configured through environment URLs.

## Consequences

- Capability implementations stay focused on domain behavior.
- Operational fixes have one point of locality.
- The runtime is shared code, so incompatible runtime changes require coordinated rollout.
- In-memory adapters remain demo-only. Production deployments should substitute durable adapters while keeping the same capability interfaces.
