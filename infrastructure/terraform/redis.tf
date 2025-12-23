# ElastiCache Redis Module for Vibe Platform

module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  # Cluster identification
  cluster_id           = "${var.app_name}-redis-${var.environment}"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = "default.redis7.x"

  # Network configuration
  subnet_ids           = module.vpc.private_subnets
  security_group_ids   = [aws_security_group.redis.id]

  # Authentication
  auth_token           = random_password.redis_auth_token.result

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  # Automatic failover for multi-node clusters
  automatic_failover_enabled = var.redis_num_cache_nodes > 1

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
  }

  # Maintenance window
  maintenance_window = "sun:05:00-sun:06:00"

  # Snapshot configuration (for non-production environments)
  snapshot_retention_limit = var.environment == "production" ? 0 : 3
  snapshot_window          = "02:00-03:00"

  # Tags
  tags = {
    Name        = "${var.app_name}-redis-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Redis Authentication Token (randomly generated)
resource "random_password" "redis_auth_token" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}|"
}

# CloudWatch Log Group for Redis Logs
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${var.app_name}-redis-${var.environment}"
  retention_in_days = 30
  tags = {
    Name        = "${var.app_name}-redis-logs"
    Environment = var.environment
    Project     = var.app_name
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.app_name}-cache-subnet-group-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}
