# RDS PostgreSQL Database Module for Vibe Platform

module "database" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.app_name}-postgres-${var.environment}"

  # Engine configuration
  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage

  # Database name and credentials
  db_name  = lower(var.app_name)
  username = "vibe_admin"
  password = random_password.db_password.result

  # Multi-AZ deployment for high availability
  multi_az               = var.environment == "production"
  availability_zone      = "${var.aws_region}a"
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.app_name}-final-snapshot-${var.environment}"

  # Backup configuration
  backup_retention_period = var.db_backup_retention_period
  backup_window          = "02:00-03:00"
  preferred_backup_window = "02:00-03:00"

  # Maintenance window
  maintenance_window      = "sun:04:00-sun:05:00"
  auto_minor_version_upgrade = true

  # Storage configuration
  storage_type            = "gp3"
  iops                    = 3000
  storage_encrypted       = true
  delete_automated_backups = false

  # Networking
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name

  # Performance insights
  enable_performance_insights = true
  performance_insights_retention_period = 7
  performance_insights_kms_key_id = aws_kms_key.rds_key.arn

  # Monitoring
  monitoring_interval    = 60
  monitoring_role_arn    = aws_iam_role.rds_monitoring.arn

  # Tags
  tags = {
    Name        = "${var.app_name}-rds-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Database Password (randomly generated)
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}|"
}

# RDS Monitoring IAM Role
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.app_name}-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"]

  tags = {
    Name        = "${var.app_name}-rds-monitoring-role"
    Environment = var.environment
    Project     = var.app_name
  }
}

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption"
  key_usage               = "ENCRYPT_DECRYPT"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies for key management"
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:TagResource",
          "kms:UntagResource"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-rds-kms-key"
    Environment = var.environment
    Project     = var.app_name
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group-${var.environment}"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "${var.app_name}-db-subnet-group"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Get current AWS account
data "aws_caller_identity" "current" {}
