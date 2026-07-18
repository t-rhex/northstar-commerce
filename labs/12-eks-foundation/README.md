# Lab 12: EKS foundation and identity

## Outcome

Create and administer an EKS cluster without legacy access or node-wide application permissions.

## Work

1. Query compatible versions: `aws eks describe-addon-versions --kubernetes-version 1.36`.
2. Review and apply the Terraform plan. Update kubeconfig from the Terraform output.
3. Verify control-plane logs, private node placement, system node group, and add-ons: VPC CNI, CoreDNS, kube-proxy, and `eks-pod-identity-agent`.
4. Inspect the platform-admin access entry and associated `AmazonEKSClusterAdminPolicy`. Add a namespace-scoped operator role as a second exercise.
5. Create a dedicated service account/IAM role and `aws_eks_pod_identity_association`; prove the pod receives only its allowed AWS action.
6. Upgrade planning exercise: read EKS upgrade insights, check deprecated APIs, and write the one-minor-at-a-time runbook without executing it.

## Evidence and gate

Submit cluster/add-on status, access entries, node AZs, authorization tests, and a denied AWS call. The cluster must not rely on `aws-auth`, wildcard node permissions, or a public API open to the world.

[EKS access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html) · [Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html)
