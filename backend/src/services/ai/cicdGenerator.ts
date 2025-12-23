import { aiAggregator } from './aiAggregator';
import { CodeFile, ReviewResult, ReviewCategory } from './types';

/**
 * CI/CD Pipeline Generator Service
 * 
 * Provides intelligent CI/CD pipeline generation capabilities including:
 * - Multi-platform pipeline generation (GitHub Actions, GitLab CI, Jenkins, etc.)
 * - Framework-specific configurations
 * - Deployment strategy optimization
 * - Security scanning integration
 * - Performance testing setup
 * - Docker and container orchestration support
 */

interface PipelineConfig {
  platform: 'github' | 'gitlab' | 'jenkins' | 'circleci' | 'azure';
  language: string;
  framework?: string;
  projectType: 'frontend' | 'backend' | 'fullstack' | 'library';
  testing?: {
    unit?: boolean;
    integration?: boolean;
    e2e?: boolean;
    coverage?: boolean;
    coverageThreshold?: number;
  };
  deployment?: {
    provider: string;
    environment: string;
    region?: string;
    strategy: 'direct' | 'blue-green' | 'canary' | 'rolling';
  };
  docker?: {
    enabled: boolean;
    baseImage?: string;
    multiStage?: boolean;
    registry?: string;
  };
  security?: {
    dependencyScan?: boolean;
    codeScan?: boolean;
    secretsScan?: boolean;
    containerScan?: boolean;
  };
  notifications?: {
    slack?: { channel: string; webhook: string };
    email?: string[];
    teams?: { webhook: string };
  };
  triggers?: {
    branches: string[];
    paths?: string[];
    tags?: string[];
    schedule?: string[];
  };
  cache?: {
    dependencies?: boolean;
    buildArtifacts?: boolean;
    dockerLayers?: boolean;
  };
  customSteps?: Array<{
    name: string;
    script: string;
    condition?: string;
  }>;
}

interface GeneratedPipeline {
  name: string;
  platform: string;
  filename: string;
  content: string;
  description: string;
  requirements?: string[];
  setupInstructions?: string[];
}

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  languages: string[];
  features: string[];
}

interface DeploymentConfig {
  provider: string;
  environment: string;
  config: Record<string, any>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

class CICDGeneratorService {
  private aggregator: any;
  private readonly SUPPORTED_PLATFORMS = ['github', 'gitlab', 'jenkins', 'circleci', 'azure'];
  private readonly SUPPORTED_LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'ruby', 'php', 'dotnet'
  ];
  private readonly FRAMEWORK_CONFIGS: Record<string, string[]> = {
    'react': ['nextjs', 'create-react-app', 'vite', 'gatsby'],
    'vue': ['nuxt', 'vue-cli', 'vite'],
    'angular': ['angular-cli'],
    'express': ['express', 'nestjs', 'fastify'],
    'django': ['django', 'django-rest-framework'],
    'flask': ['flask'],
    'spring': ['spring-boot', 'spring'],
    'rails': ['rails'],
    'laravel': ['laravel'],
    'nextjs': ['nextjs'],
    'nestjs': ['nestjs'],
    'fastapi': ['fastapi'],
    'go': ['gin', 'echo', 'fiber']
  };

  constructor() {
    this.aggregator = aiAggregator;
  }

  /**
   * Generate a complete CI/CD pipeline based on configuration
   */
  async generatePipeline(config: PipelineConfig): Promise<GeneratedPipeline[]> {
    this.validateConfig(config);

    const pipelines: GeneratedPipeline[] = [];

    // Generate main pipeline
    const mainPipeline = await this.generateMainPipeline(config);
    pipelines.push(mainPipeline);

    // Generate additional pipelines based on configuration
    if (config.docker?.enabled) {
      const dockerPipeline = await this.generateDockerPipeline(config);
      pipelines.push(dockerPipeline);
    }

    if (config.deployment) {
      const deployPipeline = await this.generateDeploymentPipeline(config);
      pipelines.push(deployPipeline);
    }

    // Generate security scanning pipeline
    if (config.security && Object.values(config.security).some(v => v)) {
      const securityPipeline = await this.generateSecurityPipeline(config);
      pipelines.push(securityPipeline);
    }

    return pipelines;
  }

  /**
   * Generate a GitHub Actions workflow
   */
  async generateGitHubActions(config: PipelineConfig): Promise<GeneratedPipeline> {
    const configWithPlatform = { ...config, platform: 'github' as const };
    return this.generateMainPipeline(configWithPlatform);
  }

  /**
   * Generate a GitLab CI configuration
   */
  async generateGitLabCI(config: PipelineConfig): Promise<GeneratedPipeline> {
    const configWithPlatform = { ...config, platform: 'gitlab' as const };
    return this.generateMainPipeline(configWithPlatform);
  }

  /**
   * Generate a Jenkinsfile
   */
  async generateJenkinsfile(config: PipelineConfig): Promise<GeneratedPipeline> {
    const configWithPlatform = { ...config, platform: 'jenkins' as const };
    return this.generateMainPipeline(configWithPlatform);
  }

  /**
   * Generate a CircleCI configuration
   */
  async generateCircleCI(config: PipelineConfig): Promise<GeneratedPipeline> {
    const configWithPlatform = { ...config, platform: 'circleci' as const };
    return this.generateMainPipeline(configWithPlatform);
  }

  /**
   * Generate Azure DevOps pipeline
   */
  async generateAzurePipeline(config: PipelineConfig): Promise<GeneratedPipeline> {
    const configWithPlatform = { ...config, platform: 'azure' as const };
    return this.generateMainPipeline(configWithPlatform);
  }

  /**
   * Generate Docker Compose configuration for local development
   */
  async generateDockerCompose(config: PipelineConfig, services: string[]): Promise<string> {
    const prompt = `Generate a Docker Compose configuration for local development and testing.

Configuration:
- Platform: ${config.platform}
- Language: ${config.language}
- Framework: ${config.framework || 'Not specified'}
- Project Type: ${config.projectType}
- Additional Services: ${services.join(', ')}

Requirements:
1. Include all necessary services for development (database, cache, etc.)
2. Set up proper networking between services
3. Include volume mounts for hot-reload
4. Configure environment variables appropriately
5. Add health checks for dependencies
6. Support both local and CI environments

Generate a complete docker-compose.yml file with proper indentation and comments.`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'docker-compose',
        temperature: 0.3
      });

      return this.cleanDockerComposeResponse(response);
    } catch (error) {
      console.error('Docker Compose generation failed:', error);
      throw new Error(`Failed to generate Docker Compose: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Kubernetes deployment manifests
   */
  async generateKubernetesManifests(config: DeploymentConfig): Promise<{
    deployment: string;
    service: string;
    ingress?: string;
    configmap?: string;
    secrets?: string;
    hpa?: string;
  }> {
    const prompt = `Generate Kubernetes deployment manifests for:

Provider: ${config.provider}
Environment: ${config.environment}
Configuration:
${JSON.stringify(config.config, null, 2)}

Generate the following Kubernetes manifests as a single YAML document with proper YAML separators (---):
1. Namespace (if environment-specific)
2. Deployment with proper replicas, resources, liveness/readiness probes
3. Service (ClusterIP or LoadBalancer based on provider)
4. Ingress (if configured)
5. ConfigMap for environment variables
6. Secrets for sensitive data (use placeholder values)
7. Horizontal Pod Autoscaler (HPA) if applicable

Use best practices:
- Use specific image tags, not 'latest'
- Set resource limits and requests
- Configure proper security contexts
- Add labels and selectors consistently
- Use ConfigMaps for configuration, Secrets for sensitive data`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'kubernetes',
        temperature: 0.3
      });

      return this.parseKubernetesResponse(response);
    } catch (error) {
      console.error('Kubernetes manifest generation failed:', error);
      throw new Error(`Failed to generate Kubernetes manifests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate GitHub Actions workflow for deployment
   */
  async generateDeploymentWorkflow(
    provider: string,
    config: {
      environment: string;
      region?: string;
      secrets?: Record<string, string>;
      environmentUrl?: string;
    }
  ): Promise<string> {
    const prompt = `Generate a GitHub Actions deployment workflow for ${provider} ${config.environment} environment.

Configuration:
- Provider: ${provider}
- Environment: ${config.environment}
- Region: ${config.region || 'Not specified'}
- Required Secrets: ${Object.keys(config.secrets || {}).join(', ') || 'None specified'}

The workflow should:
1. Trigger on push to main branch or via manual dispatch
2. Set up the appropriate CLI tool for ${provider}
3. Authenticate using secrets
4. Deploy to ${config.environment}
5. Post deployment status to GitHub
6. Handle rollback on failure
7. Comment the deployment URL if successful

Use the latest stable actions and include proper permissions.`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'deployment-workflow',
        temperature: 0.3
      });

      return response;
    } catch (error) {
      console.error('Deployment workflow generation failed:', error);
      throw new Error(`Failed to generate deployment workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate testing pipeline configuration
   */
  async generateTestingPipeline(config: PipelineConfig): Promise<GeneratedPipeline> {
    const prompt = `Generate a CI/CD pipeline for testing only.

Project Configuration:
- Language: ${config.language}
- Framework: ${config.framework || 'Not specified'}
- Project Type: ${config.projectType}
- Testing Options:
  - Unit Tests: ${config.testing?.unit ? 'Enabled' : 'Disabled'}
  - Integration Tests: ${config.testing?.integration ? 'Enabled' : 'Disabled'}
  - E2E Tests: ${config.testing?.e2e ? 'Enabled' : 'Disabled'}
  - Coverage: ${config.testing?.coverage ? `Enabled (threshold: ${config.testing.coverageThreshold}%)` : 'Disabled'}

Platform: ${config.platform}

Generate a complete pipeline that:
1. Installs dependencies with proper caching
2. Runs linting and type checking
3. Executes unit tests with coverage reporting
4. Runs integration tests if enabled
5. Executes E2E tests if enabled
6. Reports coverage metrics
7. Fails on coverage threshold breach if set

Return the complete pipeline configuration file.`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'testing-pipeline',
        temperature: 0.3
      });

      return {
        name: 'Testing Pipeline',
        platform: config.platform,
        filename: this.getFilename(config.platform, 'testing'),
        content: response,
        description: 'Automated testing pipeline with unit, integration, and E2E tests'
      };
    } catch (error) {
      console.error('Testing pipeline generation failed:', error);
      throw new Error(`Failed to generate testing pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate security scanning pipeline
   */
  async generateSecurityScanningPipeline(config: PipelineConfig): Promise<GeneratedPipeline> {
    const prompt = `Generate a CI/CD pipeline for security scanning.

Security Options:
- Dependency Scanning: ${config.security?.dependencyScan ? 'Enabled' : 'Disabled'}
- Code Analysis: ${config.security?.codeScan ? 'Enabled' : 'Disabled'}
- Secrets Detection: ${config.security?.secretsScan ? 'Enabled' : 'Disabled'}
- Container Scanning: ${config.security?.containerScan ? 'Enabled' : 'Disabled'}

Project Configuration:
- Language: ${config.language}
- Framework: ${config.framework || 'Not specified'}
- Platform: ${config.platform}

The pipeline should:
1. Check dependencies for known vulnerabilities (Snyk, Dependabot, or equivalent)
2. Perform static code analysis (SonarQube, CodeQL, or equivalent)
3. Scan for hardcoded secrets and credentials
4. Scan container images for vulnerabilities (if Docker is used)
5. Generate security reports
6. Fail on critical/high vulnerabilities
7. Upload results as artifacts

Return the complete pipeline configuration file.`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'security-scanning',
        temperature: 0.3
      });

      return {
        name: 'Security Scanning Pipeline',
        platform: config.platform,
        filename: this.getFilename(config.platform, 'security'),
        content: response,
        description: 'Comprehensive security scanning pipeline for vulnerabilities and secrets'
      };
    } catch (error) {
      console.error('Security scanning pipeline generation failed:', error);
      throw new Error(`Failed to generate security scanning pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate an existing pipeline configuration
   */
  async validatePipeline(content: string, platform: string): Promise<ValidationResult> {
    const prompt = `Validate the following ${platform} CI/CD pipeline configuration:

\`\`\`
${content}
\`\`\`

Check for:
1. Syntax errors
2. Missing required fields
3. Deprecated actions or steps
4. Security issues (hardcoded secrets, insecure settings)
5. Performance issues (missing caches, inefficient steps)
6. Best practices violations
7. Incomplete configurations

Return a JSON object with:
{
  "valid": boolean,
  "errors": ["list of errors"],
  "warnings": ["list of warnings"],
  "suggestions": ["list of improvement suggestions"]
}`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'pipeline-validation',
        temperature: 0.2
      });

      return this.parseValidationResponse(response);
    } catch (error) {
      console.error('Pipeline validation failed:', error);
      return {
        valid: false,
        errors: ['Failed to validate pipeline'],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Get available pipeline templates
   */
  getAvailableTemplates(): PipelineTemplate[] {
    return [
      {
        id: 'nodejs-fullstack',
        name: 'Node.js Full Stack',
        description: 'Complete CI/CD for Node.js applications with frontend and backend',
        platforms: ['github', 'gitlab', 'jenkins'],
        languages: ['javascript', 'typescript'],
        features: ['docker', 'testing', 'deployment', 'security']
      },
      {
        id: 'python-django',
        name: 'Python Django',
        description: 'CI/CD for Django applications with database migrations',
        platforms: ['github', 'gitlab', 'jenkins'],
        languages: ['python'],
        features: ['docker', 'testing', 'deployment']
      },
      {
        id: 'react-spa',
        name: 'React Single Page App',
        description: 'CI/CD for React/Vue/Angular SPAs with build optimization',
        platforms: ['github', 'gitlab', 'circleci'],
        languages: ['javascript', 'typescript'],
        features: ['testing', 'deployment', 'cdn']
      },
      {
        id: 'golang-api',
        name: 'Go API Service',
        description: 'CI/CD for Go microservices and APIs',
        platforms: ['github', 'gitlab', 'jenkins'],
        languages: ['go'],
        features: ['docker', 'testing', 'deployment', 'security']
      },
      {
        id: 'java-spring',
        name: 'Java Spring Boot',
        description: 'CI/CD for Spring Boot applications',
        platforms: ['github', 'gitlab', 'jenkins', 'azure'],
        languages: ['java'],
        features: ['docker', 'testing', 'deployment', 'security']
      },
      {
        id: 'dotnet-core',
        name: '.NET Core',
        description: 'CI/CD for .NET Core applications',
        platforms: ['github', 'azure'],
        languages: ['dotnet'],
        features: ['docker', 'testing', 'deployment']
      }
    ];
  }

  /**
   * Suggest deployment strategies based on project characteristics
   */
  async suggestDeploymentStrategy(
    projectType: string,
    traffic: string,
    tolerance: string
  ): Promise<{
    recommended: string;
    alternatives: string[];
    rationale: string;
  }> {
    const prompt = `Suggest CI/CD deployment strategies based on:

Project Type: ${projectType}
Expected Traffic: ${traffic}
Downtime Tolerance: ${tolerance}

Consider:
- Rolling deployments for zero-downtime updates
- Blue-green deployments for instant switching
- Canary deployments for gradual rollout
- Blue-green with rollback capability
- Feature flags for gradual feature release

Return a JSON object with:
{
  "recommended": "best strategy",
  "alternatives": ["alternative 1", "alternative 2"],
  "rationale": "explanation of recommendation"
}`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'deployment-strategy',
        temperature: 0.3
      });

      return this.parseDeploymentStrategyResponse(response);
    } catch (error) {
      // Fallback to rule-based recommendation
      return this.getDefaultDeploymentStrategy(projectType, traffic, tolerance);
    }
  }

  /**
   * Optimize existing pipeline for performance
   */
  async optimizePipeline(content: string, platform: string): Promise<{
    optimized: string;
    improvements: string[];
    estimatedTimeReduction: string;
  }> {
    const prompt = `Optimize the following ${platform} CI/CD pipeline for performance:

\`\`\`
${content}
\`\`\`

Identify and implement:
1. Caching opportunities (dependencies, build artifacts)
2. Parallel execution possibilities
3. Dependency installation optimizations
4. Build process improvements
5. Unnecessary steps removal
6. Docker layer caching
7. Conditional execution based on changed files

Return a JSON object with:
{
  "optimized": "complete optimized pipeline",
  "improvements": ["list of specific improvements made"],
  "estimatedTimeReduction": "e.g., '30% faster'"
}`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'pipeline-optimization',
        temperature: 0.3
      });

      return this.parseOptimizationResponse(response);
    } catch (error) {
      console.error('Pipeline optimization failed:', error);
      return {
        optimized: content,
        improvements: ['Failed to optimize'],
        estimatedTimeReduction: '0%'
      };
    }
  }

  /**
   * Generate multi-environment configuration
   */
  async generateEnvironmentConfig(
    baseConfig: PipelineConfig,
    environments: string[]
  ): Promise<Map<string, GeneratedPipeline>> {
    const pipelines = new Map<string, GeneratedPipeline>();

    for (const env of environments) {
      const envConfig = {
        ...baseConfig,
        deployment: {
          ...baseConfig.deployment,
          environment: env
        }
      };

      const pipeline = await this.generateMainPipeline(envConfig);
      pipelines.set(env, pipeline);
    }

    return pipelines;
  }

  // Private helper methods

  private validateConfig(config: PipelineConfig): void {
    if (!this.SUPPORTED_PLATFORMS.includes(config.platform)) {
      throw new Error(`Unsupported platform: ${config.platform}`);
    }

    if (!this.SUPPORTED_LANGUAGES.includes(config.language)) {
      console.warn(`Language ${config.language} may not be fully supported`);
    }
  }

  private async generateMainPipeline(config: PipelineConfig): Promise<GeneratedPipeline> {
    const prompt = this.buildPipelinePrompt(config);

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'pipeline-generation',
        temperature: 0.3
      });

      return {
        name: this.getPipelineName(config),
        platform: config.platform,
        filename: this.getFilename(config.platform, 'main'),
        content: response,
        description: this.getPipelineDescription(config),
        requirements: this.getRequirements(config),
        setupInstructions: this.getSetupInstructions(config)
      };
    } catch (error) {
      console.error('Pipeline generation failed:', error);
      throw new Error(`Failed to generate pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPipelinePrompt(config: PipelineConfig): string {
    return `Generate a complete CI/CD pipeline for:

**Project Configuration:**
- Platform: ${config.platform}
- Language: ${config.language}
- Framework: ${config.framework || 'Not specified'}
- Project Type: ${config.projectType}

**Testing Configuration:**
- Unit Tests: ${config.testing?.unit ? 'Enabled' : 'Disabled'}
- Integration Tests: ${config.testing?.integration ? 'Enabled' : 'Disabled'}
- E2E Tests: ${config.testing?.e2e ? 'Enabled' : 'Disabled'}
- Coverage: ${config.testing?.coverage ? `Enabled (threshold: ${config.testing.coverageThreshold}%)` : 'Disabled'}

**Deployment Configuration:**
- Provider: ${config.deployment?.provider || 'Not configured'}
- Environment: ${config.deployment?.environment || 'Not configured'}
- Strategy: ${config.deployment?.strategy || 'rolling'}

**Docker Configuration:**
- Enabled: ${config.docker?.enabled || false}
- Base Image: ${config.docker?.baseImage || 'Not specified'}
- Multi-stage Build: ${config.docker?.multiStage || false}

**Security Configuration:**
- Dependency Scan: ${config.security?.dependencyScan ? 'Enabled' : 'Disabled'}
- Code Scan: ${config.security?.codeScan ? 'Enabled' : 'Disabled'}
- Secrets Scan: ${config.security?.secretsScan ? 'Enabled' : 'Disabled'}
- Container Scan: ${config.security?.containerScan ? 'Enabled' : 'Disabled'}

**Triggers:**
- Branches: ${config.triggers?.branches?.join(', ') || 'main, develop'}
- Paths: ${config.triggers?.paths?.join(', ') || 'All paths'}
- Schedule: ${config.triggers?.schedule?.join(', ') || 'No scheduled runs'}

**Caching:**
- Dependencies: ${config.cache?.dependencies ? 'Enabled' : 'Disabled'}
- Build Artifacts: ${config.cache?.buildArtifacts ? 'Enabled' : 'Disabled'}
- Docker Layers: ${config.cache?.dockerLayers ? 'Enabled' : 'Disabled'}

Generate a complete, production-ready CI/CD pipeline configuration file with:
1. Proper syntax for ${config.platform}
2. All necessary jobs and steps
3. Proper error handling and notifications
4. Optimized caching strategies
5. Security scanning integration (if enabled)
6. Deployment steps (if configured)
7. Appropriate triggers and conditions

Include detailed comments explaining key sections.`;
  }

  private async generateDockerPipeline(config: PipelineConfig): Promise<GeneratedPipeline> {
    const prompt = `Generate a Docker-focused CI/CD pipeline for:

Language: ${config.language}
Framework: ${config.framework || 'Not specified'}
Multi-stage Build: ${config.docker?.multiStage || false}
Registry: ${config.docker?.registry || 'Not specified'}

Platform: ${config.platform}

The pipeline should:
1. Build Docker images with proper tagging
2. Run container security scans
3. Push to registry on main branch
4. Scan for vulnerabilities before pushing
5. Include multi-stage build optimization
6. Handle image versioning (semantic versioning or commit SHA)

Generate complete pipeline configuration.`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'docker-pipeline',
        temperature: 0.3
      });

      return {
        name: 'Docker Pipeline',
        platform: config.platform,
        filename: this.getFilename(config.platform, 'docker'),
        content: response,
        description: 'Docker image building and publishing pipeline'
      };
    } catch (error) {
      throw new Error(`Failed to generate Docker pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateDeploymentPipeline(config: PipelineConfig): Promise<GeneratedPipeline> {
    const prompt = `Generate a deployment pipeline for:

Provider: ${config.deployment?.provider}
Environment: ${config.deployment?.environment}
Region: ${config.deployment?.region || 'Not specified'}
Strategy: ${config.deployment?.strategy}
Platform: ${config.platform}

The pipeline should:
1. Trigger after successful build and test
2. Authenticate with ${config.deployment?.provider}
3. Deploy using ${config.deployment?.strategy} deployment strategy
4. Verify deployment health
5. Notify on success/failure
6. Support rollback on failure
7. Update environment with deployment URL

Generate complete pipeline configuration.`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'deployment-pipeline',
        temperature: 0.3
      });

      return {
        name: 'Deployment Pipeline',
        platform: config.platform,
        filename: this.getFilename(config.platform, 'deployment'),
        content: response,
        description: `Deployment pipeline for ${config.deployment?.environment} environment`
      };
    } catch (error) {
      throw new Error(`Failed to generate deployment pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateSecurityPipeline(config: PipelineConfig): Promise<GeneratedPipeline> {
    return this.generateSecurityScanningPipeline(config);
  }

  private getPipelineName(config: PipelineConfig): string {
    return `${config.projectType.charAt(0).toUpperCase() + config.projectType.slice(1)} CI/CD Pipeline`;
  }

  private getFilename(platform: string, type: string): string {
    const filenames: Record<string, Record<string, string>> = {
      github: {
        main: '.github/workflows/ci-cd.yml',
        docker: '.github/workflows/docker.yml',
        deployment: '.github/workflows/deploy.yml',
        security: '.github/workflows/security.yml',
        testing: '.github/workflows/tests.yml'
      },
      gitlab: {
        main: '.gitlab-ci.yml',
        docker: '.gitlab-ci-docker.yml',
        deployment: '.gitlab-ci-deploy.yml',
        security: '.gitlab-ci-security.yml',
        testing: '.gitlab-ci-tests.yml'
      },
      jenkins: {
        main: 'Jenkinsfile',
        docker: 'Jenkinsfile.docker',
        deployment: 'Jenkinsfile.deploy',
        security: 'Jenkinsfile.security',
        testing: 'Jenkinsfile.tests'
      },
      circleci: {
        main: '.circleci/config.yml',
        docker: '.circleci/docker.yml',
        deployment: '.circleci/deploy.yml',
        security: '.circleci/security.yml',
        testing: '.circleci/tests.yml'
      },
      azure: {
        main: 'azure-pipelines.yml',
        docker: 'azure-pipelines.docker.yml',
        deployment: 'azure-pipelines.deploy.yml',
        security: 'azure-pipelines.security.yml',
        testing: 'azure-pipelines.tests.yml'
      }
    };

    return filenames[platform]?.[type] || `pipeline.${platform}.${type}`;
  }

  private getPipelineDescription(config: PipelineConfig): string {
    const parts = [`${config.language} ${config.projectType} project`];
    if (config.framework) parts.push(config.framework);
    if (config.testing?.unit) parts.push('with tests');
    if (config.docker?.enabled) parts.push('Docker support');
    if (config.deployment) parts.push(`${config.deployment.provider} deployment`);
    return parts.join(' - ');
  }

  private getRequirements(config: PipelineConfig): string[] {
    const requirements: string[] = [];
    
    if (config.platform === 'github') {
      requirements.push('GitHub repository with Actions enabled');
    }
    if (config.deployment?.provider) {
      requirements.push(`${config.deployment.provider} account with API access`);
    }
    if (config.docker?.enabled) {
      requirements.push('Docker installed on runners');
    }
    if (config.security?.dependencyScan) {
      requirements.push('Snyk, Dependabot, or equivalent account');
    }

    return requirements;
  }

  private getSetupInstructions(config: PipelineConfig): string[] {
    const instructions: string[] = [];

    instructions.push(`Create the pipeline file at: ${this.getFilename(config.platform, 'main')}`);

    if (config.platform === 'github') {
      instructions.push('Ensure .github/workflows directory exists');
    }

    if (config.deployment?.provider) {
      instructions.push(`Configure ${config.deployment.provider} credentials in repository secrets`);
      instructions.push(`Add required environment variables to the pipeline`);
    }

    if (config.docker?.registry) {
      instructions.push(`Configure Docker registry authentication in repository secrets`);
    }

    if (config.notifications?.slack) {
      instructions.push('Configure Slack webhook URL in repository secrets');
    }

    return instructions;
  }

  private cleanDockerComposeResponse(response: string): string {
    // Remove markdown code block markers
    return response
      .replace(/```yaml\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }

  private parseKubernetesResponse(response: string): {
    deployment: string;
    service: string;
    ingress?: string;
    configmap?: string;
    secrets?: string;
    hpa?: string;
  } {
    // Split by YAML document separators
    const documents = response.split(/^---$/m);
    
    const result: any = {};
    
    for (const doc of documents) {
      if (doc.includes('kind: Deployment')) {
        result.deployment = doc.trim();
      } else if (doc.includes('kind: Service')) {
        result.service = doc.trim();
      } else if (doc.includes('kind: Ingress')) {
        result.ingress = doc.trim();
      } else if (doc.includes('kind: ConfigMap')) {
        result.configmap = doc.trim();
      } else if (doc.includes('kind: Secret')) {
        result.secrets = doc.trim();
      } else if (doc.includes('kind: HorizontalPodAutoscaler')) {
        result.hpa = doc.trim();
      }
    }

    return result;
  }

  private parseValidationResponse(response: string): ValidationResult {
    try {
      return JSON.parse(response);
    } catch {
      return {
        valid: true,
        errors: [],
        warnings: ['Unable to parse validation response'],
        suggestions: []
      };
    }
  }

  private parseDeploymentStrategyResponse(response: string): {
    recommended: string;
    alternatives: string[];
    rationale: string;
  } {
    try {
      return JSON.parse(response);
    } catch {
      return this.getDefaultDeploymentStrategy('api', 'medium', 'low');
    }
  }

  private parseOptimizationResponse(response: string): {
    optimized: string;
    improvements: string[];
    estimatedTimeReduction: string;
  } {
    try {
      return JSON.parse(response);
    } catch {
      return {
        optimized: '',
        improvements: [],
        estimatedTimeReduction: '0%'
      };
    }
  }

  private getDefaultDeploymentStrategy(
    projectType: string,
    traffic: string,
    tolerance: string
  ): {
    recommended: string;
    alternatives: string[];
    rationale: string;
  } {
    if (tolerance === 'high') {
      return {
        recommended: 'rolling',
        alternatives: ['blue-green', 'canary'],
        rationale: 'High tolerance allows for rolling deployments with brief downtime'
      };
    } else if (traffic === 'high') {
      return {
        recommended: 'canary',
        alternatives: ['blue-green', 'rolling'],
        rationale: 'High traffic requires gradual rollout to minimize risk'
      };
    } else {
      return {
        recommended: 'blue-green',
        alternatives: ['rolling', 'canary'],
        rationale: 'Blue-green provides instant rollback capability with zero downtime'
      };
    }
  }
}

// Export singleton instance
export const cicdGenerator = new CICDGeneratorService();

// Export class for testing
export { CICDGeneratorService };
