# Lab 05: Follow a distributed checkout

## Goal

Use a trace ID to explain exactly how one customer request moved through independently deployed modules.

## Exercise

1. Start the stack with `docker-compose up --build -d`.
2. Add a product and complete checkout at <http://localhost:3000>.
3. Watch the five live workflow stages in the checkout dialog.
4. Select **Follow this transaction in Jaeger**, or open <http://localhost:16686> and search the `gateway` service.
5. Inspect the span tree: gateway → checkout → cart → inventory → payments → orders → RabbitMQ publish → notifications consume.
6. Compare span durations with the simulated latency settings in `compose.yaml`.

## Failure experiment

Set `PAYMENT_FAILURE_RATE=1` and recreate the affected containers:

```bash
PAYMENT_FAILURE_RATE=1 docker-compose up -d --force-recreate payments checkout gateway
```

Run another checkout. The UI reports the failed payment stage, the inventory stage becomes **compensated**, and Jaeger marks the failing spans. Restore the normal simulator afterward:

```bash
PAYMENT_FAILURE_RATE=0 docker-compose up -d --force-recreate payments checkout gateway
```

## What this models

The OpenTelemetry Collector decouples applications from the trace backend and batches OTLP spans before exporting them to Jaeger. Jaeger is the traffic visualization layer. Trace context also travels in RabbitMQ message headers, so the notification consumer remains part of the original transaction trace even though it runs asynchronously.
