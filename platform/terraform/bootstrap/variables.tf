variable "aws_region" {
  description = "AWS Region for the remote-state resources."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name."
  type        = string
}

variable "force_destroy" {
  description = "Lab-only escape hatch. Production state buckets must remain protected."
  type        = bool
  default     = false
}
