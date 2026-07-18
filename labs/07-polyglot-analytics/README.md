# Lab 07: Operate the polyglot transaction

## Goal

Follow one transaction through Node.js, Java, Go, and Python and diagnose language-specific behavior with common platform signals.

## Exercise

1. Complete checkout and copy its trace ID.
2. Open Jaeger and confirm spans from `gateway`, `checkout`, `inventory-java`, `payments-go`, `orders`, `notifications`, and `analytics-python`.
3. Open `http://localhost:4008/analytics/summary` and confirm the order was aggregated.
4. Stop analytics with `docker-compose stop analytics`, complete another checkout, and inspect the RabbitMQ backlog.
5. Start analytics and watch the durable queue drain. The analytics insert is idempotent by CloudEvent ID, so redelivery does not double-count revenue.

Compare startup time, memory, logs, probes, and shutdown behavior across the four language runtimes.
