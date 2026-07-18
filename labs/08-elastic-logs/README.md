# Lab 08: Correlate checkout logs with ELK

## Goal

Operate a centralized logging pipeline and reconstruct one checkout from structured events across containers.

The lab sends application stdout through Docker's GELF logging driver to Logstash. Logstash parses JSON logs, maps correlation fields into an ECS-shaped document, and writes daily `northstar-logs-*` indices to Elasticsearch. Kibana provides search and visualization.

## Start the Elastic overlay

ELK is intentionally optional because it needs roughly 2–3 GB of additional memory.

```bash
npm run elastic:up
./scripts/compose -f compose.yaml -f compose.elastic.yaml --profile elastic ps
```

Wait for `elasticsearch`, `logstash`, and `kibana` to become healthy and for `elastic-setup` to exit successfully. Open <http://localhost:5601>.

The bootstrap job creates the **Northstar application logs** data view. In Kibana, open **Discover** and select it.

## Generate and find a transaction

1. Complete a checkout at <http://localhost:3000>.
2. Copy the checkout ID beginning with `CHK-` or its trace ID.
3. In Kibana Discover, query one of:

   ```text
   labels.checkout_transaction_id: "CHK-..."
   trace.id: "..."
   labels.request_id: "..."
   event.action: "checkout.step"
   ```

4. Add these columns: `@timestamp`, `service.name`, `event.action`, `labels.checkout_step`, `labels.checkout_step_status`, `trace.id`, and `message`.
5. Sort ascending by `@timestamp` to reconstruct the workflow.

The checkout service emits `checkout.started`, each `checkout.step` transition, `checkout.completed`, and `checkout.failed`. Normal access logs also expose method, path, response status, and duration.

## Correlate logs and traces

Copy `trace.id` from an ELK document, open Jaeger at <http://localhost:16686>, and search for that trace ID. ELK explains what each service logged; Jaeger shows the causal call tree and timing. Real incident response commonly uses both signals.

## Failure exercise

```bash
PAYMENT_FAILURE_RATE=1 ./scripts/compose -f compose.yaml -f compose.elastic.yaml \
  --profile elastic up -d --force-recreate payments checkout gateway
```

Run checkout again and search for `event.action: "checkout.failed"`. Verify that the payment and inventory compensation events share the checkout transaction ID. Restore normal behavior afterward:

```bash
PAYMENT_FAILURE_RATE=0 ./scripts/compose -f compose.yaml -f compose.elastic.yaml \
  --profile elastic up -d --force-recreate payments checkout gateway
```

## Inspect the pipeline

```bash
curl http://localhost:9200/_cluster/health?pretty
curl http://localhost:9200/_cat/indices/northstar-logs-*?v
curl http://localhost:9600/_node/stats/pipelines?pretty
```

Logstash uses a persisted queue and dead-letter queue so learners can inspect buffering behavior. Elasticsearch data and the Logstash queue are stored in named volumes.

## Stop the lab

```bash
npm run elastic:down
```

This stops the full overlay stack but preserves named volumes. Add `--volumes` to the equivalent Compose command only when you intentionally want to delete Elasticsearch, PostgreSQL, Redis, and RabbitMQ lab data.

## Production differences

The lab disables Elastic authentication and TLS. A production platform should use at least three Elasticsearch master-eligible nodes, separate data tiers, TLS, role-based access, secrets, snapshot lifecycle management, index lifecycle policies, shard sizing, resource limits, monitoring, and tested restore procedures. Container logging would normally be handled by Elastic Agent, Filebeat, Fluent Bit, or an OpenTelemetry log pipeline rather than a Docker daemon logging driver.
