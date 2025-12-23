# S3 Bucket Module for Vibe Platform file storage

module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = "${var.app_name}-storage-${var.environment}"
  acl    = "private"

  # Enable versioning for data protection
  versioning = {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.s3_key.arn
      }
    }
  }

  # Block public access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  # Lifecycle rules for cost optimization
  lifecycle_rule = [
    {
      id      = "transition-to-ia"
      enabled = true
      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]
      noncurrent_version_expiration = {
        days = 365
      }
    }
  ]

  # CORS configuration for web access
  cors_rule = [
    {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "PUT", "POST", "DELETE"]
      allowed_origins = [
        "https://${var.subdomain_frontend}.${var.domain_name}",
        "https://${var.domain_name}"
      ]
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]

  # Tags
  tags = {
    Name        = "${var.app_name}-s3-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# S3 KMS Key for encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
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
    Name        = "${var.app_name}-s3-kms-key"
    Environment = var.environment
    Project     = var.app_name
  }
}

# S3 Bucket Public Access Block (explicit resource)
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = module.s3_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for CloudFront OAI (optional)
resource "aws_s3_bucket_policy" "cloudfront_oai" {
  count  = var.environment == "production" ? 1 : 0
  bucket = module.s3_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          CanonicalUser = data.aws_cloudfront_origin_access_identity.oai[0].s3_canonical_user_id
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront OAI for S3 access
data "aws_cloudfront_origin_access_identity" "oai" {
  count = var.environment == "production" ? 1 : 0
}

# Reuse current AWS account data
data "aws_caller_identity" "current" {}
