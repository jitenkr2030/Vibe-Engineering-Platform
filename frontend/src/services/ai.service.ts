import { apiClient } from './api';

// AI Service Types
export interface AIReviewResult {
  reviewId?: string;
  result: {
    file: {
      path: string;
      language: string;
    };
    score: number;
    issues: Array<{
      line: number;
      column: number;
      severity: 'info' | 'warning' | 'error' | 'critical';
      category: string;
      message: string;
      explanation?: string;
      suggestion?: string;
    }>;
    summary: string;
    highlights: Array<{
      type: 'strength' | 'improvement';
      message: string;
      line?: number;
    }>;
  };
}

export interface PipelineConfig {
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
}

export interface GeneratedPipeline {
  name: string;
  platform: string;
  filename: string;
  content: string;
  description: string;
  requirements?: string[];
  setupInstructions?: string[];
}

export interface ArchitectureGenerationParams {
  description: string;
  requirements?: string[];
  constraints?: string[];
  preferences?: Record<string, any>;
}

export interface TestGenerationParams {
  fileContent: string;
  filePath: string;
  language?: string;
  testFramework?: string;
  coverageGoal?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export interface AIConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

class AIService {
  private basePath = '/api/v1/ai';

  // AI Status
  async getStatus() {
    const response = await apiClient.get(`${this.basePath}/status`);
    return response.data;
  }

  // AI Configuration
  async configureAI(config: AIConfig) {
    const response = await apiClient.post(`${this.basePath}/configure`, config);
    return response.data;
  }

  async getAvailableModels() {
    const response = await apiClient.get(`${this.basePath}/models`);
    return response.data;
  }

  // Code Review
  async reviewFile(
    fileContent: string,
    filePath: string,
    language?: string,
    options?: Record<string, any>
  ): Promise<{ data: AIReviewResult }> {
    const response = await apiClient.post(`${this.basePath}/review/file`, {
      fileContent,
      filePath,
      language,
      options,
    });
    return response.data;
  }

  async reviewBatch(
    files: Array<{ fileContent: string; filePath: string; language?: string }>,
    options?: Record<string, any>
  ): Promise<{ data: { totalFiles: number; results: AIReviewResult[] } }> {
    const response = await apiClient.post(`${this.basePath}/review/batch`, {
      files,
      options,
    });
    return response.data;
  }

  async reviewProject(
    projectId: string,
    options?: Record<string, any>
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/review/project/${projectId}`, {
      options,
    });
    return response.data;
  }

  async reviewSecurity(
    fileContent: string,
    filePath: string,
    language?: string
  ): Promise<{ data: AIReviewResult }> {
    const response = await apiClient.post(`${this.basePath}/review/security`, {
      fileContent,
      filePath,
      language,
    });
    return response.data;
  }

  async reviewPerformance(
    fileContent: string,
    filePath: string,
    language?: string
  ): Promise<{ data: AIReviewResult }> {
    const response = await apiClient.post(`${this.basePath}/review/performance`, {
      fileContent,
      filePath,
      language,
    });
    return response.data;
  }

  async reviewArchitecture(
    fileContent: string,
    filePath: string,
    language?: string,
    projectContext?: Record<string, any>
  ): Promise<{ data: AIReviewResult }> {
    const response = await apiClient.post(`${this.basePath}/review/architecture`, {
      fileContent,
      filePath,
      language,
      projectContext,
    });
    return response.data;
  }

  async getReviewHistory(filePath: string): Promise<{ data: any }> {
    const response = await apiClient.get(
      `${this.basePath}/review/history/${encodeURIComponent(filePath)}`
    );
    return response.data;
  }

  async getLearningResources(
    filePath: string,
    developerLevel?: string,
    areasForGrowth?: string[]
  ): Promise<{ data: any }> {
    const response = await apiClient.post(
      `${this.basePath}/review/learning/${encodeURIComponent(filePath)}`,
      { developerLevel, areasForGrowth }
    );
    return response.data;
  }

  async compareWithBestPractices(
    fileContent: string,
    filePath: string,
    pattern: string,
    language?: string
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/review/best-practices`, {
      fileContent,
      filePath,
      pattern,
      language,
    });
    return response.data;
  }

  async generateInlineComments(
    fileContent: string,
    filePath: string,
    language?: string
  ): Promise<{ data: { comments: Array<{ line: number; content: string; type: string }> } }> {
    const response = await apiClient.post(`${this.basePath}/review/inline-comments`, {
      fileContent,
      filePath,
      language,
    });
    return response.data;
  }

  // CI/CD Generator
  async getPipelineTemplates(): Promise<{ data: { templates: Array<{ id: string; name: string; description: string; platforms: string[]; languages: string[]; features: string[] }> } }> {
    const response = await apiClient.get(`${this.basePath}/cicd/templates`);
    return response.data;
  }

  async generatePipeline(config: PipelineConfig): Promise<{ data: { pipelines: GeneratedPipeline[]; count: number } }> {
    const response = await apiClient.post(`${this.basePath}/cicd/generate`, config);
    return response.data;
  }

  async generateGitHubActions(config: Partial<PipelineConfig>): Promise<{ data: GeneratedPipeline }> {
    const response = await apiClient.post(`${this.basePath}/cicd/github`, config);
    return response.data;
  }

  async generateDockerCompose(
    config: PipelineConfig,
    services?: string[]
  ): Promise<{ data: { filename: string; content: string } }> {
    const response = await apiClient.post(`${this.basePath}/cicd/docker-compose`, {
      config,
      services,
    });
    return response.data;
  }

  async generateKubernetes(
    provider: string,
    environment: string,
    config: Record<string, any>
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/cicd/kubernetes`, {
      provider,
      environment,
      config,
    });
    return response.data;
  }

  async suggestDeploymentStrategy(
    projectType: string,
    traffic: string,
    tolerance: string
  ): Promise<{ data: { recommended: string; alternatives: string[]; rationale: string } }> {
    const response = await apiClient.post(`${this.basePath}/cicd/deployment-strategy`, {
      projectType,
      traffic,
      tolerance,
    });
    return response.data;
  }

  async validatePipeline(
    content: string,
    platform: string
  ): Promise<{ data: { valid: boolean; errors: string[]; warnings: string[]; suggestions: string[] } }> {
    const response = await apiClient.post(`${this.basePath}/cicd/validate`, {
      content,
      platform,
    });
    return response.data;
  }

  async optimizePipeline(
    content: string,
    platform: string
  ): Promise<{ data: { optimized: string; improvements: string[]; estimatedTimeReduction: string } }> {
    const response = await apiClient.post(`${this.basePath}/cicd/optimize`, {
      content,
      platform,
    });
    return response.data;
  }

  // Architecture Generator
  async generateArchitecture(params: ArchitectureGenerationParams): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/architecture/generate`, params);
    return response.data;
  }

  async generateFolderStructure(
    projectType: string,
    framework?: string,
    language?: string,
    projectName?: string
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/architecture/structure`, {
      projectType,
      framework,
      language,
      projectName,
    });
    return response.data;
  }

  async getTechnologyRecommendations(
    projectType: string,
    requirements?: string[],
    constraints?: string[]
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/architecture/technologies`, {
      projectType,
      requirements,
      constraints,
    });
    return response.data;
  }

  async validateArchitecture(
    architecture: Record<string, any>,
    requirements?: string[],
    constraints?: string[]
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/architecture/validate`, {
      architecture,
      requirements,
      constraints,
    });
    return response.data;
  }

  async suggestImprovements(
    architecture: Record<string, any>,
    projectType?: string,
    focus?: string[]
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/architecture/improve`, {
      architecture,
      projectType,
      focus,
    });
    return response.data;
  }

  async getArchitecturePatterns(): Promise<{ data: { patterns: Record<string, any> } }> {
    const response = await apiClient.get(`${this.basePath}/architecture/patterns`);
    return response.data;
  }

  async getArchitectureTemplates(): Promise<{ data: { templates: any[] } }> {
    const response = await apiClient.get(`${this.basePath}/architecture/templates`);
    return response.data;
  }

  // Test Intelligence
  async generateUnitTests(
    fileContent: string,
    filePath: string,
    language?: string,
    testFramework?: string,
    coverageGoal?: number
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/tests/unit`, {
      fileContent,
      filePath,
      language,
      testFramework,
      coverageGoal,
    });
    return response.data;
  }

  async generateIntegrationTests(
    fileContents: string[],
    filePaths: string[],
    language?: string,
    testFramework?: string,
    endpoints?: string[]
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/tests/integration`, {
      fileContents,
      filePaths,
      language,
      testFramework,
      endpoints,
    });
    return response.data;
  }

  async generateE2ETests(
    projectType: string,
    pages: string[],
    userFlows: string[],
    testFramework?: string
  ): Promise<{ data: any }> {
    const response = await apiClient.post(`${this.basePath}/tests/e2e`, {
      projectType,
      pages,
      userFlows,
      testFramework,
    });
    return response.data;
  }

  async detectEdgeCases(
    fileContent: string,
    filePath: string,
    language?: string
  ): Promise<{ data: { edgeCases: any[] } }> {
    const response = await apiClient.post(`${this.basePath}/tests/edge-cases`, {
      fileContent,
      filePath,
      language,
    });
    return response.data;
  }

  async generateMockData(
    schema: Record<string, any>,
    count?: number,
    format?: string
  ): Promise<{ data: { mockData: any[] } }> {
    const response = await apiClient.post(`${this.basePath}/tests/mock-data`, {
      schema,
      count,
      format,
    });
    return response.data;
  }

  async getSupportedFrameworks(): Promise<{ data: { frameworks: string[] } }> {
    const response = await apiClient.get(`${this.basePath}/tests/frameworks`);
    return response.data;
  }
}

export const aiService = new AIService();
export default aiService;
