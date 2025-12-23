# Vibe Platform Infrastructure

This directory contains all infrastructure as code (IaC) configurations for the Vibe Engineering Platform, including Terraform modules, Kubernetes manifests, and disaster recovery documentation.

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── backend.tf              # Terraform state backend configuration
│   ├── main.tf                 # VPC, EKS, and security groups
│   ├── variables.tf            # Input variables for Terraform
│   ├── outputs.tf              # Output values from Terraform
│   ├── database.tf             # RDS PostgreSQL configuration
│   ├── redis.tf                # ElastiCache Redis configuration
│   ├── s3.tf                   # S3 bucket configuration
│   ├── acm.tf                  # ACM certificates and ALB
│   ├── monitoring.tf           # Prometheus, Grafana, Loki
│   ├── backup.tf               # AWS Backup configuration
│   └── helm_values/
│       ├── prometheus-values.yaml
│       ├── grafana-values.yaml
│       └── loki-values.yaml
├── kubernetes/
│   ├── 00-namespace.yaml       # Namespace definitions
│   ├── 01-configmap.yaml       # Application configuration
│   ├── 02-secrets.yaml         # Secret references
│   ├── 03-backend-deployment.yaml  # Backend API deployment
│   ├── 04-frontend-deployment.yaml # Frontend deployment
│   ├── 05-ingress.yaml         # Ingress and TLS configuration
│   ├── 06-rbac.yaml            # RBAC and service accounts
│   ├── 07-network-policy.yaml  # Network security policies
│   └── 08-resource-quota.yaml  # Resource limits
└── DISASTER_RECOVERY.md        # DR plan and procedures
```

## Prerequisites

Before deploying the infrastructure, ensure you have the following tools installed and configured:

| Tool | Version | Purpose |
|------|---------|---------|
| Terraform | >= 1.5.0 | Infrastructure provisioning |
| kubectl | >= 1.28 | Kubernetes management |
| AWS CLI | >= 2.13 | AWS resource management |
| Helm | >= 3.12 | Helm chart deployment |
| aws-iam-authenticator | Latest | EKS authentication |

### AWS Account Requirements

1. **IAM User/Role** with the following permissions:
   - IAM: Create/manage roles and policies
   - EC2: VPC, subnets, security groups
   - EKS: Cluster and node management
   - RDS: Database provisioning
   - ElastiCache: Redis cluster management
   - S3: Bucket management
   - ACM: Certificate management
   - Route53: DNS management
   - Backup: Backup vault management

2. **AWS CLI Configuration**:
   ```bash
   aws configure
   aws configure set default.region us-east-1
   ```

## Deployment Instructions

### Step 1: Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform backend
terraform init

# Verify Terraform configuration
terraform plan
```

### Step 2: Deploy Infrastructure

```bash
# Deploy base infrastructure (VPC, EKS, Security Groups)
terraform apply -target=module.vpc
terraform apply -target=module.eks

# Deploy data stores (RDS, Redis, S3)
terraform apply -target=module.database
terraform apply -target=module.redis
terraform apply -target=module.s3

# Deploy certificates and load balancer
terraform apply -target=module.acm

# Deploy monitoring (optional)
terraform apply -target=module.monitoring

# Deploy all remaining resources
terraform apply
```

### Step 3: Configure kubectl

```bash
aws eks update-kubeconfig --name vibe-eks-production --region us-east-1
```

### Step 4: Deploy Kubernetes Resources

```bash
# Apply Kubernetes manifests in order
kubectl apply -f kubernetes/00-namespace.yaml
kubectl apply -f kubernetes/01-configmap.yaml

# Create secrets using External Secrets Operator or GitOps
# DO NOT apply secrets with hardcoded values
# kubectl apply -f kubernetes/02-secrets.yaml

kubectl apply -f kubernetes/03-backend-deployment.yaml
kubectl apply -f kubernetes/04-frontend-deployment.yaml
kubectl apply -f kubernetes/05-ingress.yaml
kubectl apply -f kubernetes/06-rbac.yaml
kubectl apply -f kubernetes/07-network-policy.yaml
kubectl apply -f kubernetes/08-resource-quota.yaml

# Verify deployment
kubectl get all -n vibe-production
```

### Step 5: Verify Installation

```bash
# Check pod status
kubectl get pods -n vibe-production

# Check services
kubectl get svc -n vibe-production

# Check ingress
kubectl get ingress -n vibe-production

# Test endpoint
curl -f https://api.vibe.dev/health
curl -f https://www.vibe.dev
```

## Environment Configuration

### Development Environment

```bash
export TF_VAR_environment=development
export TF_VAR_db_instance_class=db.t4g.micro
export TF_VAR_eks_desired_capacity=1
export TF_VAR_enable_monitoring=false
```

### Staging Environment

```bash
export TF_VAR_environment=staging
export TF_VAR_db_instance_class=db.t4g.small
export TF_VAR_eks_desired_capacity=2
export TF_VAR_enable_monitoring=true
```

### Production Environment

```bash
export TF_VAR_environment=production
export TF_VAR_db_instance_class=db.t4g.medium
export TF_VAR_eks_desired_capacity=3
export TF_VAR_enable_monitoring=true
export TF_VAR_enable_backup=true
export TF_VAR_enable_drsnapshot=true
```

## Sensitive Data Management

### Secrets Management

This infrastructure uses External Secrets Operator to sync secrets from AWS Secrets Manager:

1. **Create secrets in AWS Secrets Manager**:
   ```bash
   aws secretsmanager create-secret \
     --name vibe/production/database \
     --secret-string '{"username":"vibe_admin","password":"your-password"}'
   ```

2. **Secrets are automatically synced** to Kubernetes via External Secrets Operator.

3. **For local development**, create a `.tfvars` file:
   ```hcl
   # environment/production/terraform.tfvars (add to .gitignore)
   db_password = "your-secure-password"
   redis_auth_token = "your-secure-token"
   jwt_secret = "your-jwt-secret"
   ```

### TLS Certificates

Certificates are automatically provisioned via cert-manager with Let's Encrypt:
- Validation method: DNS (Route53)
- Certificate: `vibe-tls` in `vibe-production` namespace
- Auto-renewal: Enabled (30 days before expiry)

## Monitoring and Observability

### Accessing Grafana

```bash
# Port forward to Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80

# Open browser to http://localhost:3000
# Default credentials: admin (password from secrets)
```

### Accessing Prometheus

```bash
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open browser to http://localhost:9090
```

### Key Dashboards

| Dashboard | Description | Location |
|-----------|-------------|----------|
| Cluster Overview | Node and pod resource utilization | Grafana |
| Application Metrics | Request rate, latency, errors | Grafana |
| Database Health | RDS connection, IOPS, latency | Grafana |
| Redis Cache | Cache hit ratio, memory usage | Grafana |

## Troubleshooting

### Common Issues

#### Terraform State Lock
```bash
# Check state lock
terraform state list

# Force unlock (use with caution)
terraform force-unlock LOCK_ID
```

#### EKS Node Issues
```bash
# Check node status
kubectl get nodes

# Check node logs
aws logs filter-log-events --log-group-name /aws/eks/vibe-eks-production/node --filter-pattern ERROR

# Restart node group
terraform apply -target=module.eks.eks_managed_node_groups
```

#### Database Connection Issues
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier vibe-postgres-production \
  --query 'DBInstances[0].DBInstanceStatus'

# Test connection
kubectl exec -n vibe-production deployment/vibe-backend -- \
  curl -f http://localhost:3001/health
```

#### Pod Startup Failures
```bash
# Check pod events
kubectl describe pod <pod-name> -n vibe-production

# Check pod logs
kubectl logs <pod-name> -n vibe-production -c backend

# Check resource constraints
kubectl top pod -n vibe-production
```

## Security Considerations

### Network Security
- All resources deployed in private subnets
- Security groups restrict traffic to only necessary ports
- Network policies limit pod-to-pod communication

### Data Protection
- All data encrypted at rest (KMS)
- TLS 1.3 for data in transit
- Automated backups with 7-day retention

### Access Control
- IAM roles for service accounts (IRSA)
- RBAC for Kubernetes resources
- Regular rotation of secrets and credentials

## Cost Optimization

### Reserved Instances
For production, consider purchasing reserved instances:
```bash
# RDS Reserved Instance
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id <offering-id> \
  --instance-count 1

# ElastiCache Reserved Node
aws elasticache purchase-reserved-cache-nodes-offering \
  --reserved-cache-nodes-offering-id <offering-id>
```

### Spot Instances
For non-production environments, use spot instances:
```hcl
# In variables.tf
eks_managed_node_groups = {
  spot = {
    capacity_type = "SPOT"
    instance_types = ["t3a.medium", "t3.medium", "m5a.large"]
  }
}
```

### Storage Optimization
- S3 lifecycle policies transition data to IA after 30 days
- S3 lifecycle policies archive to Glacier after 90 days
- RDS storage auto-scaling configured

## Disaster Recovery

See [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) for comprehensive DR procedures including:

- Recovery objectives (RTO, RPO)
- Backup strategies
- Failover procedures
- Rollback procedures
- Testing schedule

## Contributing

### Adding New Resources

1. Add to appropriate Terraform module
2. Update `variables.tf` and `outputs.tf`
3. Document the new resource
4. Test deployment in development environment
5. Review security implications

### Modifying Existing Resources

1. Create a Terraform plan to verify changes
2. Review potential impact on running resources
3. Test in development before production
4. Document any breaking changes

## Support

For infrastructure-related issues:

1. Check AWS Service Health Dashboard
2. Review CloudWatch logs and metrics
3. Consult AWS documentation
4. Contact platform engineering team

---

**Document Version**: 1.0
**Last Updated**: 2025-12-23
**Maintainers**: Platform Engineering Team
