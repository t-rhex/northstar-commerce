# Checkout availability SLO runbook

Owner: Commerce Platform. Page: `CheckoutAvailabilityFastBurn`. Ticket: `CheckoutAvailabilitySlowBurn`.

## Establish impact

1. Acknowledge and record alert start, environment, release digest, error ratio, traffic, and remaining budget.
2. Check synthetic checkout and gateway/checkout readiness. Do not restart everything.
3. Split failures by route/status/dependency without adding request IDs to metrics.

## Correlate

1. Open the checkout RED dashboard and queue/data dependency panels.
2. Select a failing trace and use its trace/request/checkout IDs in logs.
3. Check Argo Rollout/Argo CD history, Kubernetes events, EndpointSlices, HPA, nodes, RabbitMQ backlog, and managed-service events.

## Mitigate

- Bad canary: abort it and validate stable traffic/error rate.
- Saturation: scale the constrained stateless component within tested limits.
- Dependency incident: apply its approved failover/degradation runbook.
- Unknown/high impact: declare an incident and assign commander/comms/scribe.

## Validate and close

Confirm successful checkouts for 15 minutes, alert resolution, queue recovery, and no compensating-action backlog. Record timestamps, commands, digest, root-cause hypothesis, and follow-up owner/date. Never delete evidence or silence the alert without a bounded expiry.
