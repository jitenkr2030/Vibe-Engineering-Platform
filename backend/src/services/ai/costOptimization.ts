import { logger } from '../utils/logger';
import { ProjectFile } from '@vibe/shared';

export interface CostAnalysisRequest {
  projectId: string;
  files?: ProjectFile[];
  infrastructureFiles?: ProjectFile[];
  runtimeMetrics?: RuntimeMetrics;
  cloudProvider?: 'aws' | 'gcp' | 'azure' | 'unknown';
}

export interface RuntimeMetrics {
  avgResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  storageUsed: number;
  bandwidthUsed: number;
}

export interface CostOptimizationResult {
  score: number;
  monthlyEstimate: number;
  potentialSavings: number;
  savingsPercentage: number;
  categories: CostCategory[];
  recommendations: CostRecommendation[];
  infrastructureAnalysis?: InfrastructureAnalysis;
}

export interface CostCategory {
  name: string;
  currentCost: number;
  potentialSavings: number;
  recommendations: number;
  items: CostItem[];
}

export interface CostItem {
  resource: string;
  currentCost: number;
  potentialSavings: number;
  optimization: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
}

export interface CostRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedMonthlySavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  priority: number;
  implementation: string;
  files?: string[];
  metrics?: Record<string, number>;
}

export interface InfrastructureAnalysis {
  compute: ComputeAnalysis;
  storage: StorageAnalysis;
  network: NetworkAnalysis;
  database: DatabaseAnalysis;
}

export interface ComputeAnalysis {
  instances: number;
  instanceTypes: string[];
  utilization: number;
  recommendations: string[];
}

export interface StorageAnalysis {
  totalSize: number;
  storageTypes: string[];
  accessPatterns: string[];
  recommendations: string[];
}

export interface NetworkAnalysis {
  dataTransfer: number;
  endpoints: number;
  recommendations: string[];
}

export interface DatabaseAnalysis {
  engine: string;
  instanceType: string;
  connections: number;
  recommendations: string[];
}

export class CostOptimizationService {
  // Cost constants (USD per month estimates)
  private readonly COST_CONSTANTS = {
    ec2_t3_micro: 8.50,
    ec2_t3_small: 17.00,
    ec2_t3_medium: 34.00,
    ec2_m5_large: 70.00,
    ec2_m5_xlarge: 140.00,
    rds_t3_micro: 15.00,
    rds_m5_large: 120.00,
    s3_standard: 0.023, // per GB
    s3_infrequent: 0.0125,
    lambda_128mb: 1.00, // per million requests
    lambda_512mb: 4.00,
    lambda_1024mb: 8.00,
    ecr: 0.10,
    cloudfront: 0.085, // per GB
    rds_connection: 0.01,
    elasticache_t3_micro: 13.00,
  };

  private readonly RECOMMENDATION_IDS = new Map<string, number>();

  constructor() {
    logger.info('CostOptimizationService initialized');
  }

  /**
   * Analyze costs and provide optimization recommendations
   */
  async analyze(request: CostAnalysisRequest): Promise<CostOptimizationResult> {
    logger.info('Starting cost analysis', { projectId: request.projectId });

    const categories: CostCategory[] = [];
    const recommendations: CostRecommendation[] = [];
    let totalCurrentCost = 0;
    let totalPotentialSavings = 0;

    // Analyze infrastructure files (Terraform, CloudFormation, etc.)
    if (request.infrastructureFiles && request.infrastructureFiles.length > 0) {
      const infraAnalysis = await this.analyzeInfrastructure(request.infrastructureFiles);
      totalCurrentCost += infraAnalysis.monthlyEstimate;
      totalPotentialSavings += infraAnalysis.potentialSavings;
      categories.push(infraAnalysis);
      recommendations.push(...infraAnalysis.recommendations);
    }

    // Analyze application code for cost patterns
    if (request.files && request.files.length > 0) {
      const codeAnalysis = await this.analyzeCodePatterns(request.files);
      totalCurrentCost += codeAnalysis.monthlyEstimate;
      totalPotentialSavings += codeAnalysis.potentialSavings;
      categories.push(codeAnalysis);
      recommendations.push(...codeAnalysis.recommendations);
    }

    // Analyze runtime metrics
    if (request.runtimeMetrics) {
      const runtimeAnalysis = this.analyzeRuntimePatterns(request.runtimeMetrics);
      totalCurrentCost += runtimeAnalysis.monthlyEstimate;
      totalPotentialSavings += runtimeAnalysis.potentialSavings;
      categories.push(runtimeAnalysis);
      recommendations.push(...runtimeAnalysis.recommendations);
    }

    // Calculate score (0-100, higher is better)
    const score = totalCurrentCost > 0 
      ? Math.max(0, Math.min(100, 100 - (totalPotentialSavings / totalCurrentCost) * 50))
      : 100;

    // Sort recommendations by priority
    const sortedRecommendations = recommendations
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10);

    const result: CostOptimizationResult = {
      score,
      monthlyEstimate: totalCurrentCost,
      potentialSavings: totalPotentialSavings,
      savingsPercentage: totalCurrentCost > 0 
        ? Math.round((totalPotentialSavings / totalCurrentCost) * 100) 
        : 0,
      categories,
      recommendations: sortedRecommendations,
    };

    logger.info('Cost analysis completed', {
      projectId: request.projectId,
      monthlyEstimate: totalCurrentCost,
      potentialSavings,
      score,
    });

    return result;
  }

  /**
   * Analyze infrastructure-as-code files
   */
  private async analyzeInfrastructure(
    files: ProjectFile[]
  ): Promise<CostCategory> {
    const items: CostItem[] = [];
    const recommendations: CostRecommendation[] = [];
    let currentCost = 0;
    let potentialSavings = 0;

    for (const file of files) {
      if (!file.content) continue;

      // Detect AWS EC2 instances
      const ec2Matches = file.content.match(/aws_instance[^{]*\{[^}]*instance_type\s*=\s*"([^"]+)"/g);
      if (ec2Matches) {
        for (const match of ec2Matches) {
          const typeMatch = match.match(/instance_type\s*=\s*"([^"]+)"/);
          const instanceType = typeMatch ? typeMatch[1] : 't3.micro';
          const cost = this.estimateEC2Cost(instanceType);
          currentCost += cost;

          // Check for optimization opportunities
          if (instanceType.includes('large') || instanceType.includes('xlarge')) {
            const suggestion = this.generateRecommendation(
              'Downsize EC2 instance',
              `Consider using a smaller instance type like t3.micro or t3.small for non-production workloads`,
              'compute',
              cost * 0.5,
              'low',
              'high'
            );
            items.push({
              resource: `EC2 ${instanceType}`,
              currentCost: cost,
              potentialSavings: cost * 0.5,
              optimization: suggestion.description,
              effort: 'low',
              impact: 'high',
            });
            potentialSavings += cost * 0.5;
            recommendations.push(suggestion);
          }
        }
      }

      // Detect RDS instances
      const rdsMatches = file.content.match(/aws_db_instance[^{]*\{[^}]*instance_class\s*=\s*"([^"]+)"/g);
      if (rdsMatches) {
        for (const match of rdsMatches) {
          const typeMatch = match.match(/instance_class\s*=\s*"([^"]+)"/);
          const instanceType = typeMatch ? typeMatch[1] : 'db.t3.micro';
          const cost = this.estimateRDSCost(instanceType);
          currentCost += cost;

          if (!instanceType.includes('micro') && !instanceType.includes('small')) {
            const suggestion = this.generateRecommendation(
              'Right-size RDS instance',
              `Consider using a smaller RDS instance class for development or staging environments`,
              'database',
              cost * 0.4,
              'low',
              'high'
            );
            items.push({
              resource: `RDS ${instanceType}`,
              currentCost: cost,
              potentialSavings: cost * 0.4,
              optimization: suggestion.description,
              effort: 'low',
              impact: 'high',
            });
            potentialSavings += cost * 0.4;
            recommendations.push(suggestion);
          }
        }
      }

      // Detect S3 buckets
      const s3Matches = file.content.match(/aws_s3_bucket[^{]*\{/g);
      if (s3Matches && s3Matches.length > 0) {
        const storageCost = 50; // Base estimate
        currentCost += storageCost;

        // Check for lifecycle policies
        if (!file.content.includes('lifecycle_rule') && !file.content.includes('transition')) {
          const suggestion = this.generateRecommendation(
            'Add S3 lifecycle policies',
            'Configure S3 lifecycle rules to transition old data to cheaper storage classes',
            'storage',
            storageCost * 0.3,
            'low',
              'medium'
          );
          items.push({
            resource: 'S3 Storage',
            currentCost: storageCost,
            potentialSavings: storageCost * 0.3,
            optimization: suggestion.description,
            effort: 'low',
            impact: 'medium',
          });
          potentialSavings += storageCost * 0.3;
          recommendations.push(suggestion);
        }
      }

      // Detect Elasticache
      const elasticacheMatches = file.content.match(/aws_elasticache_cluster[^{]*\{/g);
      if (elasticacheMatches && elasticacheMatches.length > 0) {
        const cacheCost = this.COST_CONSTANTS.elasticache_t3_micro;
        currentCost += cacheCost;

        const suggestion = this.generateRecommendation(
          'Evaluate Elasticache necessity',
          'Consider if Elasticache is necessary or if Redis with simpler configuration would suffice',
          'database',
          cacheCost * 0.3,
          'medium',
          'medium'
        );
        items.push({
          resource: 'Elasticache',
          currentCost: cacheCost,
          potentialSavings: cacheCost * 0.3,
          optimization: suggestion.description,
          effort: 'medium',
          impact: 'medium',
        });
        potentialSavings += cacheCost * 0.3;
        recommendations.push(suggestion);
      }

      // Detect Lambda functions
      const lambdaMatches = file.content.match(/aws_lambda_function[^{]*\{/g);
      if (lambdaMatches) {
        const lambdaCost = lambdaMatches.length * this.COST_CONSTANTS.lambda_512mb;
        currentCost += lambdaCost;

        // Check memory allocation
        const memoryMatches = file.content.match(/memory_size\s*=\s*(\d+)/g);
        const avgMemory = memoryMatches 
          ? memoryMatches.reduce((sum, m) => sum + parseInt(m.match(/\d+/)?.[0] || '512'), 0) / memoryMatches.length
          : 512;

        if (avgMemory > 512) {
          const suggestion = this.generateRecommendation(
            'Optimize Lambda memory allocation',
            'Reduce Lambda memory allocation for functions that dont need high memory',
            'compute',
            lambdaCost * 0.25,
            'low',
            'medium'
          );
          items.push({
            resource: `${lambdaMatches.length} Lambda functions`,
            currentCost: lambdaCost,
            potentialSavings: lambdaCost * 0.25,
            optimization: suggestion.description,
            effort: 'low',
            impact: 'medium',
          });
          potentialSavings += lambdaCost * 0.25;
          recommendations.push(suggestion);
        }
      }

      // Detect Load Balancers
      const lbMatches = file.content.match(/aws_lb[^{]*\{|aws_alb[^{]*\{/g);
      if (lbMatches && lbMatches.length > 0) {
        const lbCost = 20 * lbMatches.length; // ~$20/month per ALB
        currentCost += lbCost;

        const suggestion = this.generateRecommendation(
          'Consolidate load balancers',
          'Consider using a single load balancer with multiple rules instead of multiple LBs',
          'network',
          lbCost * 0.2,
          'high',
          'low'
        );
        items.push({
          resource: `${lbMatches.length} Load Balancer(s)`,
          currentCost: lbCost,
          potentialSavings: lbCost * 0.2,
          optimization: suggestion.description,
          effort: 'high',
          impact: 'low',
        });
        potentialSavings += lbCost * 0.2;
        recommendations.push(suggestion);
      }
    }

    return {
      name: 'Infrastructure',
      currentCost,
      potentialSavings,
      recommendations: recommendations.length,
      items,
    };
  }

  /**
   * Analyze application code for cost patterns
   */
  private async analyzeCodePatterns(files: ProjectFile[]): Promise<CostCategory> {
    const items: CostItem[] = [];
    const recommendations: CostRecommendation[] = [];
    let currentCost = 50; // Base application cost
    let potentialSavings = 0;

    for (const file of files) {
      if (!file.content) continue;

      // Detect database connection leaks
      const connectionPattern = /mongoose\.connect|new\s+PrismaClient|new\s+Pool/g;
      if (connectionPattern.test(file.content)) {
        const disconnectPattern = /\.disconnect|\.end|pool\.end/g;
        if (!disconnectPattern.test(file.content)) {
          const suggestion = this.generateRecommendation(
            'Fix database connection handling',
            'Ensure database connections are properly closed to avoid connection leaks',
            'database',
            15,
            'low',
            'high'
          );
          items.push({
            resource: 'Database connections',
            currentCost: 15,
            potentialSavings: 15,
            optimization: suggestion.description,
            effort: 'low',
            impact: 'high',
          });
          potentialSavings += 15;
          recommendations.push(suggestion);
        }
      }

      // Detect inefficient queries
      const inefficientQueryPatterns = [
        { pattern: /\.find\(\)\s*\?\s*\./, desc: 'Optional chaining on queries' },
        { pattern: /for\s*\([^)]*\)\s*\{[^}]*\.find|\.query/g, desc: 'Potential N+1 query in loop' },
        { pattern: /\.select\(\*+\)/g, desc: 'Using SELECT * in queries' },
      ];

      for (const { pattern, desc } of inefficientQueryPatterns) {
        if (pattern.test(file.content)) {
          const suggestion = this.generateRecommendation(
            'Optimize database queries',
            desc,
            'database',
            10,
            'low',
            'medium'
          );
          items.push({
            resource: 'Query optimization',
            currentCost: 10,
            potentialSavings: 10,
            optimization: suggestion.description,
            effort: 'low',
            impact: 'medium',
          });
          potentialSavings += 10;
          recommendations.push(suggestion);
          break;
        }
      }

      // Detect missing caching
      if (file.content.includes('database') || file.content.includes('query')) {
        const cachePatterns = [/redis/i, /memcached/i, /cache/i];
        const hasCache = cachePatterns.some(p => p.test(file.content));
        if (!hasCache && file.content.length > 1000) {
          const suggestion = this.generateRecommendation(
            'Implement caching layer',
            'Add caching (Redis or similar) for frequently accessed data',
            'performance',
            20,
            'medium',
            'high'
          );
          items.push({
            resource: 'Missing cache',
            currentCost: 20,
            potentialSavings: 20,
            optimization: suggestion.description,
            effort: 'medium',
            impact: 'high',
          });
          potentialSavings += 20;
          recommendations.push(suggestion);
        }
      }

      // Detect large payload uploads
      if (file.content.includes('upload') || file.content.includes('multipart')) {
        const suggestion = this.generateRecommendation(
          'Optimize file uploads',
          'Consider using presigned URLs for direct-to-S3 uploads instead of streaming through the server',
          'network',
            15,
            'medium',
            'medium'
        );
        items.push({
          resource: 'File uploads',
          currentCost: 15,
          potentialSavings: 15,
          optimization: suggestion.description,
          effort: 'medium',
          impact: 'medium',
        });
        potentialSavings += 15;
        recommendations.push(suggestion);
      }

      // Detect sync operations that could be async
      const syncPatterns = [/fs\.readFileSync/g, /fs\.writeFileSync/g];
      const syncCount = syncPatterns.reduce((count, pattern) => 
        count + (file.content.match(pattern) || []).length, 0
      );
      if (syncCount > 2) {
        const suggestion = this.generateRecommendation(
          'Replace sync file operations with async',
          'Use async file operations to improve server responsiveness',
          'performance',
          10,
          'low',
          'medium'
        );
        items.push({
          resource: 'Sync I/O operations',
          currentCost: 10,
          potentialSavings: 10,
          optimization: suggestion.description,
          effort: 'low',
          impact: 'medium',
        });
        potentialSavings += 10;
        recommendations.push(suggestion);
      }
    }

    return {
      name: 'Application',
      currentCost,
      potentialSavings,
      recommendations: recommendations.length,
      items,
    };
  }

  /**
   * Analyze runtime metrics for cost patterns
   */
  private analyzeRuntimePatterns(metrics: RuntimeMetrics): CostCategory {
    const items: CostItem[] = [];
    const recommendations: CostRecommendation[] = [];
    let currentCost = 0;
    let potentialSavings = 0;

    // Calculate based on metrics
    if (metrics.cpuUtilization < 30) {
      const cost = 50;
      currentCost += cost;
      const suggestion = this.generateRecommendation(
        'Right-size compute resources',
        `CPU utilization is only ${metrics.cpuUtilization}%. Consider scaling down instances.`,
        'compute',
        cost * 0.4,
        'low',
        'high'
      );
      items.push({
        resource: 'Compute right-sizing',
        currentCost: cost,
        potentialSavings: cost * 0.4,
        optimization: suggestion.description,
        effort: 'low',
        impact: 'high',
      });
      potentialSavings += cost * 0.4;
      recommendations.push(suggestion);
    }

    if (metrics.memoryUtilization < 40) {
      const cost = 30;
      currentCost += cost;
      const suggestion = this.generateRecommendation(
        'Optimize memory allocation',
        `Memory utilization is only ${metrics.memoryUtilization}%. Reduce instance memory allocation.`,
        'compute',
        cost * 0.3,
        'low',
        'medium'
      );
      items.push({
        resource: 'Memory optimization',
        currentCost: cost,
        potentialSavings: cost * 0.3,
        optimization: suggestion.description,
        effort: 'low',
        impact: 'medium',
      });
      potentialSavings += cost * 0.3;
      recommendations.push(suggestion);
    }

    if (metrics.errorRate > 1) {
      const cost = 20;
      currentCost += cost;
      const suggestion = this.generateRecommendation(
        'Improve error handling',
        `Error rate is ${metrics.errorRate}%. Fixing errors reduces wasted compute and retries.`,
        'performance',
        cost * 0.5,
        'medium',
        'high'
      );
      items.push({
        resource: 'Error handling',
        currentCost: cost,
        potentialSavings: cost * 0.5,
        optimization: suggestion.description,
        effort: 'medium',
        impact: 'high',
      });
      potentialSavings += cost * 0.5;
      recommendations.push(suggestion);
    }

    if (metrics.avgResponseTime > 1000) {
      const cost = 40;
      currentCost += cost;
      const suggestion = this.generateRecommendation(
        'Optimize response times',
        `Average response time is ${metrics.avgResponseTime}ms. Optimizing improves user experience and reduces costs.`,
        'performance',
        cost * 0.25,
        'medium',
        'medium'
      );
      items.push({
        resource: 'Response time optimization',
        currentCost: cost,
        potentialSavings: cost * 0.25,
        optimization: suggestion.description,
        effort: 'medium',
        impact: 'medium',
      });
      potentialSavings += cost * 0.25;
      recommendations.push(suggestion);
    }

    return {
      name: 'Runtime',
      currentCost,
      potentialSavings,
      recommendations: recommendations.length,
      items,
    };
  }

  /**
   * Generate a cost recommendation
   */
  private generateRecommendation(
    title: string,
    description: string,
    category: string,
    estimatedSavings: number,
    effort: 'low' | 'medium' | 'high',
    impact: 'high' | 'medium' | 'low'
  ): CostRecommendation {
    const id = this.RECOMMENDATION_IDS.get(title) || 1;
    this.RECOMMENDATION_IDS.set(title, id + 1);

    const priorityScores = { high: 1, medium: 2, low: 3 };
    const impactScores = { high: 3, medium: 2, low: 1 };

    return {
      id: `rec-${id}-${Date.now()}`,
      title,
      description,
      category,
      estimatedMonthlySavings: estimatedSavings,
      effort,
      impact,
      priority: priorityScores[effort] * impactScores[impact],
      implementation: this.getImplementationSteps(title),
    };
  }

  /**
   * Get implementation steps for a recommendation
   */
  private getImplementationSteps(title: string): string {
    const steps: Record<string, string> = {
      'Downsize EC2 instance': '1. Review current instance utilization\n2. Select appropriate smaller instance type\n3. Test application performance\n4. Update Terraform/CloudFormation\n5. Deploy and monitor',
      'Right-size RDS instance': '1. Analyze database workload patterns\n2. Select appropriate instance class\n3. Create snapshot for backup\n4. Modify instance class\n5. Monitor performance',
      'Add S3 lifecycle policies': '1. Identify data access patterns\n2. Create lifecycle rules for transition to cheaper storage\n3. Set up expiration for old data\n4. Test with non-critical data\n5. Apply to all buckets',
      'Optimize Lambda memory': '1. Review Lambda invocation patterns\n2. Use AWS Lambda Power Tuning to find optimal memory\n3. Update function configurations\n4. Deploy and monitor',
      'Implement caching layer': '1. Choose caching solution (Redis, Memcached)\n2. Design caching strategy\n3. Implement cache layer\n4. Set up cache invalidation\n5. Monitor hit rates',
    };
    return steps[title] || '1. Review the recommendation\n2. Assess impact\n3. Create implementation plan\n4. Execute changes\n5. Monitor results';
  }

  /**
   * Estimate EC2 cost
   */
  private estimateEC2Cost(instanceType: string): number {
    const match = instanceType.match(/t3\.(micro|small|medium|large|xlarge)/);
    if (match) {
      const sizes = { micro: 0.5, small: 1, medium: 2, large: 4, xlarge: 8 };
      return (sizes[match[1] as keyof typeof sizes] || 1) * this.COST_CONSTANTS.ec2_t3_micro;
    }
    return this.COST_CONSTANTS.ec2_t3_medium;
  }

  /**
   * Estimate RDS cost
   */
  private estimateRDSCost(instanceClass: string): number {
    const match = instanceClass.match(/db\.(t3|m5)\.(micro|small|medium|large)/);
    if (match) {
      return this.COST_CONSTANTS.rds_t3_micro;
    }
    return this.COST_CONSTANTS.rds_m5_large;
  }

  /**
   * Get quick wins (high impact, low effort)
   */
  async getQuickWins(request: CostAnalysisRequest): Promise<CostRecommendation[]> {
    const fullAnalysis = await this.analyze(request);
    return fullAnalysis.recommendations
      .filter(r => r.impact === 'high' && r.effort === 'low')
      .slice(0, 5);
  }

  /**
   * Estimate monthly cost for a project setup
   */
  estimateProjectCost(setup: {
    hasBackend: boolean;
    hasFrontend: boolean;
    hasDatabase: boolean;
    hasCache: boolean;
    hasCDN: boolean;
    tier: 'starter' | 'medium' | 'large';
  }): number {
    const costs: Record<string, number> = {
      backend: { starter: 15, medium: 50, large: 150 },
      frontend: { starter: 5, medium: 15, large: 30 },
      database: { starter: 15, medium: 50, large: 150 },
      cache: { starter: 10, medium: 20, large: 40 },
      cdn: { starter: 5, medium: 15, large: 50 },
    };

    let total = 0;
    if (setup.hasBackend) total += costs.backend[setup.tier];
    if (setup.hasFrontend) total += costs.frontend[setup.tier];
    if (setup.hasDatabase) total += costs.database[setup.tier];
    if (setup.hasCache) total += costs.cache[setup.tier];
    if (setup.hasCDN) total += costs.cdn[setup.tier];

    return total;
  }
}

export const costOptimizationService = new CostOptimizationService();
export default CostOptimizationService;
