# Main Terraform configuration for Vibe Platform
# This file orchestrates all infrastructure modules

# VPC Module - Network topology
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.app_name}-vpc-${var.environment}"
  cidr = "10.0.0.0/16"

  # Subnet configuration
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  # Enable NAT gateways for private subnet internet access
  enable_nat_gateway     = true
  single_nat_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true

  # VPC Flow Logs for security monitoring
  enable_flow_log                = true
  flow_log_destination_type      = "cloud-watch-logs"
  flow_log_destination_arn       = aws_cloudwatch_log_group.vpc_flow_logs.arn
  flow_log_max_aggregation_interval = 60

  # Tags
  tags = {
    Name        = "${var.app_name}-vpc-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${var.app_name}-vpc-${var.environment}"
  retention_in_days = 30
  tags = {
    Name        = "${var.app_name}-vpc-flow-logs"
    Environment = var.environment
    Project     = var.app_name
  }
}

# EKS Module - Kubernetes cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.app_name}-eks-${var.environment}"
  cluster_version = var.eks_cluster_version

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  # EKS add-ons
  enable_amazon_eks_vpc_cni = true
  enable_amazon_eks_aws_cca = true

  # IAM configuration for EKS
  create_iam_role = false
  iam_role_id     = aws_iam_role.eks_cluster.id

  # Enable IRSA for service accounts
  enable_irsa = true

  # EKS managed node group
  eks_managed_node_groups = {
    general = {
      instance_types = var.eks_node_instance_types

      min_size     = var.eks_min_capacity
      max_size     = var.eks_max_capacity
      desired_size = var.eks_desired_capacity

      capacity_type = "ON_DEMAND"

      # Subnet placement
      subnet_ids = module.vpc.private_subnets

      # IAM role for nodes
      iam_role_id = aws_iam_role.eks_nodes.id

      # Labels and taints
      labels = {
        node-group = "general"
        workload   = "application"
      }

      # Additional settings
      enable_monitoring          = true
      enable_bootstrap_user_data = true

      tags = {
        Name        = "${var.app_name}-node-group-${var.environment}"
        Environment = var.environment
        Project     = var.app_name
      }
    }
  }

  tags = {
    Name        = "${var.app_name}-eks-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "${var.app_name}-eks-cluster-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
    "arn:aws:iam::aws:policy/AmazonEKSServicePolicy",
    "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  ]

  tags = {
    Name        = "${var.app_name}-eks-cluster-role"
    Environment = var.environment
    Project     = var.app_name
  }
}

# EKS Nodes IAM Role
resource "aws_iam_role" "eks_nodes" {
  name = "${var.app_name}-eks-nodes-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  ]

  tags = {
    Name        = "${var.app_name}-eks-nodes-role"
    Environment = var.environment
    Project     = var.app_name
  }
}

# OIDC Provider for IRSA
resource "aws_iam_openid_connect_provider" "eks" {
  url = module.eks.oidc_provider

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]

  tags = {
    Name        = "${var.app_name}-eks-oidc-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Security Groups
resource "aws_security_group" "eks_nodes" {
  name        = "${var.app_name}-eks-nodes-${var.environment}"
  description = "Security group for EKS nodes"
  vpc_id      = module.vpc.vpc_id

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-eks-nodes-sg"
    Environment = var.environment
    Project     = var.app_name
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  # Allow PostgreSQL from EKS nodes only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-rds-sg"
    Environment = var.environment
    Project     = var.app_name
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.app_name}-redis-${var.environment}"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id

  # Allow Redis from EKS nodes only
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-redis-sg"
    Environment = var.environment
    Project     = var.app_name
  }
}

resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-${var.environment}"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  # Allow HTTP from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound to EKS nodes
  egress {
    from_port       = 3000
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  tags = {
    Name        = "${var.app_name}-alb-sg"
    Environment = var.environment
    Project     = var.app_name
  }
}
