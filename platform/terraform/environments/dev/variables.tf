variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "cost_center" {
  type    = string
  default = "training"
}

variable "cluster_version" {
  type    = string
  default = "1.36"
}

variable "platform_admin_arn" {
  description = "IAM role ARN granted EKS cluster-admin through an access entry."
  type        = string
}

variable "allowed_api_cidrs" {
  description = "CIDRs allowed to reach the public EKS API. Use a VPN/corporate egress range, never 0.0.0.0/0."
  type        = list(string)
}

variable "enable_public_cluster_endpoint" {
  description = "Lab-only access path. Prefer VPN/SSM access to the private endpoint."
  type        = bool
  default     = false
}

variable "single_nat_gateway" {
  description = "Cheaper dev mode. Set false to exercise one NAT gateway per AZ."
  type        = bool
  default     = true
}

variable "enable_managed_data" {
  description = "Creates billable RDS, ElastiCache, and Amazon MQ resources."
  type        = bool
  default     = false
}

variable "database_name" {
  type    = string
  default = "northstar"
}

variable "database_username" {
  type    = string
  default = "northstar"
}

variable "cache_auth_token" {
  description = "At least 16 characters; provide through a secure TF_VAR source."
  type        = string
  sensitive   = true
  default     = null
}

variable "mq_username" {
  type    = string
  default = "northstar"
}

variable "mq_password" {
  description = "Provide through a secure TF_VAR source; Amazon MQ user values are stored in Terraform state."
  type        = string
  sensitive   = true
  default     = null
}

variable "budget_email" {
  description = "Optional address for an $80 monthly lab-budget alert."
  type        = string
  default     = null
}

variable "expected_account_id" {
  description = "Hard guard preventing deployment to the wrong AWS account."
  type        = string
}
