# ADR 004: Polyglot services with schema-owned PostgreSQL persistence

## Status

Accepted.

## Decision

Use Node.js for catalog, cart, orders, checkout, gateway, and notifications; Spring Boot 4 on Java 21 for inventory; Go for payment simulation; and FastAPI on Python for asynchronous analytics. Each durable capability owns a PostgreSQL schema. Orders write the order and outbox event atomically, then a publisher drains the outbox to RabbitMQ. Analytics consumes with an independent durable queue and idempotent event storage.

## Consequences

The lab demonstrates deployment and observability differences across runtimes without changing checkout contracts. A single PostgreSQL container keeps local operation accessible, but schema ownership preserves a path to database-per-service production deployment. The outbox provides at-least-once event delivery, so consumers must remain idempotent.
