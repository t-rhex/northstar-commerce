# Lab 10: Terraform state as production data

## Outcome

Bootstrap encrypted, versioned, lockable remote state and practice recovery without editing state manually.

## Work

```bash
cd platform/terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan -out bootstrap.tfplan
terraform apply bootstrap.tfplan
```

Inspect KMS rotation, S3 public-access blocks, TLS-only policy, versioning, and the `.tflock` behavior produced by `use_lockfile = true`. Initialize the dev root with `-backend-config=backend.hcl`. Start a plan in one terminal and prove a concurrent state-writing operation locks.

Simulate recovery by listing state-object versions and documenting how an approved operator would restore a previous version. Do not run `terraform state push` in the exercise.

## Evidence and gate

Submit backend controls, a lock-contention result, recovery procedure, and proof that state/plan files are absent from Git. New backends must not use deprecated DynamoDB locking.

## Cleanup

Keep the protected backend for later labs. Destroy it only after every environment is gone and after removing `prevent_destroy` through review.

[Official S3 backend guidance](https://developer.hashicorp.com/terraform/language/backend/s3)
