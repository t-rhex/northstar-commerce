# Lab 28: Backup, restore, and disaster recovery

## Outcome

Prove recovery—not merely backup creation—against declared RPO and RTO.

## Work

Define scope and consistency for Kubernetes objects, persistent volumes, RDS, Valkey, RabbitMQ, ECR, Git, Terraform state, dashboards, and secrets. Install a current compatible Velero/AWS plugin using Pod Identity and an S3 bucket in a separate failure boundary. Use node-agent/Kopia for new filesystem backups; do not teach deprecated Restic backup creation.

Create a Northstar backup, record restore instructions, delete the non-production namespace, and restore it. Separately restore PostgreSQL from snapshot/PITR to a new endpoint, run integrity queries, and update a recovery environment through secrets/GitOps. Measure actual RPO/RTO.

## Evidence and gate

Submit backup inventory, encryption/retention, restore logs, data checksums/counts, RPO/RTO, DNS/secret cutover, and cleanup of recovery resources. “Backup succeeded” without an isolated restore test fails.

[Velero AWS providers](https://velero.io/docs/v1.17/supported-providers/) · [AWS reliability guidance](https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html)
