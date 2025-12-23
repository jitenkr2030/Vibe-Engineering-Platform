import { z } from 'zod';

// Environment variable validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // File Storage
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// ============================================
// Application Constants
// ============================================

export const APP_CONFIG = {
  name: 'Vibe Engineering Platform',
  version: '1.0.0',
  description: 'AI-Native Software Engineering Platform',
};

// ============================================
// API Configuration
// ============================================

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// ============================================
// Environment
// ============================================

export const { NODE_ENV, PORT } = env;

// ============================================
// Database
// ============================================

export const DATABASE_CONFIG = {
  url: env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
};

// ============================================
// Redis
// ============================================

export const REDIS_CONFIG = {
  url: env.REDIS_URL || 'redis://localhost:6379',
  keyPrefix: 'vibe:',
};

// ============================================
// JWT
// ============================================

export const JWT_CONFIG = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: '30d',
};

// ============================================
// AI Models
// ============================================

export const AI_CONFIG = {
  primary: {
    provider: 'openai',
    model: env.OPENAI_MODEL,
    apiKey: env.OPENAI_API_KEY,
  },
  alternative: {
    provider: 'anthropic',
    model: env.ANTHROPIC_MODEL,
    apiKey: env.ANTHROPIC_API_KEY,
  },
  timeout: 120000, // 2 minutes
  maxRetries: 3,
};

// ============================================
// Rate Limiting
// ============================================

export const RATE_LIMITS = {
  general: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  api: {
    windowMs: 60000,
    maxRequests: 60,
  },
  generation: {
    windowMs: 3600000,
    maxRequests: 50,
  },
  files: {
    windowMs: 60000,
    maxRequests: 120,
  },
};

// ============================================
// File Upload
// ============================================

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerRequest: 10,
  allowedMimeTypes: [
    'text/plain',
    'application/json',
    'application/javascript',
    'text/typescript',
    'text/tsx',
    'text/javascript',
    'text/css',
    'text/html',
    'text/markdown',
    'application/yaml',
    'application/xml',
  ],
  uploadDir: './uploads',
};

// ============================================
// Logging
// ============================================

export const LOG_LEVEL = env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
export const LOG_FORMAT = NODE_ENV === 'production' ? 'json' : 'combined';

// ============================================
// CORS
// ============================================

export const CORS_CONFIG = {
  origin: env.FRONTEND_URL,
  credentials: true,
};

// ============================================
// Pagination
// ============================================

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
};
