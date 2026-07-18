# Service contracts

The storefront talks only to the API gateway. The gateway discovers downstream services through environment variables, so any service can be replaced without changing the storefront.

| Capability | Default service | Contract |
| --- | --- | --- |
| Product discovery | `catalog:4001` (Node.js/PostgreSQL) | `GET /products`, `GET /products/:id` |
| Shopping cart | `cart:4002` | `GET /carts/:id`, `POST /carts/:id/items`, `DELETE /carts/:id/items/:productId` |
| Order capture | `orders:4003` (Node.js/PostgreSQL) | `POST /orders`, `GET /orders` |
| Notifications | `notifications:4004` | Consumes `order.confirmed.v1` from RabbitMQ |
| Inventory reservation | `inventory:4005` (Java/Spring Boot) | `POST /reservations`, `DELETE /reservations/:id` |
| Payment simulation | `payments:4006` (Go) | `POST /payments/authorize`, `POST /payments/:id/void` |
| Checkout workflow | `checkout:4007` | `POST /checkouts`, `GET /checkouts/:id` |
| Commerce analytics | `analytics:4008` (Python/FastAPI) | Consumes `order.confirmed.v1`; `GET /analytics/summary`, `GET /analytics/recent` |

Every module exposes liveness and readiness probes. The gateway exposes the public `/api/v1/*` surface and owns edge composition. Checkout owns the long-running transaction: cart validation, inventory reservation, simulated payment authorization, order creation, notification publication, and compensation on failure.

The cart module's storage seam has in-memory and Redis adapters. Compose selects Redis through `REDIS_URL`. The order module's event seam has no-op and RabbitMQ adapters; Compose selects RabbitMQ through `AMQP_URL`. Order events use the CloudEvents envelope and the `order.confirmed.v1` routing key.

To plug in a replacement service, implement the relevant HTTP contract and change its URL in `compose.yaml` or the owning service environment. PostgreSQL schemas make ownership explicit (`catalog`, `orders`, `inventory`, `payments`, `analytics`) while keeping one local database container economical for the lab. A production deployment can split those schemas into separately operated databases. HTTP calls and RabbitMQ message headers propagate W3C trace context.
