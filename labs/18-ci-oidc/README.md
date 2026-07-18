# Lab 18: CI with GitHub OIDC and protected environments

## Outcome

Build and publish a release without stored AWS keys or direct production cluster credentials.

## Work

Review `.github/workflows/ci.yaml` and `release.yaml`. Create separate least-privilege build and promotion roles. Configure GitHub's OIDC provider with audience `sts.amazonaws.com`; scope the trust `sub` to the repository/branch or protected environment. Inspect your repository's current immutable versus legacy subject claim before writing trust conditions.

Run lint, typecheck, unit/integration tests, Bazel build, Terraform/Helm validation, Trivy, SBOM, image push, and attestation. The workflow must record the image digest and update desired state through a reviewed config-repository change. Protect production with reviewers, branch rules, no self-review, and deployment concurrency.

## Evidence and gate

Submit sanitized OIDC claims, IAM trust, failed unauthorized-branch assumption, workflow run, scan/SBOM/attestation, digest, and promotion PR. No AWS key secret, `AdministratorAccess`, wildcard repository trust, or `kubectl apply` from CI passes.

[GitHub OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
