import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CICDGeneratorService } from '../services/ai/cicdGenerator';

// Mock dependencies
const mockAggregator = {
  complete: vi.fn(),
};

vi.mock('../services/ai/aiAggregator', () => ({
  aiAggregator: mockAggregator,
}));

describe('CI/CD Generator Service', () => {
  let generator: CICDGeneratorService;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new CICDGeneratorService();
  });

  describe('Pipeline Generation', () => {
    it('should generate GitHub Actions pipeline', async () => {
      const config = {
        platform: 'github' as const,
        language: 'typescript',
        framework: 'nextjs',
        projectType: 'fullstack' as const,
        testing: { unit: true, integration: true },
        deployment: {
          provider: 'vercel',
          environment: 'production',
          strategy: 'rolling' as const,
        },
      };

      const mockPipeline = `name: CI/CD Pipeline
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test`;

      mockAggregator.complete.mockResolvedValue(mockPipeline);

      const result = await generator.generateGitHubActions(config);

      expect(result.platform).toBe('github');
      expect(result.filename).toBe('.github/workflows/ci-cd.yml');
      expect(result.content).toContain('CI/CD Pipeline');
    });

    it('should generate complete pipeline suite', async () => {
      const config = {
        platform: 'github' as const,
        language: 'typescript',
        projectType: 'frontend' as const,
        testing: { unit: true, coverage: true },
        docker: { enabled: true, multiStage: true },
        security: { dependencyScan: true },
      };

      mockAggregator.complete.mockResolvedValue('Generated pipeline content');

      const pipelines = await generator.generatePipeline(config);

      expect(pipelines.length).toBeGreaterThan(1);
    });
  });

  describe('Docker Compose Generation', () => {
    it('should generate Docker Compose file', async () => {
      const config = {
        platform: 'github' as const,
        language: 'typescript',
        projectType: 'backend' as const,
      };

      const mockCompose = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development`;

      mockAggregator.complete.mockResolvedValue(mockCompose);

      const result = await generator.generateDockerCompose(config, ['postgres', 'redis']);

      expect(result).toContain('version');
      expect(result).toContain('services');
    });
  });

  describe('Kubernetes Manifests', () => {
    it('should generate Kubernetes manifests', async () => {
      const deploymentConfig = {
        provider: 'aws',
        environment: 'production',
        config: {
          replicas: 3,
          containerPort: 3000,
        },
      };

      const mockManifests = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app`;

      mockAggregator.complete.mockResolvedValue(mockManifests);

      const result = await generator.generateKubernetesManifests(deploymentConfig);

      expect(result.deployment).toContain('Deployment');
    });
  });

  describe('Deployment Workflow', () => {
    it('should generate deployment workflow', async () => {
      const mockWorkflow = `name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: echo "Deploying to production..."`;

      mockAggregator.complete.mockResolvedValue(mockWorkflow);

      const result = await generator.generateDeploymentWorkflow('vercel', {
        environment: 'production',
        region: 'us-west-1',
      });

      expect(result).toContain('Deploy to Production');
      expect(result).toContain('vercel');
    });
  });

  describe('Pipeline Templates', () => {
    it('should return available templates', () => {
      const templates = generator.getAvailableTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('platforms');
      expect(templates[0]).toHaveProperty('languages');
    });

    it('should have Node.js fullstack template', () => {
      const templates = generator.getAvailableTemplates();
      const nodeTemplate = templates.find((t) => t.id === 'nodejs-fullstack');

      expect(nodeTemplate).toBeDefined();
      expect(nodeTemplate?.languages).toContain('javascript');
      expect(nodeTemplate?.languages).toContain('typescript');
    });
  });

  describe('Deployment Strategy', () => {
    it('should suggest rolling deployment for high traffic', async () => {
      const strategy = await generator.suggestDeploymentStrategy(
        'api',
        'high',
        'low'
      );

      expect(strategy.recommended).toBeDefined();
      expect(strategy.alternatives).toBeDefined();
      expect(strategy.rationale).toBeDefined();
    });

    it('should suggest blue-green for medium traffic', async () => {
      const strategy = await generator.suggestDeploymentStrategy(
        'webapp',
        'medium',
        'medium'
      );

      expect(strategy.recommended).toBe('blue-green');
    });

    it('should suggest canary for gradual rollout', async () => {
      const strategy = await generator.suggestDeploymentStrategy(
        'enterprise',
        'high',
        'medium'
      );

      expect(strategy.recommended).toBe('canary');
    });
  });

  describe('Pipeline Validation', () => {
    it('should validate GitHub Actions pipeline', async () => {
      const validPipeline = `name: Valid Pipeline
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3`;

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          valid: true,
          errors: [],
          warnings: [],
          suggestions: ['Consider adding concurrency group'],
        })
      );

      const result = await generator.validatePipeline(validPipeline, 'github');

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect issues in invalid pipeline', async () => {
      const invalidPipeline = `name: Invalid Pipeline
# Missing 'on' trigger`;

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          valid: false,
          errors: ['Missing trigger configuration'],
          warnings: [],
          suggestions: ['Add on: push: branches: [main]'],
        })
      );

      const result = await generator.validatePipeline(invalidPipeline, 'github');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Pipeline Optimization', () => {
    it('should optimize pipeline for performance', async () => {
      const slowPipeline = `name: Slow Pipeline
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install
        run: npm install
      - name: Test
        run: npm test`;

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          optimized: 'Optimized pipeline with caching',
          improvements: ['Added dependency caching', 'Parallelized jobs'],
          estimatedTimeReduction: '40% faster',
        })
      );

      const result = await generator.optimizePipeline(slowPipeline, 'github');

      expect(result.optimized).toBeDefined();
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.estimatedTimeReduction).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    it('should generate multi-environment configuration', async () => {
      const baseConfig = {
        platform: 'github' as const,
        language: 'typescript',
        projectType: 'fullstack' as const,
      };

      mockAggregator.complete.mockResolvedValue('Pipeline content');

      const pipelines = await generator.generateEnvironmentConfig(baseConfig, [
        'development',
        'staging',
        'production',
      ]);

      expect(pipelines.size).toBe(3);
      expect(pipelines.has('development')).toBe(true);
      expect(pipelines.has('staging')).toBe(true);
      expect(pipelines.has('production')).toBe(true);
    });
  });

  describe('Testing Pipeline', () => {
    it('should generate testing pipeline', async () => {
      const config = {
        platform: 'github' as const,
        language: 'typescript',
        projectType: 'frontend' as const,
        testing: { unit: true, integration: true, e2e: true, coverage: true },
      };

      mockAggregator.complete.mockResolvedValue('Testing pipeline content');

      const pipeline = await generator.generateTestingPipeline(config);

      expect(pipeline.name).toBe('Testing Pipeline');
      expect(pipeline.platform).toBe('github');
    });
  });

  describe('Security Pipeline', () => {
    it('should generate security scanning pipeline', async () => {
      const config = {
        platform: 'github' as const,
        language: 'typescript',
        projectType: 'fullstack' as const,
        security: {
          dependencyScan: true,
          codeScan: true,
          secretsScan: true,
        },
      };

      mockAggregator.complete.mockResolvedValue('Security pipeline content');

      const pipeline = await generator.generateSecurityScanningPipeline(config);

      expect(pipeline.name).toBe('Security Scanning Pipeline');
      expect(pipeline.description).toContain('Security');
    });
  });
});
