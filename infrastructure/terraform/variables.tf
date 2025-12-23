# Variables for Vibe Platform Infrastructure
# Customize these values for your deployment

variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (production, staging, development)"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name for resource naming"
  type        = string
  default     = "vibe"
}

variable "container_registry" {
  description = "Container registry URL for pulling images"
  type        = string
  default     = "ghcr.io"
}

variable "repository_name" {
  description = "GitHub repository name"
  type        = string
  default     = "vibe-platform"
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 2
}

# EKS Configuration
variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.29"
}

variable "eks_node_instance_types" {
  description = "EC2 instance types for EKS worker nodes"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium", "m5.large"]
}

variable "eks_desired_capacity" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "eks_min_capacity" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 2
}

variable "eks_max_capacity" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 10
}

# Domain Configuration
variable "domain_name" {
  description = "Root domain name for the application"
  type        = string
  default     = "vibe.dev"
}

variable "subdomain_frontend" {
  description = "Frontend subdomain"
  type        = string
  default     = "www"
}

variable "subdomain_api" {
  description = "API subdomain"
  type        = string
  default     = "api"
}

# Enable/disable features
variable "enable_monitoring" {
  description = "Enable monitoring stack deployment"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "enable_drsnapshot" {
  description = "Enable cross-region disaster recovery snapshots"
  type        = bool
  default     = false
}

variable "dr_region" {
  description = "Disaster recovery region"
  type        = string
  default     = "us-west-2"
}
