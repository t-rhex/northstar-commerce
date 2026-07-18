# Terraform state bootstrap

This root is intentionally separate because the S3 backend must exist before an environment can use it. It enables KMS encryption, versioning, public-access blocking, TLS-only access, and Terraform's native S3 lockfile. New projects should not add a DynamoDB lock table; that backend mechanism is deprecated.

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan -out bootstrap.tfplan
terraform apply bootstrap.tfplan
```

The bucket has `prevent_destroy`. Treat removing that guard as a reviewed recovery operation, never a routine lab cleanup step.
