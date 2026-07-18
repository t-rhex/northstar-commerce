data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" { state = "available" }

locals {
  name     = "northstar-${var.environment}"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
  az_map   = { for index, az in local.azs : az => index }
  services = toset(["web", "gateway", "catalog", "cart", "checkout", "orders", "notifications", "inventory", "payments", "analytics"])
}

resource "terraform_data" "account_guard" {
  lifecycle {
    precondition {
      condition     = data.aws_caller_identity.current.account_id == var.expected_account_id
      error_message = "Authenticated AWS account does not match expected_account_id."
    }
    precondition {
      condition     = !contains(var.allowed_api_cidrs, "0.0.0.0/0")
      error_message = "The EKS API must not be exposed to 0.0.0.0/0."
    }
    precondition {
      condition     = !var.enable_managed_data || (var.cache_auth_token != null && var.mq_password != null)
      error_message = "Managed data requires cache_auth_token and mq_password through secure TF_VAR inputs."
    }
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = local.name }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = local.name }
}

resource "aws_subnet" "public" {
  for_each                = local.az_map
  vpc_id                  = aws_vpc.main.id
  availability_zone       = each.key
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 4, each.value)
  map_public_ip_on_launch = false
  tags                    = { Name = "${local.name}-public-${each.key}", "kubernetes.io/role/elb" = "1" }
}

resource "aws_subnet" "private" {
  for_each          = local.az_map
  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 4, each.value + 3)
  tags              = { Name = "${local.name}-private-${each.key}", "kubernetes.io/role/internal-elb" = "1" }
}

resource "aws_subnet" "data" {
  for_each          = local.az_map
  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 4, each.value + 6)
  tags              = { Name = "${local.name}-data-${each.key}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${local.name}-public" }
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  for_each   = var.single_nat_gateway ? { shared = 0 } : local.az_map
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  for_each      = var.single_nat_gateway ? { shared = 0 } : local.az_map
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = var.single_nat_gateway ? values(aws_subnet.public)[0].id : aws_subnet.public[each.key].id
  depends_on    = [aws_route_table_association.public]
  tags          = { Name = "${local.name}-nat-${each.key}" }
}

resource "aws_route_table" "private" {
  for_each = local.az_map
  vpc_id   = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main["shared"].id : aws_nat_gateway.main[each.key].id
  }
  tags = { Name = "${local.name}-private-${each.key}" }
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

resource "aws_route_table" "data" {
  for_each = local.az_map
  vpc_id   = aws_vpc.main.id
  tags     = { Name = "${local.name}-data-${each.key}" }
}

resource "aws_route_table_association" "data" {
  for_each       = aws_subnet.data
  subnet_id      = each.value.id
  route_table_id = aws_route_table.data[each.key].id
}

data "aws_iam_policy_document" "eks_cluster_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_cluster" {
  name               = "${local.name}-cluster"
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_assume.json
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_kms_key" "eks_secrets" {
  description             = "${local.name} Kubernetes secret envelope encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "eks_secrets" {
  name          = "alias/${local.name}-eks-secrets"
  target_key_id = aws_kms_key.eks_secrets.key_id
}

resource "aws_eks_cluster" "main" {
  name                          = local.name
  role_arn                      = aws_iam_role.eks_cluster.arn
  version                       = var.cluster_version
  enabled_cluster_log_types     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  bootstrap_self_managed_addons = false

  access_config {
    authentication_mode                         = "API"
    bootstrap_cluster_creator_admin_permissions = false
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_secrets.arn
    }
    resources = ["secrets"]
  }

  vpc_config {
    subnet_ids              = values(aws_subnet.private)[*].id
    endpoint_private_access = true
    endpoint_public_access  = var.enable_public_cluster_endpoint
    public_access_cidrs     = var.allowed_api_cidrs
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster, terraform_data.account_guard]
}

resource "aws_eks_access_entry" "platform_admin" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = var.platform_admin_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "platform_admin" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = var.platform_admin_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  access_scope { type = "cluster" }
}

data "aws_iam_policy_document" "eks_node_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_node" {
  name               = "${local.name}-node"
  assume_role_policy = data.aws_iam_policy_document.eks_node_assume.json
}

resource "aws_iam_role_policy_attachment" "eks_node" {
  for_each   = toset(["AmazonEKSWorkerNodePolicy", "AmazonEC2ContainerRegistryPullOnly", "AmazonEKS_CNI_Policy", "AmazonSSMManagedInstanceCore"])
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/${each.value}"
}

resource "aws_eks_addon" "networking" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"
}

resource "aws_eks_addon" "post_compute" {
  for_each                    = toset(["kube-proxy", "coredns", "eks-pod-identity-agent"])
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = each.value
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"
  depends_on                  = [aws_eks_node_group.system]
}

resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = values(aws_subnet.private)[*].id
  instance_types  = ["m7i.large"]
  capacity_type   = "ON_DEMAND"

  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 4
  }
  update_config { max_unavailable_percentage = 25 }
  labels = { workload = "system" }

  depends_on = [aws_iam_role_policy_attachment.eks_node, aws_eks_addon.networking]
}

resource "aws_ecr_repository" "service" {
  for_each             = local.services
  name                 = "northstar/${each.key}"
  image_tag_mutability = "IMMUTABLE"
  encryption_configuration { encryption_type = "AES256" }
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_lifecycle_policy" "service" {
  for_each   = aws_ecr_repository.service
  repository = each.value.name
  policy     = jsonencode({ rules = [{ rulePriority = 1, description = "Retain 30 release images", selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }, action = { type = "expire" } }] })
}

resource "aws_security_group" "data" {
  name        = "${local.name}-data"
  description = "Managed data access from the VPC; narrow to pod security groups in the advanced lab."
  vpc_id      = aws_vpc.main.id
  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  ingress {
    description = "Valkey TLS"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  ingress {
    description = "AMQPS"
    from_port   = 5671
    to_port     = 5671
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
}

resource "aws_db_subnet_group" "main" {
  count      = var.enable_managed_data ? 1 : 0
  name       = local.name
  subnet_ids = values(aws_subnet.data)[*].id
}

resource "aws_db_instance" "postgres" {
  count                       = var.enable_managed_data ? 1 : 0
  identifier                  = "${local.name}-postgres"
  engine                      = "postgres"
  instance_class              = "db.t4g.medium"
  allocated_storage           = 30
  max_allocated_storage       = 100
  storage_encrypted           = true
  db_name                     = var.database_name
  username                    = var.database_username
  manage_master_user_password = true
  db_subnet_group_name        = aws_db_subnet_group.main[0].name
  vpc_security_group_ids      = [aws_security_group.data.id]
  publicly_accessible         = false
  multi_az                    = false
  backup_retention_period     = 7
  deletion_protection         = false
  skip_final_snapshot         = true
  apply_immediately           = true
}

resource "aws_elasticache_subnet_group" "main" {
  count      = var.enable_managed_data ? 1 : 0
  name       = local.name
  subnet_ids = values(aws_subnet.data)[*].id
}

resource "aws_elasticache_replication_group" "valkey" {
  count                      = var.enable_managed_data ? 1 : 0
  replication_group_id       = "${local.name}-valkey"
  description                = "Northstar carts"
  engine                     = "valkey"
  node_type                  = "cache.t4g.small"
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  transit_encryption_mode    = "required"
  auth_token                 = var.cache_auth_token
  subnet_group_name          = aws_elasticache_subnet_group.main[0].name
  security_group_ids         = [aws_security_group.data.id]
  apply_immediately          = true
}

resource "aws_mq_broker" "rabbitmq" {
  count                      = var.enable_managed_data ? 1 : 0
  broker_name                = "${local.name}-rabbitmq"
  engine_type                = "RabbitMQ"
  engine_version             = "4.2"
  host_instance_type         = "mq.m7g.medium"
  deployment_mode            = "CLUSTER_MULTI_AZ"
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  security_groups            = [aws_security_group.data.id]
  subnet_ids                 = values(aws_subnet.data)[*].id
  user {
    username = var.mq_username
    password = var.mq_password
  }
  logs { general = true }
}

resource "aws_budgets_budget" "lab" {
  count        = var.budget_email == null ? 0 : 1
  name         = "${local.name}-monthly"
  budget_type  = "COST"
  limit_amount = "80"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_email]
  }
}
