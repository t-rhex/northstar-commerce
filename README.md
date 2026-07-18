# Northstar Commerce

A production-shaped, polyglot ecommerce and DevOps learning lab. The storefront uses **TanStack Start**, **TanStack Query**, and **shadcn/ui**; backend capabilities are implemented in Node.js, Java/Spring Boot, Go, and Python with PostgreSQL, Redis, RabbitMQ, OpenTelemetry, Jaeger, and an optional Elastic Stack.

## Run the complete stack

```bash
./scripts/compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The versioned gateway is available at [http://localhost:4000/api/v1/status](http://localhost:4000/api/v1/status).

## Services

```text
Storefront :3000
    │
    ▼
API gateway :4000
    ├── Catalog  :4001 (Node.js + PostgreSQL)
    ├── Cart     :4002 ── Redis :6379
    └── Checkout :4007
         ├── Inventory :4005 (Java + PostgreSQL)
         ├── Payments  :4006 (Go + PostgreSQL)
         └── Orders    :4003 (Node.js + PostgreSQL outbox)
                              └── RabbitMQ :5672
                                   ├── Notifications :4004 (Node.js)
                                   └── Analytics :4008 (Python + PostgreSQL)

All services ── OTLP ── OpenTelemetry Collector ── Jaeger :16686
```

Each service owns one capability and exposes a health endpoint. Implementations are selected through service URL environment variables. Replace a URL with any compatible implementation to plug in a new service.

Node operational concerns are centralized in `packages/service-runtime`; Java uses the OpenTelemetry agent, Go uses the OpenTelemetry SDK, and Python uses FastAPI instrumentation. Carts use Redis with TTL and AOF. Products, inventory, payment authorizations, orders, outbox records, and analytics are persisted in PostgreSQL. Checkout is an asynchronous saga-style workflow with idempotency and compensating actions. The transactional order outbox publishes durable RabbitMQ events consumed with manual acknowledgements, idempotent analytics writes, and dead-letter routing.

The exact endpoints and ownership boundaries are documented in [`docs/service-contracts.md`](docs/service-contracts.md).
The public interface is defined in [`docs/openapi.yaml`](docs/openapi.yaml), and the design decision is recorded in [`docs/adr/001-service-runtime-and-contracts.md`](docs/adr/001-service-runtime-and-contracts.md).

Follow a checkout across four languages, PostgreSQL, and RabbitMQ in [Jaeger](http://localhost:16686). Query Python analytics at [http://localhost:4008/analytics/summary](http://localhost:4008/analytics/summary). RabbitMQ's management console is at [http://localhost:15672](http://localhost:15672). Start with [`labs/README.md`](labs/README.md) for guided exercises.

For centralized logs, start the optional Elasticsearch, Logstash, and Kibana overlay:

```bash
npm run elastic:up
```

Open [Kibana](http://localhost:5601) and select the bootstrapped **Northstar application logs** data view. Filter by `trace.id`, `labels.request_id`, or `labels.checkout_transaction_id` to correlate logs with Jaeger. Full instructions are in [`labs/08-elastic-logs/README.md`](labs/08-elastic-logs/README.md).

## Become a DevOps engineer with Northstar

The repository includes a 32-lab path from local container operations to an enterprise-shaped AWS platform. After the eight local labs, learners build Terraform remote state and a three-AZ VPC, EKS with access entries and Pod Identity, ECR supply-chain controls, managed PostgreSQL/Valkey/RabbitMQ, Helm, GitHub OIDC CI, Argo CD, blue-green and canary delivery, SLOs, ADOT/CloudWatch/OpenSearch, policy/runtime security, Karpenter, backup/restore, FIS chaos, incident command, and FinOps. The final capstone requires a release, injected incident, restore, postmortem, and teardown.

Start at [`labs/README.md`](labs/README.md). The implementation plan and current API guardrails are in [`docs/devops-curriculum-plan.md`](docs/devops-curriculum-plan.md); runnable platform assets live under [`platform/`](platform/terraform/README.md).

```bash
npm run devops:preflight
npm run devops:validate
```

AWS resources are not applied automatically. Managed data and other expensive services are opt-in, protected by account/CIDR checks, budget exercises, evidence gates, and explicit teardown instructions.

## Frontend-only development

The UI can be started independently with `npm run dev`, but catalog, bag, and checkout need the gateway and its services. For the full experience, use Docker Compose.

## Bazel build path

The repository also has a hermetic Bazel 9 build graph for the polyglot application. The wrapper uses an installed `bazelisk` or `bazel` first, bootstraps Bazelisk through `npx` when available, and retains an official-container fallback.

```bash
./bazelw build //...
./bazelw test //:unit_tests
./bazelw run //services/payments-go:payments_load
```

Docker Compose remains the deployment and operations lab; Bazel is the reproducible build, test, and packaging layer. See [`docs/bazel.md`](docs/bazel.md) for the target map, manual service commands, cache behavior, and CI guidance.

## Demo notes

- Domain records survive restarts in the PostgreSQL volume; carts survive in the Redis volume.
- Checkout simulates inventory and payment; it never contacts a real payment provider.
- Jaeger uses in-memory trace storage, intentionally suitable for this local lab rather than production retention.
- The Elastic overlay disables authentication and TLS for local learning only; it is not a production security configuration.
- Product photos are loaded from Unsplash.
