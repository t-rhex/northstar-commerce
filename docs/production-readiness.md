# Production readiness

This repository uses an enterprise-shaped architecture, but remains a self-contained demo. The following operational pieces are implemented:

- independently deployable capability modules behind a versioned gateway;
- environment-based service discovery;
- OpenAPI contract and an architectural decision record;
- propagated request IDs and structured JSON logs;
- liveness and dependency-aware readiness probes;
- bounded request bodies, validation, standard errors, and security headers;
- upstream deadlines, graceful shutdown, and idempotent checkout;
- non-root containers, health-gated startup, and end-to-end integration coverage.
- schema-owned PostgreSQL persistence with an idempotent seed migration;
- a transactional order outbox with publisher confirms and retry polling;
- durable, dead-lettered RabbitMQ consumers with idempotent analytics writes;
- distributed tracing across Node.js, Java, Go, Python, PostgreSQL, and RabbitMQ.
- an optional ELK log pipeline with checkout/request/trace correlation;
- Terraform foundations for protected state, three-AZ networking, EKS API access entries, Pod Identity, immutable ECR repositories, budgets, and opt-in managed data;
- a digest-only Helm workload baseline, Argo CD desired state, Argo Rollouts blue-green/canary examples, GitHub OIDC CI, and supply-chain attestations;
- DevSecOps/SRE lab assets for External Secrets, Kyverno, Karpenter, Prometheus SLO rules, runbooks, incident timelines, recovery, chaos, and FinOps.

Before handling real customers or money, an organization should supply its platform adapters:

- separate production database clusters per stateful capability, automated migration delivery, backups, and restore drills;
- OIDC-based identity and authorization at the edge;
- a PCI-compliant payment provider rather than collecting card data directly;
- distributed rate limiting and durable idempotency storage;
- durable telemetry storage plus metrics, logs, SLOs, and alerting (the lab currently exports traces);
- TLS ingress, a secrets manager, network policies, and workload identity;
- CI/CD with dependency scanning, SBOM generation, signed images, progressive delivery, and rollback;
- contract compatibility checks for independently released service versions.

Checkout workflow state and Jaeger storage remain ephemeral by design. A production version should use a durable workflow engine or persisted state machine and a production trace backend. These are deliberately adapters at existing seams rather than concerns embedded in the demo implementations.
