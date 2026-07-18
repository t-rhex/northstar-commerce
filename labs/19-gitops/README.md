# Lab 19: Argo CD GitOps reconciliation

## Outcome

Make Git the reviewed desired-state interface while Argo CD—not CI—owns cluster reconciliation.

## Work

Install a pinned Argo CD release, create the Northstar `AppProject`, and replace the placeholders in `platform/gitops/argocd/northstar-dev.yaml`. Use a separate config repository or clearly separated environment path. Enable auto-sync, prune, self-heal, `allowEmpty:false`, namespace creation, and prune-last.

Promote an image digest through a pull request. Observe commit → reconciliation → health. Manually change a replica count, record drift, and watch self-heal. Add a protected annotation requiring deletion confirmation for critical resources. Practice a Git revert as the normal rollback path.

## Evidence and gate

Submit Application status/history, promotion commit, drift event, self-heal, rollback commit, and RBAC denial for a read-only developer. Explain why selective sync skips hooks and why automated sync changes rollback behavior.

[Argo CD auto-sync](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/) · [CI automation model](https://argo-cd.readthedocs.io/en/latest/user-guide/ci_automation/)
