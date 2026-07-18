# Lab 21: Canary release with automated analysis

## Outcome

Expose a new digest to increasing traffic only while its service-level indicators remain healthy.

## Work

Configure Argo Rollouts ALB traffic routing for stable/canary Services, then adapt `gateway-canary.yaml` to the controller-created Ingress. Begin at 5%, pause, evaluate success rate, advance to 25% and 50%, then require human approval. Without a traffic router, explain why replica ratios are coarse and unsuitable for precise low-volume percentages.

Inject latency or errors into the canary only. Verify the Prometheus AnalysisTemplate fails, the rollout aborts, and stable traffic returns to 100%. Repeat with a healthy digest and promote fully.

## Evidence and gate

Submit ALB weights over time, request distribution, analysis queries/results, abort timeline, stable error budget, final promotion, and cleanup of the failed ReplicaSet. Analysis must use enough traffic and a bounded failure limit; a single synthetic request is not a production gate.

[Argo Rollouts canary](https://argo-rollouts.readthedocs.io/en/stable/features/canary/) · [ALB traffic management](https://argo-rollouts.readthedocs.io/en/stable/features/traffic-management/alb/)
