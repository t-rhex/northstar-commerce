# Lab 14: Production Kubernetes workload controls

## Outcome

Render, deploy, and explain the Kubernetes controls that make a service operable during failure and maintenance.

## Work

```bash
helm lint platform/helm/northstar --set global.imageDigest="$IMAGE_DIGEST"
helm template northstar platform/helm/northstar -f platform/helm/northstar/values-dev.yaml \
  --namespace northstar --set global.imageDigest="$IMAGE_DIGEST" > /tmp/northstar.yaml
kubectl apply --server-side --dry-run=server -f /tmp/northstar.yaml
```

Deploy with Helm 4 `--rollback-on-failure --wait=watcher --wait-for-jobs`, then run `helm test`. Explain startup vs readiness vs liveness, why liveness does not check PostgreSQL, requests/limits, rollout surge, termination grace, PDB eviction behavior, topology spread, restricted pod security, and HPA prerequisites.

Drain one node and observe placement/availability. Break readiness and prove traffic stops before the process is restarted.

## Evidence and gate

Submit rendered manifests, rollout/test output, drain timeline, EndpointSlice change, and resource utilization. Do not use `--atomic`, beta APIs, empty PDB selectors, or containers without requests.

[Kubernetes probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/) · [Helm upgrade](https://helm.sh/docs/helm/helm_upgrade/)
