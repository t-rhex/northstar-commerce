# Lab 25: Policy as code with Kyverno

## Outcome

Introduce admission controls without surprising teams or blocking emergency recovery.

## Work

Install a pinned Kyverno release and apply policies in Audit mode: require ownership/environment labels, immutable digests, resource requests/limits, non-root/read-only containers, approved registries, and prohibited privileged/host access. Inspect `PolicyReport`/`ClusterPolicyReport`, remediate the chart, document exemptions with owner/expiry, then promote one policy to Enforce.

Attempt a mutable image and privileged pod. Capture admission denial and Kyverno metrics/events. Define break-glass authorization and audit requirements. Remember reports describe current resources, not a durable history of every blocked request.

## Evidence and gate

Submit policy tests, audit inventory before/after, exemption register, enforced denial, controller availability plan, and rollback. A direct Audit→Enforce jump without measuring violations fails.

[Kyverno validate rules](https://kyverno.io/docs/policy-types/cluster-policy/validate/) · [Policy reports](https://kyverno.io/docs/guides/reports/)
