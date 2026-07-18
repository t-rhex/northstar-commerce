# Lab 20: Blue-green release

## Outcome

Validate a complete preview revision, deliberately switch the active Service, and recover quickly.

## Work

Install a pinned Argo Rollouts controller/CLI and apply `platform/kubernetes/progressive-delivery/analysis-templates.yaml` plus `gateway-bluegreen.yaml` after replacing the digest. Observe active and preview ReplicaSets and Service selectors.

```bash
kubectl argo rollouts get rollout gateway -n northstar --watch
kubectl argo rollouts promote gateway -n northstar
kubectl argo rollouts abort gateway -n northstar
```

Send smoke traffic only to `gateway-preview`, inspect pre-promotion analysis, promote, then test the old revision's scale-down delay. Release a deliberately failing image, abort it, and prove active traffic remains stable. Use the rollback window for a fast rollback exercise.

## Evidence and gate

Submit Service selector changes, analysis result, active/preview traffic, promotion approval, abort, and rollback time. Do not claim ALB-backed blue-green guarantees zero downtime; the lab's active/preview Service model and delay reduce risk but clients, DNS, and controllers still matter.

[Argo Rollouts blue-green](https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/)
