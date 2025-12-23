# Vibe Platform Disaster Recovery Plan

## Overview

This document outlines the disaster recovery procedures for the Vibe Engineering Platform. The goal is to ensure business continuity, minimize data loss, and restore services quickly in the event of a major incident or disaster.

## Recovery Objectives

| Metric | Target | Definition |
|--------|--------|------------|
| RTO (Recovery Time Objective) | 4 hours | Maximum acceptable downtime |
| RPO (Recovery Point Objective) | 1 hour | Maximum acceptable data loss |
| MTTR (Mean Time to Recovery) | 2 hours | Expected recovery time |

## Disaster Recovery Tiers

### Tier 1: Minor Incident
- Single pod failure
- Single node failure
- Brief service degradation

**Recovery Time**: Minutes
**Action**: Automatic failover via Kubernetes self-healing

### Tier 2: Major Incident
- AZ failure
- Database connectivity issues
- Application-wide performance degradation

**Recovery Time**: 1-2 hours
**Action**: Manual intervention, scale operations, failover procedures

### Tier 3: Critical Disaster
- Region-wide outage
- Data corruption
- Security breach

**Recovery Time**: 4-8 hours
**Action**: Full DR failover to secondary region

## Backup Strategy

### Database Backups (RDS PostgreSQL)

#### Automated Backups
- **Frequency**: Daily automated backups with 7-day retention
- **Backup Window**: 02:00-03:00 UTC
- **Storage**: AWS-managed storage with encryption

#### Manual Snapshots
- **Frequency**: Weekly manual snapshots
- **Retention**: 30 days for weekly snapshots
- **Procedure**:
  ```bash
  # Create manual snapshot
  aws rds create-db-snapshot \
    --db-instance-identifier vibe-postgres-production \
    --db-snapshot-identifier vibe-manual-snapshot-$(date +%Y%m%d)

  # Copy to DR region
  aws rds copy-db-snapshot \
    --source-db-snapshot-identifier vibe-manual-snapshot-YYYYMMDD \
    --target-db-snapshot-identifier vibe-manual-snapshot-YYYYMMDD-dr \
    --source-region us-east-1 \
    --region us-west-2
  ```

### Redis Backups (ElastiCache)

- **Snapshot Frequency**: Daily (if enabled in configuration)
- **Retention**: 3 days for automatic snapshots
- **Note**: Redis operates as a cache; critical data should be persisted to database

### S3 Backups (File Storage)

- **Versioning**: Enabled with 365-day retention
- **Cross-Region Replication**: Configured for DR region
- **Lifecycle Policies**: Transition to IA after 30 days, Glacier after 90 days

## Failover Procedures

### Procedure 1: Database Failover (Multi-AZ)

**When to Use**: Primary database instance becomes unavailable

1. **Verify the failure**:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier vibe-postgres-production \
     --query 'DBInstances[0].DBInstanceStatus'
   ```

2. **Initiate failover** (automatic if Multi-AZ is enabled):
   ```bash
   aws rds reboot-db-instance \
     --db-instance-identifier vibe-postgres-production \
     --force-failover
   ```

3. **Verify failover completion**:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier vibe-postgres-production \
     --query 'DBInstances[0].SecondaryAvailabilityZone'
   ```

4. **Update DNS if necessary**:
   - DNS should automatically point to new primary via Route53 health checks

### Procedure 2: Redis Failover

**When to Use**: Redis primary node becomes unavailable

1. **Check cluster status**:
   ```bash
   aws elasticache describe-replication-groups \
     --replication-group-id vibe-redis-production \
     --query 'ReplicationGroups[0].Status'
   ```

2. **If automatic failover didn't trigger**:
   ```bash
   aws elasticache test-failover \
     --replication-group-id vibe-redis-production \
     --node-group-id 0001
   ```

### Procedure 3: Full Region Failover (DR)

**When to Use**: Entire primary region is unavailable

#### Pre-requisites
- Terraform state available in DR region
- Container images replicated to DR ECR
- DNS failover configured in Route53

#### Step 1: Verify Primary Region Status
```bash
# Check if primary region resources are available
aws ec2 describe-vpcs --region us-east-1 --query 'Vpcs[0].State'
```

#### Step 2: Activate DR Infrastructure
```bash
cd infrastructure/terraform
export AWS_REGION=us-west-2
terraform workspace select dr || terraform workspace new dr
terraform apply -var="environment=dr" -var="enable_backup=false"
```

#### Step 3: Restore Database from Cross-Region Snapshot
```bash
# Find the latest snapshot in DR region
aws rds describe-db-snapshots \
  --region us-west-2 \
  --db-instance-identifier vibe-postgres-production \
  --snapshot-type automated

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier vibe-postgres-dr \
  --db-snapshot-identifier vibe-postgres-YYYY-MM-DD-DD-snapshot-dr \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name vibe-db-subnet-group-dr \
  --region us-west-2
```

#### Step 4: Update Application Configuration
```bash
# Update Kubernetes secrets with DR database endpoint
kubectl set secret -n vibe-production vibe-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --context dr-cluster

# Rollout application changes
kubectl rollout restart deployment vibe-backend -n vibe-production
kubectl rollout restart deployment vibe-frontend -n vibe-production
```

#### Step 5: Update DNS (Route53)
```bash
# Check health of DR endpoints
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-west-2:... \
  --region us-west-2

# Update Route53 failover records
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXXX \
  --change-batch file://dr-failover.json
```

#### Step 6: Verify Application Health
```bash
# Check pod status
kubectl get pods -n vibe-production

# Verify services
kubectl get svc -n vibe-production

# Test endpoint
curl -f https://api.vibe.dev/health
```

## Rollback Procedures

### Rollback After Deployment
```bash
# Get previous deployment revision
kubectl rollout history deployment vibe-backend -n vibe-production

# Rollback to previous version
kubectl rollout undo deployment vibe-backend -n vibe-production

# Verify rollback
kubectl rollout status deployment vibe-backend -n vibe-production
```

### Rollback After Terraform Changes
```bash
# Check terraform state
terraform plan

# Rollback infrastructure
terraform apply -target=module.database -var="db_instance_class=db.t4g.small"
```

## Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Platform Engineer | [ON-CALL] | Initial incident response |
| DevOps Lead | [ESCALATION] | Major incident coordination |
| Engineering Manager | [EXECUTIVE] | Business communication |
| AWS Support | [PREMIUM] | Infrastructure issues |

## Post-Incident Procedures

### Immediate Actions (0-4 hours)
1. Document timeline of events
2. Preserve logs and metrics
3. Notify stakeholders
4. Begin root cause analysis

### Follow-up Actions (24-72 hours)
1. Complete RCA document
2. Identify preventive measures
3. Update runbooks
4. Conduct team debrief

### Long-term Actions (1-2 weeks)
1. Implement preventive measures
2. Update monitoring and alerting
3. Test failover procedures
4. Update documentation

## Testing Schedule

| Test Type | Frequency | Duration | Participants |
|-----------|-----------|----------|--------------|
| Backup restoration | Weekly | 30 min | DevOps Team |
| Failover drill | Monthly | 2 hours | DevOps + Engineering |
| Full DR drill | Quarterly | 4 hours | All Teams |
| Tabletop exercise | Bi-weekly | 1 hour | Leadership |

## Checklist for DR Drill

### Pre-Drill
- [ ] Notify all stakeholders
- [ ] Verify backup integrity
- [ ] Confirm DR environment is ready
- [ ] Prepare runbooks
- [ ] Set up monitoring for drill

### During Drill
- [ ] Execute failover procedure
- [ ] Document time to complete each step
- [ ] Note any issues encountered
- [ ] Verify data integrity
- [ ] Test application functionality

### Post-Drill
- [ ] Rollback to primary region
- [ ] Document lessons learned
- [ ] Update procedures
- [ ] Share findings with team
- [ ] Schedule follow-up improvements

## Appendix

### Useful Commands

#### Check RDS Status
```bash
aws rds describe-db-instances \
  --db-instance-identifier vibe-postgres-production \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'
```

#### Check EKS Cluster Health
```bash
kubectl get --raw='/healthz'
kubectl get nodes
kubectl get componentstatuses
```

#### View Application Logs
```bash
kubectl logs -n vibe-production -l app.kubernetes.io/component=backend --tail=100
```

### AWS Console Links
- RDS Console: https://console.aws.amazon.com/rds/
- EKS Console: https://console.aws.amazon.com/eks/
- S3 Console: https://console.aws.amazon.com/s3/
- CloudWatch: https://console.aws.amazon.com/cloudwatch/

---

**Document Version**: 1.0
**Last Updated**: 2025-12-23
**Next Review**: 2026-03-23
