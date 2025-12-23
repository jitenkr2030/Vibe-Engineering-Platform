# Monitoring Stack Module for Vibe Platform
# Includes Prometheus, Grafana, and Loki via Helm

module "monitoring" {
  source  = "terraform-aws-modules/eks-blueprints-addons/aws"
  version = "~> 1.0"

  count = var.enable_monitoring ? 1 : 0

  # Cluster configuration
  cluster_name      = module.eks.cluster_name
  cluster_endpoint  = module.eks.cluster_endpoint
  cluster_version   = var.eks_cluster_version
  oidc_provider_arn = module.eks.oidc_provider_arn

  # Enable Amazon Managed Prometheus (optional) or self-hosted
  enable_amazon_prometheus = false

  # Add-ons to install via Helm
  helm_addons = {
    prometheus = {
      name                  = "prometheus"
      chart                 = "kube-prometheus-stack"
      repository            = "https://prometheus-community.github.io/helm-charts"
      version               = "55.0"
      namespace             = "monitoring"
      create_namespace      = true
      values = [templatefile("${path.module}/helm_values/prometheus-values.yaml", {
        retention_time   = "15d"
        storage_size     = "20Gi"
        retention_size   = "10GB"
        replicas         = var.environment == "production" ? 2 : 1
      })]
    }

    grafana = {
      name                  = "grafana"
      chart                 = "grafana"
      repository            = "https://grafana.github.io/helm-charts"
      version               = "8.0"
      namespace             = "monitoring"
      create_namespace      = true
      values = [templatefile("${path.module}/helm_values/grafana-values.yaml", {
        replicas         = var.environment == "production" ? 2 : 1
        admin_password   = random_password.grafana_admin_password.result
      })]
    }

    loki = {
      name                  = "loki"
      chart                 = "loki"
      repository            = "https://grafana.github.io/helm-charts"
      version               = "6.0"
      namespace             = "monitoring"
      create_namespace      = true
      values = [templatefile("${path.module}/helm_values/loki-values.yaml", {
        retention        = "672h"  # 28 days
        storage_type     = "s3"
        s3_bucket        = "${var.app_name}-logs-${var.environment}"
        s3_region        = var.aws_region
      })]
    }
  }

  # Tags
  tags = {
    Name        = "${var.app_name}-monitoring-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Random password for Grafana admin user
resource "random_password" "grafana_admin_password" {
  length           = 32
  special          = false
  override_special = "!#$%&*()-_=+[]{}|"
}

# Prometheus Remote Write configuration (sends metrics to AWS AMP)
resource "aws_amp_workspace" "main" {
  count = var.enable_monitoring ? 1 : 0

  alias = "${var.app_name}-amp-${var.environment}"

  logging_configuration {
    log_group_arns = [aws_cloudwatch_log_group.prometheus[count.index].arn]
  }

  tags = {
    Name        = "${var.app_name}-amp-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# CloudWatch Log Group for Prometheus
resource "aws_cloudwatch_log_group" "prometheus" {
  count             = var.enable_monitoring ? 1 : 0
  name              = "/aws/eks/${var.app_name}-eks-${var.environment}/prometheus"
  retention_in_days = 30
  tags = {
    Name        = "${var.app_name}-prometheus-logs"
    Environment = var.environment
    Project     = var.app_name
  }
}

# Grafana Log Group
resource "aws_cloudwatch_log_group" "grafana" {
  count             = var.enable_monitoring ? 1 : 0
  name              = "/aws/eks/${var.app_name}-eks-${var.environment}/grafana"
  retention_in_days = 30
  tags = {
    Name        = "${var.app_name}-grafana-logs"
    Environment = var.environment
    Project     = var.app_name
  }
}
