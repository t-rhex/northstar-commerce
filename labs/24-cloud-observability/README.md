# Lab 24: AWS-native observability and log analytics

## Outcome

Compare operational value and cost across CloudWatch/Application Signals, managed Prometheus/Grafana, local ELK, and AWS OpenSearch.

## Work

Install `amazon-cloudwatch-observability` with Pod Identity and verify the add-on is ACTIVE. Build a service dashboard with RED metrics, Kubernetes/node health, RabbitMQ backlog, and RDS/Valkey signals. Configure retention and sampling before sending volume.

Keep the existing ELK lab as the self-managed comparison. For AWS, route logs/traces through OpenTelemetry or OpenSearch Ingestion (OSIS) with SigV4 to a private, encrypted OpenSearch domain and fine-grained access controls. Use OpenSearch clients, not assumed Elasticsearch compatibility. Correlate one checkout in CloudWatch/OpenSearch and Jaeger/X-Ray.

## Evidence and gate

Submit add-on status, dashboard, correlated transaction, ingestion failure test, retention settings, daily ingest/storage estimate, and duplicate-signal audit. Public domains, basic-auth-only access, unlimited retention, or accidental duplicate export do not pass.

[CloudWatch EKS add-on](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/install-CloudWatch-Observability-EKS-addon.html) · [OpenSearch observability](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/observability.html)
