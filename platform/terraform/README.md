# AWS Terraform platform

The `bootstrap` root creates protected remote state. The `environments/dev` root creates a three-AZ VPC, private EKS cluster nodes, API-based access, core managed add-ons including Pod Identity, immutable ECR repositories, and an optional managed-data tier.

The Kubernetes API is private by default and Kubernetes Secrets use a rotating KMS key for envelope encryption. Reach the API through an approved VPN, Direct Connect, or SSM administration path. A learner may temporarily enable the CIDR-restricted public endpoint only after documenting the exception; `0.0.0.0/0` is rejected.

```bash
cd platform/terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
cp backend.hcl.example backend.hcl
terraform init -backend-config=backend.hcl
terraform fmt -check -recursive
terraform validate
terraform plan -out northstar.tfplan
terraform show northstar.tfplan
```

Managed data is off by default because RDS, ElastiCache, and a three-node Amazon MQ broker are billable. Enabling it requires secure `TF_VAR_cache_auth_token` and `TF_VAR_mq_password` inputs. The production exercise changes RDS to Multi-AZ, enables deletion protection/final snapshots, uses one NAT per AZ or VPC endpoints, and moves broker credential lifecycle behind an approved secrets workflow.

Before apply, query regional compatibility instead of guessing versions:

```bash
aws eks describe-addon-versions --kubernetes-version 1.36 --addon-name eks-pod-identity-agent
aws rds describe-db-engine-versions --engine postgres --query 'DBEngineVersions[-5:].EngineVersion'
aws mq describe-broker-engine-types --engine-type RabbitMQ
```
