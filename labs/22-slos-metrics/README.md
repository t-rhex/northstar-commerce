# Lab 22: Metrics, SLIs, SLOs, and alerts

## Outcome

Turn user expectations into measurable reliability objectives and actionable multi-window burn alerts.

## Work

Deploy Prometheus locally or use Amazon Managed Service for Prometheus with Managed Grafana. Instrument/collect request rate, error rate, duration histograms, saturation, queue depth, consumer lag, DB pool usage, and checkout completion. Never add request/trace IDs as metric labels.

Define a checkout availability SLO (for example 99.9% over 30 days) and latency SLO with explicit scope/exclusions. Add recording rules for good/total events and fast/slow multi-window burn alerts. Include `for`, severity, owner, dashboard, trace link, and runbook URL; validate with `promtool check rules`.

Burn error budget through controlled payment failures and prove the alert fires, pages the correct owner, and resolves after recovery.

## Evidence and gate

Submit SLO document, PromQL, rule validation, dashboard, alert timeline, runbook execution, and remaining error budget. Raw CPU-only paging and alerts without ownership/runbooks fail.

[Prometheus alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) · [CloudWatch SLOs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-ServiceLevelObjectives.html)
