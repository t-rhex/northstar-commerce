# Lab 03: Queue backlog and consumer recovery

## Objective

Observe asynchronous decoupling, durable queue depth, manual acknowledgement, and consumer recovery.

## Exercise

Start the stack, then stop the notification worker:

```bash
docker-compose stop notifications
```

Add an item and complete checkout. The order succeeds because notification delivery is not on the synchronous path.

Open RabbitMQ management at `http://localhost:15672`, select **Queues and Streams**, and inspect `notifications.order-confirmed.v1`. One ready message should be waiting.

Restart the consumer and follow its structured logs:

```bash
docker-compose start notifications
docker-compose logs -f notifications
```

The ready count returns to zero and the worker logs `notification.sent` with the order and correlation IDs.

Inspect `notifications.order-confirmed.v1.dlq` to understand where rejected messages are isolated for operator action.
