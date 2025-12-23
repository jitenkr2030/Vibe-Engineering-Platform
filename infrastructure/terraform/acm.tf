# ACM (AWS Certificate Manager) Module for TLS certificates

module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.0"

  # Domain validation via Route53
  domain_name = var.domain_name
  zone_id     = data.aws_route53_zone.main.zone_id

  subject_alternative_names = [
    "*.${var.domain_name}",
    "${var.subdomain_api}.${var.domain_name}",
    "${var.subdomain_frontend}.${var.domain_name}"
  ]

  validation_method = "DNS"

  # Use DNS validation records in Route53
  records = [
    for record in aws_route53_record.acm_validation : record.name
  ]

  # Wait for validation
  wait_for_validation = true

  # Tags
  tags = {
    Name        = "${var.app_name}-acm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}

# ACM Validation DNS Records
resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in module.acm.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  name    = each.value.name
  type    = each.value.type
  zone_id = data.aws_route53_zone.main.zone_id
  ttl     = 60

  records = [each.value.record]
}

# Route53 Hosted Zone
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# Route53 A Records for Load Balancer
resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain_frontend
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain_api
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

# Root domain A record (redirect to www)
resource "aws_route53_record" "root" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

# Application Load Balancer
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name = "${var.app_name}-alb-${var.environment}"

  load_balancer_type = "application"

  # Network configuration
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [aws_security_group.alb.id]

  # HTTPS listener
  https_listeners = {
    https = {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = module.acm.certificate_arn
      action_type        = "forward"
      target_group_index = 0
    }
  }

  # HTTP listener with redirect to HTTPS
  http_listeners = {
    http = {
      port               = 80
      protocol           = "HTTP"
      action_type        = "redirect"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  # Target groups for services
  target_groups = {
    frontend = {
      name             = "${var.app_name}-frontend-${var.environment}"
      backend_protocol = "HTTP"
      backend_port     = 3000
      health_check = {
        path                = "/"
        healthy_threshold   = 2
        unhealthy_threshold = 10
        timeout             = 30
        interval            = 60
      }
      target_type = "ip"
    }
    backend = {
      name             = "${var.app_name}-backend-${var.environment}"
      backend_protocol = "HTTP"
      backend_port     = 3001
      health_check = {
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 10
        timeout             = 30
        interval            = 60
      }
      target_type = "ip"
    }
  }

  # Tags
  tags = {
    Name        = "${var.app_name}-alb-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
  }
}
