# Lab 23: OpenTelemetry and ADOT signal pipeline

## Outcome

Operate telemetry as a pipeline with application instrumentation decoupled from storage backends.

## Work

Install the EKS `adot` add-on and discover the served `OpenTelemetryCollector` API with `kubectl api-resources`/`kubectl explain` before creating a CR. Run an agent/DaemonSet for node and container signals and a gateway/Deployment for OTLP processing/export. Keep cluster/event receivers single-replica.

Send traces to X-Ray or a selected backend, metrics to AMP, and logs to CloudWatch/OpenSearch. Propagate context through HTTP and RabbitMQ. Complete checkout and correlate `request_id`, checkout ID, and trace ID across logs and spans. Add head sampling, then evaluate tail sampling with trace-aware routing.

## Evidence and gate

Submit collector health/internal metrics, sanitized config, one full transaction trace, log correlation, sampling calculation, dropped/failed export metrics, and outage buffering behavior. Avoid the removed `logging` exporter (use `debug`), duplicate cluster receivers, and collector stdout feedback loops.

[ADOT EKS add-on](https://aws-otel.github.io/docs/getting-started/adot-eks-add-on/) · [Collector gateway](https://opentelemetry.io/docs/collector/deploy/gateway/)
