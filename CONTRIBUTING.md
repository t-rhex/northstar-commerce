# Contributing to Northstar Commerce

Northstar is an educational, production-shaped system. Changes should preserve the application's ability to teach operations across local Compose, Bazel, Kubernetes, and AWS paths.

## Development checks

```bash
npm ci
npm run typecheck
npm run build
npm test
npm run devops:validate
./bazelw test //:unit_tests
```

Infrastructure changes must also pass Terraform validation, Helm rendering, and a Trivy configuration scan. Do not apply contributor branches to a shared AWS account.

## Pull requests

- Describe user or learner impact and the rollback path.
- Update the relevant lab, contract, runbook, or ADR.
- Use immutable image digests in deployment examples.
- Never commit credentials, kubeconfigs, state, plans, evidence bundles, or real account/domain identifiers.
- Call out billable resources and include teardown instructions.
- Keep examples current with primary vendor documentation and pin compatible tool/provider versions.

Security-sensitive changes require CODEOWNER review. Public examples must use placeholders or documentation-only credentials.
