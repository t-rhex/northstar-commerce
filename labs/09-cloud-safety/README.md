# Lab 09: AWS safety, identity, and evidence

## Outcome

Prove which identity, account, Region, and budget boundary you will use before creating billable resources.

## Work

1. Configure AWS IAM Identity Center or another short-lived role session; do not create IAM user access keys.
2. Run `./scripts/devops-preflight --aws` and record the caller ARN/account.
3. Set `expected_account_id`, an explicit Region, your `/32` API CIDR, required owner/cost-center tags, and a budget email in `platform/terraform/environments/dev/terraform.tfvars`.
4. Create an AWS Budget before EKS. Configure alerts at 50%, 80%, and 100% of your approved amount; the supplied Terraform creates the 80% forecast alert.
5. Write an access matrix for learner, CI build role, GitOps controller, break-glass admin, and FIS experiment role. Apply least privilege and an expiry date.

## Evidence and gate

Submit sanitized `aws sts get-caller-identity`, Region, budget screenshot, access matrix, and estimated maximum spend. Stop if the account does not match or the API CIDR is `0.0.0.0/0`.

## Cleanup

Sign out of the role and confirm no long-lived credentials were written to `.env`, Terraform files, or Git.
