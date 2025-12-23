# Backup and Disaster Recovery Module for Vibe Platform

module "backup" {
  source  = "terraform-aws-modules/backup-plan/aws"
  version = "~> 1.0"

  count = var.enable_backup ? 1 : 0

  # Backup plan configuration
  backup_plan = {
    name = "${var.app_name}-backup-plan-${var.environment}"

    rules = {
      daily = {
        name             = "daily-backup"
        schedule         = "cron(0 5 ? * * *)"  # 5 AM UTC
        target_vault_name = "${var.app_name}-backup-vault-${var.environment}"
        start_window     = 60
        completion_window = 360

        # Lifecycle - transition to cold storage
        cold_storage_after = 30
        delete_after       = 90

        # Recovery point objective
        recovery_point_tags = {
          Environment = var.environment
          Project     = var.app_name
        }
      }

      monthly = {
        name             = "monthly-backup"
        schedule         = "cron(0 6 1 * ? *)"  # 6 AM UTC on 1st of month
        target_vault_name = "${var.app_name}-backup-vault-${var.environment}"
        start_window     = 60
        completion_window = 360

        cold_storage_after = 90
        delete_after       = 365

        recovery_point_tags = {
          Frequency  = "monthly"
          Environment = var.environment
          Project     = var.app_name
        }
      }
    }
  }

  # Backup vault configuration
  backup_vault = {
    name        = "${var.app_name}-backup-vault-${var.environment}"
    kms_key_arn = aws_kms_key.backup_key.arn

    # Access policy - restrict to account only
    access_policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Sid    = "AllowBackupOps"
          Effect = "Allow"
          Principal = {
            AWS = "*"
          }
          Action = [
            "backup:DescribeBackupVault",
            "backup:ListRecoveryPointsByBackupVault",
            "backup:ListBackupPlans",
            "backup:DescribeRecoveryPoint"
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
  }

  # Resources to backup
  selection = {
    name = "${var.app_name}-backup-selection-${var.environment}"

    # Tag-based selection
    selection_tag {
      type  = "STRINGEQUALS"
      key   = "Backup"
      value = "true"
    }

    # Include specific resources by ID
    resources = [
      module.database.rds_instance_arn,
      module.s3_bucket.arn
    ]
  }

  tags = {
    Name        = "${var.app_name}-backup-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Backup KMS Key
resource "aws_kms_key" "backup_key" {
  description             = "KMS key for backup encryption"
  key_usage               = "ENCRYPT_DECRYPT"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Backup service access"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext"
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
    Name        = "${var.app_name}-backup-kms-key"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Cross-Region Replication for Disaster Recovery (optional)
resource "aws_backup_plan" "dr_replication" {
  count = var.enable_drsnapshot ? 1 : 0

  name = "${var.app_name}-dr-replication-plan-${var.environment}"

  rule {
    name             = "replicate-to-dr"
    schedule         = "cron(0 6 ? * * *)"  # 6 AM UTC daily
    target_vault_name = "${var.app_name}-backup-vault-${var.environment}"

    # Replication configuration
    copy_action {
      destination_vault_arn = "arn:aws:backup:${var.dr_region}:${data.aws_caller_identity.current.account_id}:backup-vault:${var.app_name}-backup-vault-${var.environment}"

      lifecycle {
        cold_storage_after = 30
        delete_after       = 90
      }
    }
  }
}

# RDS Automated Backups to DR Region
resource "aws_db_instanceAutomatedBackupReplication" "dr" {
  count = var.enable_drsnapshot ? 1 : 0

  source_db_instance_arn = module.database.rds_instance_arn
  kms_key_id             = aws_kms_key.rds_key.arn

  retention_period = 30
}

# S3 Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "main" {
  count = var.enable_drsnapshot ? 1 : 0

  bucket = module.s3_bucket.id

  rule {
    id = "dr-replication-rule"

    filter {
      prefix = ""
    }

    destination {
      bucket = module.s3_bucket_dr[0].arn
      storage_class = "STANDARD_IA"
      replication_time {
        status  = "Enabled"
        minutes = 15
      }
      metrics {
        status  = "Enabled"
        minutes = 15
      }
    }

    priority = 1
    status   = "Enabled"
  }
}

# DR Region S3 Bucket (requires separate configuration)
module "s3_bucket_dr" {
  count = var.enable_drsnapshot ? 1 : 0

  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = "${var.app_name}-storage-${var.environment}-dr"
  acl    = "private"

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "aws:kms"
      }
    }
  }

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  replication_source = module.s3_bucket.id

  tags = {
    Name        = "${var.app_name}-s3-dr-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Get current AWS account
data "aws_caller_identity" "current" {}
