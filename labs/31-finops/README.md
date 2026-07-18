# Lab 31: FinOps and capacity economics

## Outcome

Make cost visible per environment/service and improve it without silently reducing reliability.

## Work

Verify mandatory AWS tags and Kubernetes labels for owner, environment, service, cost center, and data classification. Use Cost Explorer/CUR plus Kubecost to allocate shared cluster, NAT, observability, and managed-data spend. Build a monthly showback report.

Optimize in order: right-size requests/instances, remove idle capacity/resources, then use Spot/Savings Plans or architectural changes. Compare one NAT versus three, self-managed versus managed observability, RDS/MQ uptime schedule for training, log retention/sampling, and Karpenter consolidation. State reliability and labor trade-offs for every saving.

## Evidence and gate

Submit forecast versus actual, unallocated-cost percentage, top five drivers, rightsizing proof, before/after monthly estimate, reliability review, and destroyed idle resources. Price-only optimization that violates SLO/DR/security requirements fails.

[EKS cost optimization](https://docs.aws.amazon.com/eks/latest/best-practices/cost-opt.html)
