# Lab 30: Enterprise incident response

## Outcome

Coordinate people, evidence, mitigation, communication, and learning during a realistic checkout incident.

## Scenario

A canary raises the checkout burn alert while RabbitMQ lag grows and payment latency increases. The instructor withholds the root cause.

## Work

Declare severity and roles: incident commander, operations lead, communications lead, and scribe. Open the timeline, establish customer impact, preserve evidence, and follow the checkout SLO playbook. Correlate dashboards, logs, traces, Kubernetes events, rollout state, queue state, and recent changes. Choose mitigation—abort canary, scale consumers, fail over, or disable a feature—then validate recovery.

Publish time-boxed internal/customer updates without speculation. Calculate MTTD, MTTA, mitigation time, and MTTR. Within 48 hours write a blameless postmortem with contributing conditions, what worked, where detection failed, owners/dates for actions, and a recurrence test.

## Evidence and gate

Submit timeline, commands, decision log, communications, recovery validation, postmortem, and tracked actions. Unowned actions or system changes made before evidence capture lose points.

[AWS incident-response preparation](https://docs.aws.amazon.com/whitepapers/latest/aws-security-incident-response-guide/preparation.html)
