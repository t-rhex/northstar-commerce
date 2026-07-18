# Northstar enterprise DevOps curriculum plan

This plan turns Northstar Commerce into a job-oriented DevOps engineering lab. The learner operates one polyglot workload from laptop to AWS production, provides evidence at every gate, and finishes with a capstone incident and release.

## Phase 0: documentation discovery and allowed APIs

The implementation is grounded in current primary documentation reviewed on 2026-07-18.

Allowed platform APIs and patterns:

- Terraform `>= 1.11` with the AWS provider `~> 6.53`, an S3 backend, bucket versioning, KMS encryption, and `use_lockfile = true`.
- EKS Kubernetes `1.36` as the tested default, with the minor version configurable and add-on versions resolved at deploy time.
- EKS access entries for people and EKS Pod Identity for workloads. `API` is the preferred cluster authentication mode.
- Kubernetes `apps/v1`, `batch/v1`, `policy/v1`, `autoscaling/v2`, `networking.k8s.io/v1`, and Gateway API `gateway.networking.k8s.io/v1` after its CRDs are installed.
- Standalone Karpenter `karpenter.sh/v1 NodePool` with `karpenter.k8s.aws/v1 EC2NodeClass`.
- Helm 4 with `helm upgrade --install --rollback-on-failure --wait=watcher`.
- Argo CD `argoproj.io/v1alpha1 Application` and Argo Rollouts `argoproj.io/v1alpha1 Rollout`/`AnalysisTemplate`.
- External Secrets Operator `external-secrets.io/v1`, Kyverno Audit-to-Enforce promotion, Trivy Operator for continuous scanning, and Falco for runtime detection.
- OpenTelemetry as the application telemetry contract; ADOT, CloudWatch, AMP/Managed Grafana, and OpenSearch Ingestion are AWS implementations.

Primary references:

- [Terraform S3 backend and native state locking](https://developer.hashicorp.com/terraform/language/backend/s3)
- [HashiCorp EKS tutorial](https://developer.hashicorp.com/terraform/tutorials/kubernetes/eks)
- [EKS access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html)
- [EKS Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html)
- [AWS Load Balancer Controller](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)
- [Karpenter best practices](https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html)
- [Helm upgrade command](https://helm.sh/docs/helm/helm_upgrade/)
- [Argo CD automated sync](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)
- [Argo Rollouts blue-green](https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/)
- [Argo Rollouts canary](https://argo-rollouts.readthedocs.io/en/stable/features/canary/)
- [GitHub Actions OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [CloudWatch Observability EKS add-on](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/install-CloudWatch-Observability-EKS-addon.html)
- [EKS network policies](https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy.html)
- [AWS FIS EKS actions](https://docs.aws.amazon.com/fis/latest/userguide/eks-pod-actions.html)

Guards: do not add `aws-auth` as the normal access path, Karpenter `Provisioner`/`AWSNodeTemplate`, `autoscaling/v2beta2`, `external-secrets.io/v1beta1`, long-lived AWS CI keys, mutable `latest` deployments, plaintext secrets in Git or Terraform, DynamoDB state locks for new backends, public data services, or production chaos without a stop condition.

## Phase 1: workstation and local operations

What to implement: retain labs 01–08 and add preflight, evidence, cost, and safety conventions used by every cloud lab.

Verification: the local checkout, queue, PostgreSQL, Redis, traces, and ELK correlation labs pass; learners produce an evidence bundle.

## Phase 2: AWS foundation with Terraform

What to implement: bootstrap remote state; create a three-AZ VPC, private EKS nodes, EKS access entries, Pod Identity add-on, ECR repositories, and optional managed PostgreSQL, Valkey, and RabbitMQ.

Documentation patterns: copy the backend lockfile pattern from the Terraform S3 backend documentation and EKS cluster flow from the HashiCorp EKS tutorial. Query compatible EKS add-on and engine versions instead of guessing them.

Verification: `terraform fmt -check`, `terraform validate`, plan review, AWS caller/account guard, private endpoint checks, and a mandatory destroy plan.

## Phase 3: Kubernetes platform and delivery

What to implement: a Helm chart with requests/limits, separate readiness/liveness/startup probes, PDBs, HPAs, topology spread, service accounts, and default-deny network policy; Argo CD desired state; GitHub OIDC; digest promotion; blue-green and canary Rollouts.

Documentation patterns: Helm 4 upgrade reference, Argo CD config-repository flow, Argo Rollouts examples, and GitHub/AWS OIDC trust conditions.

Verification: Helm lint/render/test, server-side dry run, rollout preview/promotion/abort, canary analysis, Git history proving promotion, and no cluster credential in CI.

## Phase 4: data, observability, and security

What to implement: managed-service adapters and migrations, External Secrets, ADOT, CloudWatch/AMP/Grafana/OpenSearch tracks, SLO burn alerts, Kyverno, Trivy, Falco, and EKS VPC CNI network policy.

Verification: restore data, rotate a secret, follow one transaction across signals, trigger and resolve an SLO alert, prove a policy blocks a bad workload, and capture a runtime alert.

## Phase 5: reliability, recovery, and economics

What to implement: HPA and Karpenter, Spot interruption handling, Velero plus managed-data recovery, FIS experiments with CloudWatch stop conditions, incident command artifacts, budgets, and cost allocation.

Verification: measured scaling, RPO/RTO evidence, controlled blast radius, MTTD/MTTA/MTTR timeline, cost report, and a clean teardown.

## Phase 6: capstone verification

The learner receives a new image digest and a production incident. They must plan infrastructure, promote through GitOps, execute blue-green or canary delivery, diagnose with telemetry, mitigate or roll back, communicate, write a blameless postmortem, prove recovery, report cost, and destroy the ephemeral environment.

Final checks: run repository tests, Terraform validation, Helm lint/render, Kubernetes schema/policy checks, secret scanning, image scanning, and link validation. Every learner submits commands, outputs, screenshots or exported dashboards, decisions, rollback evidence, and a cost/cleanup record.
