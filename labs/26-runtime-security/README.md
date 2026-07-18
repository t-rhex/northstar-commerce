# Lab 26: Vulnerability, network, and runtime security

## Outcome

Layer build-time scanning, admission posture, network isolation, runtime detection, and incident triage.

## Work

Install Trivy Operator and review `VulnerabilityReport`/`ConfigAuditReport`; use CLI scanning in CI but treat `trivy k8s` as experimental. Enable EKS VPC CNI NetworkPolicy support, apply default deny, then explicitly allow DNS, gateway-to-services, service dependencies, managed data ports, and telemetry. Prove both source egress and destination ingress rules matter.

Install Falco through a pinned Helm release, document why its DaemonSet is privileged, and trigger a safe shell/file-write rule in a disposable pod. Compare Falco with GuardDuty EKS runtime monitoring. Trace alert → pod identity → image digest → owning deployment → response.

## Evidence and gate

Submit scan triage, allowed/denied connectivity matrix, Falco event, investigation timeline, and least-privilege exceptions. NetworkPolicy without an enabled enforcement engine, image-only scanning, or untriaged runtime alerts fail.

[Trivy Operator](https://aquasecurity.github.io/trivy-operator/latest/) · [Falco Kubernetes setup](https://falco.org/docs/setup/kubernetes/) · [EKS network policies](https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy.html)
