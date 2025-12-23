import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// AI Review State
export interface AIIssue {
  line: number;
  column: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  explanation?: string;
  suggestion?: string;
}

export interface AIReview {
  filePath: string;
  score: number;
  issues: AIIssue[];
  summary: string;
  highlights: Array<{ type: 'strength' | 'improvement'; message: string; line?: number }>;
  timestamp: Date;
}

export interface ReviewStats {
  totalFiles: number;
  totalIssues: number;
  criticalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface AIReviewState {
  currentReview: AIReview | null;
  reviewHistory: Map<string, ReviewStats>;
  reviews: AIReview[];
  isReviewing: boolean;
  reviewProgress: number;
  reviewError: string | null;

  // Actions
  setCurrentReview: (review: AIReview | null) => void;
  addReview: (review: AIReview) => void;
  setIsReviewing: (isReviewing: boolean) => void;
  setReviewProgress: (progress: number) => void;
  setReviewError: (error: string | null) => void;
  clearReviews: () => void;
  getReviewStats: (filePath: string) => ReviewStats | null;
}

// CI/CD State
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
}

interface CICDState {
  pipelines: GeneratedPipeline[];
  currentConfig: PipelineConfig | null;
  templates: Array<{ id: string; name: string; description: string }>;
  isGenerating: boolean;
  generationProgress: number;
  generationError: string | null;
  deploymentStrategy: {
    recommended: string;
    alternatives: string[];
    rationale: string;
  } | null;

  // Actions
  setPipelines: (pipelines: GeneratedPipeline[]) => void;
  addPipeline: (pipeline: GeneratedPipeline) => void;
  setCurrentConfig: (config: PipelineConfig | null) => void;
  setTemplates: (templates: any[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;
  setDeploymentStrategy: (strategy: any) => void;
  clearPipelines: () => void;
}

// Architecture State
export interface ArchitectureNode {
  name: string;
  type: 'folder' | 'file' | 'component';
  path: string;
  children?: ArchitectureNode[];
  description?: string;
}

export interface ArchitectureState {
  generatedArchitecture: {
    projectName: string;
    description: string;
    structure: ArchitectureNode[];
    recommendedTechnologies: Array<{ name: string; category: string; reason: string }>;
    patterns: string[];
    rationale: string;
  } | null;
  folderStructure: ArchitectureNode[];
  isGenerating: boolean;
  generationError: string | null;
  selectedTemplate: string | null;

  // Actions
  setGeneratedArchitecture: (architecture: any) => void;
  setFolderStructure: (structure: ArchitectureNode[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | null) => void;
  setSelectedTemplate: (templateId: string | null) => void;
  clearArchitecture: () => void;
}

// Test Generation State
export interface TestCase {
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e';
  code: string;
  edgeCases: string[];
}

export interface TestGenerationState {
  generatedTests: TestCase[];
  currentFile: string | null;
  testFramework: string;
  coverageGoal: number;
  isGenerating: boolean;
  generationProgress: number;
  generationError: string | null;
  supportedFrameworks: string[];

  // Actions
  setGeneratedTests: (tests: TestCase[]) => void;
  addTestCase: (testCase: TestCase) => void;
  setCurrentFile: (filePath: string | null) => void;
  setTestFramework: (framework: string) => void;
  setCoverageGoal: (goal: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;
  setSupportedFrameworks: (frameworks: string[]) => void;
  clearTests: () => void;
}

// AI Configuration State
export interface AIConfigState {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  availableModels: Record<string, Array<{ id: string; name: string; description: string }>>;

  // Actions
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setAvailableModels: (models: Record<string, any[]>) => void;
}

// Combined AI Store
interface AIStoreState extends AIReviewState, CICDState, ArchitectureState, TestGenerationState, AIConfigState {}

const aiReviewStore = devtools<AIReviewState>(
  (set, get) => ({
    currentReview: null,
    reviewHistory: new Map(),
    reviews: [],
    isReviewing: false,
    reviewProgress: 0,
    reviewError: null,

    setCurrentReview: (review) => set({ currentReview: review }),
    addReview: (review) => set((state) => ({ reviews: [...state.reviews, review] })),
    setIsReviewing: (isReviewing) => set({ isReviewing }),
    setReviewProgress: (progress) => set({ reviewProgress: progress }),
    setReviewError: (error) => set({ reviewError: error }),
    clearReviews: () => set({ reviews: [], currentReview: null }),
    getReviewStats: (filePath) => get().reviewHistory.get(filePath) || null,
  }),
  { name: 'ai-review-store' }
);

const cicdStore = devtools<CICDState>(
  (set) => ({
    pipelines: [],
    currentConfig: null,
    templates: [],
    isGenerating: false,
    generationProgress: 0,
    generationError: null,
    deploymentStrategy: null,

    setPipelines: (pipelines) => set({ pipelines }),
    addPipeline: (pipeline) => set((state) => ({ pipelines: [...state.pipelines, pipeline] })),
    setCurrentConfig: (config) => set({ currentConfig: config }),
    setTemplates: (templates) => set({ templates }),
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setGenerationProgress: (progress) => set({ generationProgress: progress }),
    setGenerationError: (error) => set({ generationError: error }),
    setDeploymentStrategy: (strategy) => set({ deploymentStrategy: strategy }),
    clearPipelines: () => set({ pipelines: [] }),
  }),
  { name: 'ai-cicd-store' }
);

const architectureStore = devtools<ArchitectureState>(
  (set) => ({
    generatedArchitecture: null,
    folderStructure: [],
    isGenerating: false,
    generationError: null,
    selectedTemplate: null,

    setGeneratedArchitecture: (architecture) => set({ generatedArchitecture: architecture }),
    setFolderStructure: (structure) => set({ folderStructure: structure }),
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setGenerationError: (error) => set({ generationError: error }),
    setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),
    clearArchitecture: () => set({ generatedArchitecture: null, folderStructure: [] }),
  }),
  { name: 'ai-architecture-store' }
);

const testGenerationStore = devtools<TestGenerationState>(
  (set) => ({
    generatedTests: [],
    currentFile: null,
    testFramework: 'jest',
    coverageGoal: 80,
    isGenerating: false,
    generationProgress: 0,
    generationError: null,
    supportedFrameworks: [],

    setGeneratedTests: (tests) => set({ generatedTests: tests }),
    addTestCase: (testCase) => set((state) => ({ generatedTests: [...state.generatedTests, testCase] })),
    setCurrentFile: (filePath) => set({ currentFile: filePath }),
    setTestFramework: (framework) => set({ testFramework: framework }),
    setCoverageGoal: (goal) => set({ coverageGoal: goal }),
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setGenerationProgress: (progress) => set({ generationProgress: progress }),
    setGenerationError: (error) => set({ generationError: error }),
    setSupportedFrameworks: (frameworks) => set({ supportedFrameworks: frameworks }),
    clearTests: () => set({ generatedTests: [] }),
  }),
  { name: 'ai-test-store' }
);

const aiConfigStore = devtools<AIConfigState>(
  persist(
    (set) => ({
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      availableModels: {},

      setProvider: (provider) => set({ provider }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setAvailableModels: (models) => set({ availableModels: models }),
    }),
    { name: 'ai-config-storage' }
  ),
  { name: 'ai-config-store' }
);

// Export individual stores for selective usage
export const useAIReviewStore = aiReviewStore;
export const useCICDStore = cicdStore;
export const useArchitectureStore = architectureStore;
export const useTestGenerationStore = testGenerationStore;
export const useAIConfigStore = aiConfigStore;

// Export types
export type { AIStoreState };
