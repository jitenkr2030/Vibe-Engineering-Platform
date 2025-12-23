// ============================================
// Application Constants
// ============================================

export const APP_NAME = 'Vibe Engineering Platform';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'AI-Native Software Engineering Platform - Build software responsibly';

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// ============================================
// File System Constants
// ============================================

export const MAX_FILE_SIZE = 1024 * 1024; // 1MB
export const MAX_PROJECT_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_FILE_TYPES = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.yaml',
  '.yml',
  '.md',
  '.txt',
  '.html',
  '.css',
  '.scss',
  '.sql',
  '.graphql',
  '.proto',
];

export const EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.nyc_output',
];

export const PROJECT_ROOT_FILES = [
  'package.json',
  'tsconfig.json',
  '.gitignore',
  'README.md',
];

// ============================================
// Code Generation Constants
// ============================================

export const DEFAULT_CODE_STYLE = {
  indentSize: 2,
  indentType: 'spaces' as const,
  lineWidth: 80,
  trailingComma: true,
  semicolons: true,
  quoteType: 'single' as const,
};

export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'java',
  'kotlin',
  'ruby',
  'php',
  'csharp',
  'swift',
];

export const SUPPORTED_FRAMEWORKS = {
  frontend: [
    'react',
    'vue',
    'angular',
    'svelte',
    'nextjs',
    'nuxt',
    'astro',
    'remix',
  ],
  backend: [
    'nodejs',
    'express',
    'nestjs',
    'fastify',
    'django',
    'flask',
    'spring',
    'go-gin',
    'ruby-on-rails',
    'laravel',
  ],
  database: [
    'postgresql',
    'mysql',
    'mongodb',
    'redis',
    'sqlite',
    'dynamodb',
    'elasticsearch',
  ],
};

// ============================================
// Quality Gate Constants
// ============================================

export const DEFAULT_QUALITY_THRESHOLDS = {
  testCoverage: 80,
  complexity: 10,
  technicalDebt: 5,
  securityScore: 90,
  performanceScore: 85,
};

export const SEVERITY_WEIGHTS = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  info: 10,
};

export const QUALITY_CHECK_CATEGORIES = {
  lint: 'Code Style & Linting',
  security: 'Security',
  performance: 'Performance',
  test: 'Testing',
  complexity: 'Complexity',
  docs: 'Documentation',
  type: 'Type Checking',
};

// ============================================
// AI Model Constants
// ============================================

export const AI_MODELS = {
  primary: 'gpt-4o',
  alternative: 'claude-sonnet-4-20250514',
  code: 'gpt-4o-code',
  fast: 'gpt-4o-mini',
};

export const AI_MODEL_CONFIG = {
  'gpt-4o': {
    maxTokens: 8192,
    temperature: 0.7,
    contextWindow: 128000,
  },
  'gpt-4o-mini': {
    maxTokens: 4096,
    temperature: 0.5,
    contextWindow: 128000,
  },
  'claude-sonnet-4-20250514': {
    maxTokens: 8192,
    temperature: 0.7,
    contextWindow: 200000,
  },
};

export const DEFAULT_AI_SETTINGS = {
  model: AI_MODELS.primary,
  temperature: 0.7,
  maxTokens: 8192,
  autoApproval: false,
  approvalThreshold: 'medium' as const,
};

// ============================================
// Rate Limiting Constants
// ============================================

export const RATE_LIMITS = {
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  generation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },
  files: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
  },
  websocket: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },
};

// ============================================
// Token & Pricing Constants
// ============================================

export const TOKEN_COSTS = {
  'gpt-4o': {
    input: 5, // per 1M tokens
    output: 15,
  },
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.6,
  },
  'claude-sonnet-4-20250514': {
    input: 3,
    output: 15,
  },
};

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    tokens: 10000,
    projects: 3,
    features: ['basic_generation', 'quality_gates'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    tokens: 100000,
    projects: 10,
    features: [
      'advanced_generation',
      'quality_gates',
      'memory_system',
      'priority_support',
    ],
  },
  team: {
    name: 'Team',
    price: 99,
    tokens: 500000,
    projects: 50,
    features: [
      'everything_in_pro',
      'collaboration',
      'custom_templates',
      'api_access',
      'billing_management',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    tokens: -1, // unlimited
    projects: -1,
    features: [
      'everything_in_team',
      'self_hosted',
      'custom_models',
      'sla',
      'dedicated_support',
      'audit_logs',
    ],
  },
};

// ============================================
// Session & Authentication Constants
// ============================================

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '7d',
  refreshExpiresIn: '30d',
};

export const SESSION_CONFIG = {
  maxSessions: 5,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
};

export const PASSWORD_CONFIG = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// ============================================
// Time & Date Constants
// ============================================

export const DATE_FORMATS = {
  iso: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  display: 'MMM DD, YYYY',
  time: 'HH:mm:ss',
  relative: 'relative',
};

export const RELATIVE_TIME_UNITS = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2592000,
  year: 31536000,
};

// ============================================
// Error Codes
// ============================================

export const ERROR_CODES = {
  // Authentication (1000-1099)
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_NOT_VERIFIED: 'AUTH_ACCOUNT_NOT_VERIFIED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // User (1100-1199)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INVALID_INPUT: 'USER_INVALID_INPUT',
  USER_UPDATE_FAILED: 'USER_UPDATE_FAILED',

  // Project (1200-1299)
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_ALREADY_EXISTS: 'PROJECT_ALREADY_EXISTS',
  PROJECT_CREATE_FAILED: 'PROJECT_CREATE_FAILED',
  PROJECT_ACCESS_DENIED: 'PROJECT_ACCESS_DENIED',
  PROJECT_LIMIT_EXCEEDED: 'PROJECT_LIMIT_EXCEEDED',

  // File (1300-1399)
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_CREATE_FAILED: 'FILE_CREATE_FAILED',
  FILE_UPDATE_FAILED: 'FILE_UPDATE_FAILED',
  FILE_DELETE_FAILED: 'FILE_DELETE_FAILED',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',

  // Generation (1400-1499)
  GENERATION_FAILED: 'GENERATION_FAILED',
  GENERATION_TIMEOUT: 'GENERATION_TIMEOUT',
  GENERATION_INVALID_PROMPT: 'GENERATION_INVALID_PROMPT',
  GENERATION_RATE_LIMITED: 'GENERATION_RATE_LIMITED',
  GENERATION_CONTEXT_EXCEEDED: 'GENERATION_CONTEXT_EXCEEDED',

  // Quality Gate (1500-1599)
  QUALITY_CHECK_FAILED: 'QUALITY_CHECK_FAILED',
  QUALITY_THRESHOLD_NOT_MET: 'QUALITY_THRESHOLD_NOT_MET',
  QUALITY_SCAN_FAILED: 'QUALITY_SCAN_FAILED',

  // Deployment (1600-1699)
  DEPLOYMENT_FAILED: 'DEPLOYMENT_FAILED',
  DEPLOYMENT_NOT_FOUND: 'DEPLOYMENT_NOT_FOUND',
  DEPLOYMENT_BUILD_FAILED: 'DEPLOYMENT_BUILD_FAILED',
  DEPLOYMENT_ROLLBACK_FAILED: 'DEPLOYMENT_ROLLBACK_FAILED',

  // System (9000-9999)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
};

// ============================================
// HTTP Status Codes
// ============================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// ============================================
// Pagination Constants
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

// ============================================
// WebSocket Constants
// ============================================

export const WS_CONFIG = {
  heartbeatInterval: 30000,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  messageRateLimit: 100, // messages per second
};

export const WS_CHANNELS = {
  PROJECT: 'project',
  GENERATION: 'generation',
  QUALITY: 'quality',
  DEPLOYMENT: 'deployment',
  COLLABORATION: 'collaboration',
  NOTIFICATIONS: 'notifications',
};
