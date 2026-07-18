# Lab 11: Three-AZ AWS network

## Outcome

Explain traffic paths and failure boundaries for public edge, private compute, and isolated data services.

## Work

Run `terraform plan` for the dev environment and draw the resulting VPC: three public subnets, three private EKS subnets, and three isolated data subnets. Public subnets host ALB/NAT, private subnets host nodes/pods, and data subnets host RDS/Valkey/MQ. Verify explicit route-table associations and ELB discovery tags.

Compare `single_nat_gateway=true` dev cost mode with one NAT per AZ. Calculate the availability and cross-AZ trade-off. Identify VPC endpoints that could reduce NAT dependency for ECR API/DKR, S3, STS, CloudWatch, and Secrets Manager.

## Failure drill

Model loss of one NAT/AZ. State which workloads lose egress and which continue. Do not test by deleting production routes.

## Evidence and gate

Submit diagram, route table output, subnet tags, flow explanation, NAT cost comparison, and a plan containing no public node/data subnet placement.

[AWS EKS VPC guidance](https://docs.aws.amazon.com/eks/latest/userguide/creating-a-vpc.html)
