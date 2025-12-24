import { logger } from '../utils/logger';
import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Required
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  PORT: z.coerce.number().min(1).max(65535),
  DATABASE_URL: z.string().url(),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().optional(),
  
  // AI Providers (at least one required)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Optional but validated
  FRONTEND_URL: z.string().url().optional().or(z.literal('')),
  REDIS_URL: z.string().optional(),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
  METRICS_ENABLED: z.boolean().optional(),
  
  // Feature flags
  FEATURE_AUTOMATION_ENABLED: z.boolean().optional(),
  
  // Rate limiting
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().optional(),
});

export type EnvVariables = z.infer<typeof envSchema>;

export interface EnvValidationResult {
  valid: boolean;
  errors: EnvError[];
  warnings: EnvWarning[];
  env: EnvVariables;
}

export interface EnvError {
  field: string;
  message: string;
  value?: string;
}

export interface EnvWarning {
  field: string;
  message: string;
  suggestion: string;
}

export interface EnvConfig {
  required: string[];
  optional: string[];
  sensitive: string[];
  validated: Map<string, EnvValidationConfig>;
}

export interface EnvValidationConfig {
  type: 'string' | 'number' | 'boolean' | 'url' | 'email';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  description: string;
  defaultValue?: string;
}

class EnvironmentValidator {
  private config: EnvConfig = {
    required: [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET',
    ],
    optional: [
      'FRONTEND_URL',
      'REDIS_URL',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'LOG_LEVEL',
      'METRICS_ENABLED',
      'FEATURE_AUTOMATION_ENABLED',
      'RATE_LIMIT_MAX_REQUESTS',
      'RATE_LIMIT_WINDOW_MS',
    ],
    sensitive: [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'DATABASE_URL',
      'REDIS_URL',
      'AWS_SECRET_ACCESS_KEY',
    ],
    validated: new Map([
      ['NODE_ENV', { type: 'string', required: true, description: 'Node environment' }],
      ['PORT', { type: 'number', required: true, description: 'Server port' }],
      ['DATABASE_URL', { type: 'url', required: true, description: 'PostgreSQL connection URL' }],
      ['JWT_SECRET', { type: 'string', required: true, minLength: 32, description: 'JWT signing secret' }],
      ['FRONTEND_URL', { type: 'url', required: false, description: 'Frontend application URL' }],
      ['REDIS_URL', { type: 'string', required: false, description: 'Redis connection URL' }],
      ['OPENAI_API_KEY', { type: 'string', required: false, description: 'OpenAI API key' }],
      ['ANTHROPIC_API_KEY', { type: 'string', required: false, description: 'Anthropic API key' }],
      ['LOG_LEVEL', { type: 'string', required: false, description: 'Logging level' }],
    ]),
  };

  constructor() {
    logger.info('EnvironmentValidator initialized');
  }

  /**
   * Validate all environment variables
   */
  validate(): EnvValidationResult {
    const errors: EnvError[] = [];
    const warnings: EnvWarning[] = [];
    let env: EnvVariables;

    try {
      // Use Zod schema for validation
      env = envSchema.parse(process.env);

      // Check if at least one AI provider is configured
      if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
        warnings.push({
          field: 'AI_PROVIDERS',
          message: 'No AI provider configured',
          suggestion: 'Set OPENAI_API_KEY or ANTHROPIC_API_KEY for AI features to work',
        });
      }

      // Additional validations
      this.validateProductionConstraints(env, warnings);

    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          const value = process.env[issue.path[0]];
          errors.push({
            field: issue.path[0] as string,
            message: issue.message,
            value: typeof value === 'string' && this.isSensitive(issue.path[0] as string) 
              ? '********' 
              : value,
          });
        }
      }
      env = {} as EnvVariables;
    }

    // Check for missing required variables
    for (const field of this.config.required) {
      if (!(field in process.env) || !process.env[field]) {
        errors.push({
          field,
          message: `Required environment variable ${field} is missing`,
          value: undefined,
        });
      }
    }

    // Check for deprecated variables
    this.checkDeprecatedVariables(warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      env,
    };
  }

  /**
   * Validate a specific environment variable
   */
  validateField(name: string): { valid: boolean; error?: string; value?: string } {
    const config = this.config.validated.get(name);
    const value = process.env[name];

    if (!config) {
      return { valid: true, value };
    }

    if (config.required && !value) {
      return { valid: false, error: `${name} is required` };
    }

    if (value) {
      switch (config.type) {
        case 'url':
          try {
            new URL(value);
          } catch {
            return { valid: false, error: `${name} must be a valid URL`, value };
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            return { valid: false, error: `${name} must be a number`, value };
          }
          break;
        case 'string':
          if (config.minLength && value.length < config.minLength) {
            return { valid: false, error: `${name} must be at least ${config.minLength} characters` };
          }
          if (config.maxLength && value.length > config.maxLength) {
            return { valid: false, error: `${name} must be at most ${config.maxLength} characters` };
          }
          break;
      }
    }

    return { valid: true, value };
  }

  /**
   * Get all environment variables (sanitized)
   */
  getSanitizedEnv(): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (value) {
        sanitized[key] = this.isSensitive(key) ? '********' : value;
      }
    }

    return sanitized;
  }

  /**
   * Check for production-specific constraints
   */
  private validateProductionConstraints(
    env: EnvVariables,
    warnings: EnvWarning[]
  ): void {
    if (env.NODE_ENV === 'production') {
      // Check for development-only settings
      if (env.LOG_LEVEL === 'debug' || env.LOG_LEVEL === 'verbose') {
        warnings.push({
          field: 'LOG_LEVEL',
          message: 'Debug logging in production may expose sensitive information',
          suggestion: 'Set LOG_LEVEL to "info" or "warn" in production',
        });
      }

      // Check JWT secret strength
      if (env.JWT_SECRET && env.JWT_SECRET.length < 50) {
        warnings.push({
          field: 'JWT_SECRET',
          message: 'JWT secret may be too short for production',
          suggestion: 'Use a secret of at least 50 characters',
        });
      }
    }

    // Check for weak secrets
    if (env.JWT_SECRET && /^(password|secret|123|abc)/i.test(env.JWT_SECRET)) {
      warnings.push({
        field: 'JWT_SECRET',
        message: 'JWT_SECRET appears to be a weak or default value',
        suggestion: 'Use a cryptographically strong random string',
      });
    }
  }

  /**
   * Check for deprecated environment variables
   */
  private checkDeprecatedVariables(warnings: EnvWarning[]): void {
    const deprecated: Record<string, string> = {
      'LEGACY_AUTH': 'Use JWT_SECRET instead',
      'OLD_DB_URL': 'Use DATABASE_URL instead',
      'API_V1_KEY': 'Authentication is now handled via JWT tokens',
    };

    for (const [varName, message] of Object.entries(deprecated)) {
      if (process.env[varName]) {
        warnings.push({
          field: varName,
          message: `Deprecated environment variable: ${varName}`,
          suggestion: message,
        });
      }
    }
  }

  /**
   * Check if a variable is sensitive
   */
  private isSensitive(name: string): boolean {
    return this.config.sensitive.includes(name) ||
           /_SECRET|_KEY|_PASSWORD|_TOKEN/i.test(name);
  }

  /**
   * Print validation results
   */
  printResults(result: EnvValidationResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('ENVIRONMENT VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (result.valid) {
      console.log('✅ All environment variables are valid!\n');
    } else {
      console.log('❌ Environment validation failed:\n');
      for (const error of result.errors) {
        console.log(`  - ${error.field}: ${error.message}`);
      }
      console.log('');
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      for (const warning of result.warnings) {
        console.log(`  - ${warning.field}: ${warning.message}`);
        console.log(`    Suggestion: ${warning.suggestion}`);
      }
      console.log('');
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Exit on validation failure (for production use)
   */
  enforce(strict: boolean = false): EnvVariables {
    const result = this.validate();

    if (strict || process.env.NODE_ENV === 'production') {
      this.printResults(result);
    }

    if (!result.valid && strict) {
      logger.error('Environment validation failed', { errors: result.errors });
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        logger.warn(`Environment warning: ${warning.message}`, { 
          field: warning.field,
          suggestion: warning.suggestion 
        });
      }
    }

    return result.env;
  }

  /**
   * Get documentation for environment variables
   */
  getDocumentation(): Record<string, { description: string; required: boolean; sensitive: boolean }> {
    const docs: Record<string, { description: string; required: boolean; sensitive: boolean }> = {};

    for (const field of [...this.config.required, ...this.config.optional]) {
      const config = this.config.validated.get(field);
      docs[field] = {
        description: config?.description || 'No description',
        required: this.config.required.includes(field),
        sensitive: this.isSensitive(field),
      };
    }

    return docs;
  }
}

export const environmentValidator = new EnvironmentValidator();
export default EnvironmentValidator;
