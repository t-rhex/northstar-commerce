# Lab 01: Compose and health-gated startup

## Objective

Understand image builds, dependency-aware startup, health probes, and structured logs.

## Exercise

```bash
docker-compose up --build -d
docker-compose ps
docker-compose logs -f gateway
```

Open the storefront at `http://localhost:3000`, the gateway status at `http://localhost:4000/api/v1/status`, and RabbitMQ management at `http://localhost:15672`.

Inspect how `depends_on.condition: service_healthy` delays the gateway until catalog, cart, and orders are ready. Compare `/health/live` with `/health/ready` on ports 4000–4004.

## Verify

Every container reports healthy, the gateway returns all core capabilities as ready, and logs contain JSON request IDs and durations.

## Cleanup

```bash
docker-compose down
```
