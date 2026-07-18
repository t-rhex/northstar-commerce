# Lab 16: Secret delivery and rotation

## Outcome

Deliver and rotate secrets without committing them, exposing them in plans, or granting every pod the node role.

## Work

Install External Secrets Operator with a dedicated Pod Identity association. Create a namespace-scoped `SecretStore` and `external-secrets.io/v1 ExternalSecret` for Northstar runtime connection values. Limit IAM to exact Secrets Manager ARNs. Compare this synchronization model with AWS Secrets and Configuration Provider/Secrets Store CSI mounted files.

Rotate one non-production credential. Observe refresh, restart/reload behavior, connection draining, and old-credential revocation. Record the recovery path if rotation breaks readiness.

## Evidence and gate

Submit the IAM policy, Pod Identity association, sanitized ExternalSecret status, rotation timeline, and a repository scan proving no secret value appears. Explain why Kubernetes Secret base64 is encoding rather than encryption.

Use one role per workload. Disable service-account token mounting when Kubernetes API access is unnecessary. Do not use static keys, broad `secretsmanager:*`, old `external-secrets.io/v1beta1`, or plaintext Helm values.

[External Secrets AWS provider](https://external-secrets.io/latest/provider/aws-access/) · [AWS Secrets Store CSI](https://docs.aws.amazon.com/eks/latest/userguide/manage-secrets.html)
