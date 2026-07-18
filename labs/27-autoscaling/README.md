# Lab 27: Application and node autoscaling

## Outcome

Scale capacity from service demand through pods to EC2 while preserving availability and controlling cost.

## Work

Install Metrics Server and validate requests. Load-test gateway to exercise its `autoscaling/v2` HPA, including scale-up and 300-second scale-down stabilization. Add a queue-depth custom metric for notifications and calculate target messages per replica.

Install standalone Karpenter while retaining a small managed system node group. Use `karpenter.sh/v1 NodePool` and `karpenter.k8s.aws/v1 EC2NodeClass`, with mutually exclusive system/on-demand and application/Spot pools, diverse instance types/AZs, disruption budgets, and resource ceilings. Trigger pending pods, observe node provisioning, then simulate Spot interruption.

## Evidence and gate

Submit load profile, HPA recommendations, replica/node timeline, Karpenter decisions, PDB behavior, interruption recovery, and cost delta. HPA without requests/metrics, overlapping NodePools, unlimited NodePools, or Spot-only quorum state does not pass.

[HPA behavior](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) · [Karpenter guidance](https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html)
