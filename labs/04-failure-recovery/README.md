# Lab 04: Dependency failure and recovery

## Objective

Use readiness, structured logs, request IDs, and service topology to diagnose an outage.

## Redis failure

```bash
docker-compose stop redis
curl -i http://localhost:4002/health/live
curl -i http://localhost:4002/health/ready
curl -i http://localhost:4000/health/ready
docker-compose logs --tail=50 cart gateway
```

The cart process remains live, but it is not ready because its storage adapter is unavailable. The gateway also becomes unready because cart is a synchronous dependency.

Recover it:

```bash
docker-compose start redis
docker-compose ps
```

## Consumer failure

Repeat with `notifications`. Gateway readiness remains healthy because the queue decouples notification delivery from checkout. RabbitMQ queue depth becomes the operational signal instead.
