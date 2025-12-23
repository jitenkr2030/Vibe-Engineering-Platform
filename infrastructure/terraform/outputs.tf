# Terraform outputs for Vibe Platform infrastructure

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

# EKS Outputs
output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "eks_cluster_ca_data" {
  description = "EKS cluster CA certificate data"
  value       = module.eks.cluster_certificate_authority_data
}

output "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = module.eks.oidc_provider_arn
}

output "eks_node_role_arn" {
  description = "EKS node role ARN"
  value       = aws_iam_role.eks_nodes.arn
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.database.rds_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.database.database_name
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.database.instance_id
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.elasticache_cluster_endpoint
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port"
  value       = module.redis.elasticache_cluster_port
}

# S3 Bucket Outputs
output "s3_bucket_id" {
  description = "S3 bucket ID for file storage"
  value       = module.s3_bucket.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3_bucket.arn
}

# ACM Certificate Outputs
output "acm_certificate_arn" {
  description = "ACM certificate ARN for TLS"
  value       = module.acm.certificate_arn
}

output "acm_certificate_domain" {
  description = "Domain name for ACM certificate"
  value       = var.domain_name
}

# Application URLs
output "frontend_url" {
  description = "Frontend application URL"
  value       = "https://${var.subdomain_frontend}.${var.domain_name}"
}

output "api_url" {
  description = "Backend API URL"
  value       = "https://${var.subdomain_api}.${var.domain_name}"
}

# Security Group Outputs
output "eks_node_security_group_id" {
  description = "EKS node security group ID"
  value       = aws_security_group.eks_nodes.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}

# Backup Outputs
output "backup_vault_arn" {
  description = "AWS Backup vault ARN"
  value       = module.backup.backup_vault_arn
}
