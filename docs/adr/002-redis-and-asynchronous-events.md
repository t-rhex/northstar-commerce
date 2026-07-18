# ADR 002: Redis cart adapter and RabbitMQ domain events

## Status

Accepted.

## Context

The learning environment needs realistic state and messaging behavior without making the storefront aware of infrastructure. Learners must be able to restart modules, observe persisted state, create queue backlogs, scale consumers, and inspect dead letters.

## Decision

The cart storage seam has two adapters: in-memory for fast integration tests and Redis for Compose. Redis keys have a configurable TTL and use append-only persistence. The order event seam similarly has a no-op test adapter and a RabbitMQ publisher using a durable topic exchange, persistent messages, publisher confirms, CloudEvents envelopes, and correlation IDs.

The notification worker owns its queue. It uses explicit bindings, bounded prefetch, manual acknowledgements, and dead-letter routing. It is not on the synchronous checkout path.

## Consequences

- Cart state survives cart-module restarts and can be inspected independently.
- Notification outages do not make checkout unavailable; events accumulate in RabbitMQ.
- Tests remain fast because infrastructure is selected by configuration.
- The demo publishes directly after order creation. A production database implementation should use a transactional outbox to remove the database/broker dual-write window.
