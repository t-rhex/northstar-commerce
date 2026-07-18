# Northstar DevOps Engineer learning path

Northstar Commerce is the workload; you are its platform and operations engineer. The complete path is designed for 10–14 weeks part-time or 4–6 weeks intensive. Every lab ends with evidence, an operational decision, and cleanup. Never run a cloud apply until Lab 09's account and cost guards pass.

## Level 1 — operate locally

1. [`01-compose`](01-compose/README.md) — images, health-gated startup, and logs.
2. [`02-redis-persistence`](02-redis-persistence/README.md) — state, TTL, AOF, and recovery.
3. [`03-rabbitmq-backlog`](03-rabbitmq-backlog/README.md) — backlog, acknowledgements, DLQ, and recovery.
4. [`04-failure-recovery`](04-failure-recovery/README.md) — break dependencies and diagnose readiness.
5. [`05-distributed-tracing`](05-distributed-tracing/README.md) — trace synchronous and asynchronous checkout traffic.
6. [`06-postgres-recovery`](06-postgres-recovery/README.md) — schema ownership and restore practice.
7. [`07-polyglot-analytics`](07-polyglot-analytics/README.md) — operate Node, Java, Go, and Python together.
8. [`08-elastic-logs`](08-elastic-logs/README.md) — ELK correlation by request, transaction, and trace.

## Level 2 — build the AWS platform

9. [`09-cloud-safety`](09-cloud-safety/README.md) — identity, account guardrails, budgets, and evidence.
10. [`10-terraform-state`](10-terraform-state/README.md) — remote state, locking, KMS, and recovery.
11. [`11-aws-network`](11-aws-network/README.md) — three-AZ public/private/data subnet design.
12. [`12-eks-foundation`](12-eks-foundation/README.md) — EKS, access entries, add-ons, and Pod Identity.
13. [`13-ecr-supply-chain`](13-ecr-supply-chain/README.md) — image build, scan, SBOM, signing, and digest promotion.
14. [`14-kubernetes-workloads`](14-kubernetes-workloads/README.md) — Helm, probes, resources, PDB, HPA, and policy.
15. [`15-managed-data`](15-managed-data/README.md) — RDS, Valkey, Amazon MQ, migrations, and failover.
16. [`16-secrets`](16-secrets/README.md) — Secrets Manager, Pod Identity, External Secrets, and rotation.
17. [`17-edge-dns-tls`](17-edge-dns-tls/README.md) — ALB/Gateway API, Route 53, ACM, and TLS.

## Level 3 — deliver safely

18. [`18-ci-oidc`](18-ci-oidc/README.md) — GitHub Actions, OIDC, tests, provenance, and ECR.
19. [`19-gitops`](19-gitops/README.md) — Argo CD, reconciliation, drift, and promotion.
20. [`20-blue-green`](20-blue-green/README.md) — preview, analysis, promotion, abort, and rollback.
21. [`21-canary`](21-canary/README.md) — weighted traffic and automated SLO analysis.

## Level 4 — observe and secure

22. [`22-slos-metrics`](22-slos-metrics/README.md) — Prometheus, AMP/Grafana, SLIs, SLOs, and burn alerts.
23. [`23-adot-telemetry`](23-adot-telemetry/README.md) — ADOT, traces, logs, sampling, and correlation.
24. [`24-cloud-observability`](24-cloud-observability/README.md) — CloudWatch, Application Signals, OpenSearch, and cost.
25. [`25-policy-as-code`](25-policy-as-code/README.md) — Kyverno audit-to-enforce and admission evidence.
26. [`26-runtime-security`](26-runtime-security/README.md) — Trivy, Falco, NetworkPolicy, and threat response.

## Level 5 — engineer reliability

27. [`27-autoscaling`](27-autoscaling/README.md) — HPA, Karpenter, Spot, disruption, and capacity.
28. [`28-backup-dr`](28-backup-dr/README.md) — Velero and managed-data restore with measured RPO/RTO.
29. [`29-chaos`](29-chaos/README.md) — AWS FIS experiments, stop conditions, and game days.
30. [`30-incident-response`](30-incident-response/README.md) — on-call, incident command, communication, and postmortems.
31. [`31-finops`](31-finops/README.md) — tagging, budgets, showback, rightsizing, and teardown.
32. [`32-capstone`](32-capstone/README.md) — enterprise release and incident assessment.

## Submission standard

For every lab create `evidence/<lab-number>/` locally (it is ignored by Git) with: `commands.md`, sanitized outputs, screenshots or exported dashboards, `decision.md`, rollback/restore proof, and `cost.md` for AWS work. Never save credentials, tokens, kubeconfigs, Terraform state, plans containing secrets, or customer-like data.

Run commands from the repository root. Use `./scripts/compose` for local Compose compatibility and `./scripts/devops-preflight` before cloud labs.
