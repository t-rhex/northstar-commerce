output "cluster_name" { value = aws_eks_cluster.main.name }
output "configure_kubectl" { value = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}" }
output "ecr_repositories" { value = { for name, repo in aws_ecr_repository.service : name => repo.repository_url } }
output "rds_secret_arn" { value = var.enable_managed_data ? aws_db_instance.postgres[0].master_user_secret[0].secret_arn : null }
output "valkey_endpoint" { value = var.enable_managed_data ? aws_elasticache_replication_group.valkey[0].primary_endpoint_address : null }
output "rabbitmq_endpoints" { value = var.enable_managed_data ? aws_mq_broker.rabbitmq[0].instances[0].endpoints : [] }
output "cost_warning" { value = var.enable_managed_data ? "Managed data is enabled. Destroy promptly after the labs." : "Managed data is disabled." }
