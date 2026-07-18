# Bazel build and deployment lab

Northstar Commerce uses Bazel 9 with Bzlmod as a parallel, hermetic build path. Docker Compose remains the easiest way to run the complete topology, while Bazel demonstrates how enterprise monorepos compile, test, cache, and package multiple languages from one dependency graph.

## What is covered

| Capability | Bazel rule path | Primary target |
| --- | --- | --- |
| TanStack storefront | `aspect_rules_js` + Vite | `//apps/web:storefront` |
| Node.js services | `aspect_rules_js` | `//services/<name>:<name>` |
| Java inventory | `rules_java` + `rules_jvm_external` | `//services/inventory-java:inventory` |
| Go payments | `rules_go` + Gazelle dependencies | `//services/payments-go:payments` |
| Python analytics | `rules_python` + hashed pip lock | `//services/analytics-python:analytics` |
| OCI packaging | `rules_oci` + `rules_pkg` | `//services/payments-go:payments_image` |

The payment image is the reference OCI target because a pure Go binary can run in a scratch image. It is intentionally small and is a good starting point for labs on image promotion, signing, SBOMs, and Kubernetes delivery.

## Prerequisites

- Docker for the infrastructure and OCI loading exercises.
- Either Bazelisk, Bazel, or Node.js with `npx`. The `./bazelw` wrapper chooses them in that order.
- Network access on the first build so Bazel can populate its content-addressed cache.

All important versions are pinned in `.bazelversion`, `MODULE.bazel`, `MODULE.bazel.lock`, `maven_install.json`, `pnpm-lock.yaml`, and `services/analytics-python/requirements.lock.txt`.

## Build and test

```bash
# Discover targets without compiling them
./bazelw query //...

# Build the whole repository
./bazelw build //...

# Run the fast test suite
./bazelw test //:unit_tests

# Build individual language targets
./bazelw build //apps/web:storefront
./bazelw build //services/inventory-java:inventory
./bazelw build //services/payments-go:payments
./bazelw build //services/analytics-python:analytics
```

Equivalent npm shortcuts are `npm run bazel:build`, `npm run bazel:test`, and `npm run bazel:payments-image`.

## Run services manually

Start only shared infrastructure first:

```bash
docker compose up -d postgres redis rabbitmq otel-collector jaeger
```

Then use separate terminals for the service processes:

```bash
./bazelw run //services/catalog:catalog
./bazelw run //services/cart:cart
./bazelw run //services/orders:orders
./bazelw run //services/notifications:notifications
./bazelw run //services/inventory-java:inventory
./bazelw run //services/payments-go:payments
./bazelw run //services/analytics-python:analytics
./bazelw run //services/checkout:checkout
./bazelw run //services/gateway:gateway
```

The defaults use the same localhost ports documented in the main README. Override service URLs and credentials with environment variables to practice service discovery or replace one implementation.

The storefront output is produced under `bazel-bin/apps/web/storefront`. For normal hot-reload development, continue using `npm run dev`; Bazel's storefront target is the reproducible production build.

## Build and load the OCI image

```bash
./bazelw build //services/payments-go:payments_image
./bazelw run //services/payments-go:payments_load
docker image inspect northstar-commerce-payments:bazel
```

The reference image targets Linux amd64 so CI and deployment output does not depend on the developer laptop architecture.

## CI pattern

```bash
./bazelw test --config=ci //:unit_tests
./bazelw build --config=ci //...
```

Persist the Bazel output cache between CI jobs or configure a remote cache. In a real organization, add remote execution, provenance attestations, vulnerability scanning, image signing, and policy checks after the build targets are stable.

## Dependency updates

1. Change direct rule versions in `MODULE.bazel`, then run `./bazelw mod tidy`.
2. Change Java dependencies, then refresh the artifact lock with `REPIN=1 ./bazelw run @maven//:pin`. The generated filename is repository-name dependent; keep the checked-in path as `maven_install.json` and confirm `MODULE.bazel` still points to it.
3. Change JavaScript dependencies and regenerate `pnpm-lock.yaml` with the pinned package manager.
4. Change Python inputs in `requirements.txt`, then regenerate the hashed lock:

   ```bash
   docker run --rm -v "$PWD:/workspace" -w /workspace \
     ghcr.io/astral-sh/uv:python3.13-bookworm-slim \
     uv pip compile services/analytics-python/requirements.txt \
     --output-file services/analytics-python/requirements.lock.txt \
     --generate-hashes --python-version 3.13
   ```

5. Change `go.mod` or `go.sum`, then run `./bazelw mod tidy` to reconcile Gazelle repositories.

Commit lockfiles with dependency changes. Avoid floating rule, Maven, npm, pip, Go, or toolchain versions in CI.
