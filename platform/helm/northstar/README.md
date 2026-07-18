# Northstar Helm chart

The chart deploys every service by immutable digest with restricted pod security, requests and limits, startup/readiness/liveness probes, topology spread, rolling-update safety, PDBs, optional HPA, default-deny networking, and a Helm test.

```bash
helm lint . --set global.imageDigest=sha256:$(printf '0%.0s' {1..64})
helm template northstar . --namespace northstar --set global.imageDigest=sha256:$(printf '0%.0s' {1..64})
helm upgrade --install northstar . --namespace northstar --create-namespace \
  --set global.registry="$ECR_REGISTRY/northstar" \
  --set global.imageDigest="$IMAGE_DIGEST" \
  --rollback-on-failure --wait=watcher --wait-for-jobs --timeout 10m
helm test northstar --logs
```

Helm 4 removed the old `--atomic` teaching path; this chart's labs use `--rollback-on-failure`. Production should use per-service digests rather than the single curriculum-wide digest value.

Set per-service values such as `services.gateway.digest=sha256:...` during independent promotion. `global.imageDigest` exists only to make full-stack classroom rendering and coordinated releases convenient.
