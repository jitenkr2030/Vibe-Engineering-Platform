// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  preferences: UserPreferences;
  subscription: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  ENTERPRISE = 'enterprise',
  TRIAL = 'trial'
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  codeStyle: CodeStylePreferences;
  aiSettings: AISettings;
  notifications: NotificationPreferences;
}

export interface CodeStylePreferences {
  indentSize: number;
  indentType: 'spaces' | 'tabs';
  lineWidth: number;
  trailingComma: boolean;
  semicolons: boolean;
  quoteType: 'single' | 'double';
}

export interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  autoApproval: boolean;
  approvalThreshold: 'low' | 'medium' | 'high';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  projectUpdates: boolean;
  qualityAlerts: boolean;
  deploymentStatus: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// Project & Codebase Types
// ============================================

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  techStack: TechStack;
  architecture: Architecture;
  files: ProjectFile[];
  collaborators: Collaborator[];
  settings: ProjectSettings;
  metrics: ProjectMetrics;
  memory: ProjectMemory;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  PUBLIC = 'public'
}

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DEPLOYED = 'deployed',
  ARCHIVED = 'archived'
}

export interface TechStack {
  frontend?: StackComponent;
  backend?: StackComponent;
  database?: StackComponent;
  infrastructure?: StackComponent;
  language: string;
  frameworks: string[];
  libraries: string[];
  tools: string[];
}

export interface StackComponent {
  name: string;
  version?: string;
  category: string;
}

export interface Architecture {
  type: 'monolith' | 'microservices' | 'serverless' | 'hybrid';
  pattern: ArchitecturePattern;
  components: ArchitectureComponent[];
  relationships: ComponentRelationship[];
  diagram?: string;
  description: string;
}

export enum ArchitecturePattern {
  MVC = 'mvc',
  MVVM = 'mvvm',
  CLEAN = 'clean',
  DDD = 'ddd',
  EVENT_DRIVEN = 'event_driven',
  MICROSERVICES = 'microservices',
  SERVERLESS = 'serverless'
}

export interface ArchitectureComponent {
  id: string;
  name: string;
  type: string;
  responsibilities: string[];
  dependencies: string[];
  techStack?: string;
}

export interface ComponentRelationship {
  from: string;
  to: string;
  type: 'calls' | 'depends_on' | 'publishes' | 'subscribes_to';
  description?: string;
}

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  type: FileType;
  content?: string;
  language: string;
  size: number;
  checksum: string;
  status: FileStatus;
  metadata: FileMetadata;
  versions: FileVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export enum FileType {
  FILE = 'file',
  DIRECTORY = 'directory',
  CONFIG = 'config',
  DOCUMENTATION = 'documentation',
  TEST = 'test'
}

export enum FileStatus {
  ACTIVE = 'active',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  STAGED = 'staged'
}

export interface FileMetadata {
  language?: string;
  framework?: string;
  linesOfCode?: number;
  complexity?: number;
  dependencies?: string[];
}

export interface FileVersion {
  id: string;
  content: string;
  message: string;
  authorId: string;
  timestamp: Date;
  checksum: string;
}

export interface Collaborator {
  userId: string;
  role: CollaboratorRole;
  permissions: Permission[];
  joinedAt: Date;
}

export enum CollaboratorRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  MANAGE = 'manage',
  DEPLOY = 'deploy',
  ADMIN = 'admin'
}

export interface ProjectSettings {
  defaultBranch: string;
  protectedBranches: string[];
  autoMerge: boolean;
  requireCodeReview: boolean;
  minimumReviewers: number;
  testCoverageThreshold: number;
  lintRules: string[];
  securityScanning: boolean;
  autoFormatting: boolean;
}

export interface ProjectMetrics {
  linesOfCode: number;
  fileCount: number;
  testCoverage: number;
  complexity: number;
  technicalDebt: number;
  securityScore: number;
  performanceScore: number;
  lastAnalyzedAt?: Date;
}

export interface ProjectMemory {
  preferences: Record<string, unknown>;
  decisions: ArchitectureDecision[];
  mistakes: MistakeRecord[];
  patterns: PatternRecord[];
  conversations: ConversationMemory[];
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  description: string;
  context: string;
  decision: string;
  alternatives: string[];
  consequences: string[];
  decidedAt: Date;
  decidedBy: string;
}

export interface MistakeRecord {
  id: string;
  description: string;
  solution: string;
  category: string;
  occurredAt: Date;
  preventedCount: number;
}

export interface PatternRecord {
  id: string;
  name: string;
  description: string;
  usage: number;
  lastUsedAt: Date;
  effectiveness: number;
}

export interface ConversationMemory {
  id: string;
  summary: string;
  context: string;
  keyDecisions: string[];
  timestamp: Date;
}

// ============================================
// Prompt & AI Types
// ============================================

export interface PromptSession {
  id: string;
  projectId: string;
  userId: string;
  messages: PromptMessage[];
  context: PromptContext;
  status: PromptSessionStatus;
  startedAt: Date;
  endedAt?: Date;
}

export enum PromptSessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface PromptMessage {
  id: string;
  role: PromptRole;
  content: string;
  attachments?: Attachment[];
  metadata: PromptMessageMetadata;
  timestamp: Date;
}

export enum PromptRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  MENTOR = 'mentor'
}

export interface PromptMessageMetadata {
  tokens?: number;
  model?: string;
  latency?: number;
  citations?: string[];
  quality?: QualityScore;
}

export interface Attachment {
  id: string;
  type: 'file' | 'image' | 'link' | 'snippet';
  name: string;
  content: string;
  size?: number;
}

export interface PromptContext {
  projectFiles: string[];
  architecture: Architecture;
  techStack: TechStack;
  recentDecisions: string[];
  userPreferences: Record<string, unknown>;
  scope: string;
  constraints: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  template: string;
  variables: TemplateVariable[];
  examples: string[];
  role: PromptRole;
  isSystem: boolean;
  usage: number;
  rating: number;
}

export enum PromptCategory {
  ARCHITECTURE = 'architecture',
  API_DESIGN = 'api_design',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  TESTING = 'testing',
  SECURITY = 'security',
  DEPLOYMENT = 'deployment',
  REFACTORING = 'refactoring',
  DOCUMENTATION = 'documentation'
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  required: boolean;
  default?: unknown;
  description: string;
  options?: string[];
}

// ============================================
// Quality Gate Types
// ============================================

export interface QualityGate {
  id: string;
  projectId: string;
  name: string;
  checks: QualityCheck[];
  status: QualityGateStatus;
  results: QualityResult[];
  createdAt: Date;
  updatedAt: Date;
}

export enum QualityGateStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning'
}

export interface QualityCheck {
  id: string;
  name: string;
  type: QualityCheckType;
  category: string;
  severity: Severity;
  description: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export enum QualityCheckType {
  LINT = 'lint',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  TEST = 'test',
  COMPLEXITY = 'complexity',
  STYLE = 'style',
  DOCS = 'docs',
  TYPE_CHECK = 'type_check'
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export interface QualityResult {
  checkId: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message: string;
  location?: ResultLocation;
  details?: Record<string, unknown>;
  suggestions?: string[];
}

export interface ResultLocation {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface QualityScore {
  overall: number;
  categories: Record<string, number>;
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: Date;
}

// ============================================
// Code Generation Types
// ============================================

export interface CodeGenerationRequest {
  projectId: string;
  userId: string;
  prompt: string;
  context: PromptContext;
  constraints: string[];
  style?: CodeStylePreferences;
  language?: string;
  framework?: string;
  testMode?: boolean;
}

export interface CodeGenerationResponse {
  id: string;
  files: GeneratedFile[];
  quality: QualityScore;
  explanation: string;
  alternatives?: GeneratedAlternative[];
  suggestions?: CodeSuggestion[];
  tokenUsage: TokenUsage;
  latency: number;
}

export interface GeneratedFile {
  path: string;
  name: string;
  type: FileType;
  content: string;
  language: string;
  isNew: boolean;
  changes?: FileChange[];
  dependencies?: string[];
  testFiles?: string[];
}

export interface FileChange {
  type: 'add' | 'modify' | 'delete' | 'rename';
  oldPath?: string;
  newPath?: string;
  content?: string;
  diff?: string;
}

export interface GeneratedAlternative {
  id: string;
  description: string;
  files: GeneratedFile[];
  tradeoffs: string[];
  rating: number;
}

export interface CodeSuggestion {
  id: string;
  type: 'optimization' | 'security' | 'performance' | 'readability';
  description: string;
  code?: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  cost: number;
}

// ============================================
// Test Generation Types
// ============================================

export interface TestGenerationRequest {
  projectId: string;
  fileId: string;
  testType: TestType;
  coverage: number;
  framework?: string;
  style?: TestStyle;
}

export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  CONTRACT = 'contract',
  PERFORMANCE = 'performance'
}

export enum TestStyle {
  TDD = 'tdd',
  BDD = 'bdd',
  TRADITIONAL = 'traditional'
}

export interface TestGenerationResponse {
  id: string;
  testFiles: GeneratedTestFile[];
  coverage: CoverageReport;
  suggestions: TestSuggestion[];
  execution?: TestExecution;
}

export interface GeneratedTestFile {
  path: string;
  content: string;
  language: string;
  testCount: number;
  assertions: number;
  mockData: MockDefinition[];
}

export interface MockDefinition {
  name: string;
  type: string;
  implementation: string;
}

export interface CoverageReport {
  line: number;
  branch: number;
  function: number;
  statement: number;
  uncovered: UncoveredRegion[];
}

export interface UncoveredRegion {
  file: string;
  lineStart: number;
  lineEnd: number;
  reason: string;
}

export interface TestSuggestion {
  id: string;
  type: 'edge_case' | 'missing_test' | 'improvement';
  description: string;
  priority: 'high' | 'medium' | 'low';
  code?: string;
}

export interface TestExecution {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  results: TestResult[];
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  stack?: string;
}

// ============================================
// Deployment Types
// ============================================

export interface Deployment {
  id: string;
  projectId: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  config: DeploymentConfig;
  logs: DeploymentLog[];
  metrics: DeploymentMetrics;
  rollbackVersion?: string;
  startedAt: Date;
  completedAt?: Date;
}

export enum DeploymentEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export enum DeploymentStatus {
  PENDING = 'pending',
  BUILDING = 'building',
  DEPLOYING = 'deploying',
  ROLLING_BACK = 'rolling_back',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface DeploymentConfig {
  buildCommand: string;
  startCommand: string;
  envVars: Record<string, string>;
  resources: ResourceConfig;
  healthCheck: HealthCheck;
  rollbackPolicy: RollbackPolicy;
}

export interface ResourceConfig {
  cpu: string;
  memory: string;
  replicas: number;
  timeout: number;
}

export interface HealthCheck {
  path: string;
  port: number;
  timeout: number;
  interval: number;
  retries: number;
}

export interface RollbackPolicy {
  automatic: boolean;
  onFailure: boolean;
  maxRetries: number;
  cooldown: number;
}

export interface DeploymentLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DeploymentMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  requestsPerSecond: number;
  memoryUsage: number;
  cpuUsage: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  requestId?: string;
  timestamp: Date;
}

// ============================================
// Pagination & Filtering
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// WebSocket Event Types
// ============================================

export interface WSEvent {
  type: WSEventType;
  payload: unknown;
  timestamp: Date;
  requestId?: string;
}

export enum WSEventType {
  // Connection
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',

  // Code Generation
  GENERATION_STARTED = 'generation_started',
  GENERATION_PROGRESS = 'generation_progress',
  GENERATION_COMPLETED = 'generation_completed',
  GENERATION_FAILED = 'generation_failed',

  // Quality Gate
  QUALITY_CHECK_STARTED = 'quality_check_started',
  QUALITY_CHECK_PROGRESS = 'quality_check_progress',
  QUALITY_CHECK_COMPLETED = 'quality_check_completed',

  // Deployment
  DEPLOYMENT_STARTED = 'deployment_started',
  DEPLOYMENT_PROGRESS = 'deployment_progress',
  DEPLOYMENT_COMPLETED = 'deployment_completed',
  DEPLOYMENT_FAILED = 'deployment_failed',

  // File Changes
  FILE_CREATED = 'file_created',
  FILE_UPDATED = 'file_updated',
  FILE_DELETED = 'file_deleted',

  // Real-time Collaboration
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  CURSOR_MOVED = 'cursor_moved',
  SELECTION_CHANGED = 'selection_changed',

  // Notifications
  NOTIFICATION = 'notification'
}
