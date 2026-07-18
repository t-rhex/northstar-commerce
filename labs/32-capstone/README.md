# Lab 32: DevOps engineer capstone

## Mission

Operate Northstar as the platform owner through a production-shaped release, injected failure, recovery, and executive review. Complete without a step-by-step answer key.

## Required deliverables

1. Architecture diagram and ADR covering EKS, identity, network, delivery, data, telemetry, security, DR, and cost.
2. Reviewed Terraform plan with account/cost guards and no critical security findings.
3. Signed/scanned/SBOM-backed images promoted by digest through protected GitHub OIDC CI.
4. Argo CD reconciliation and a blue-green or canary release with automated analysis, approval, abort, and rollback evidence.
5. A successful checkout traced across languages, PostgreSQL, Valkey, RabbitMQ, logs, metrics, and traces.
6. SLO dashboard and burn alert with an owned runbook.
7. Policy, vulnerability, network, runtime, and secrets evidence.
8. Load/autoscaling and Spot-interruption evidence.
9. Successful isolated restore with measured RPO/RTO.
10. Instructor-selected FIS/incident scenario, customer updates, timeline, mitigation, and postmortem.
11. Cost/showback report and complete environment teardown.

## Assessment

- 20% safe infrastructure and identity
- 20% repeatable delivery and rollback
- 20% observability and diagnosis
- 15% security and supply chain
- 15% reliability, recovery, and incident command
- 10% cost, communication, and evidence quality

Automatic failure conditions: leaked credential, wrong-account apply, public data service, mutable production image, unreviewed production promotion, chaos without stop condition, false recovery claim, or abandoned billable resources.
