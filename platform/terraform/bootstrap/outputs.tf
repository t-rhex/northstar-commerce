output "backend_configuration" {
  value = {
    bucket       = aws_s3_bucket.terraform_state.id
    region       = var.aws_region
    kms_key_id   = aws_kms_key.terraform_state.arn
    use_lockfile = true
    encrypt      = true
    account_id   = data.aws_caller_identity.current.account_id
  }
}
