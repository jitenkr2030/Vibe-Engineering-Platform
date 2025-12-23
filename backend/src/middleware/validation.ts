import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '@vibe/shared';

// Validation middleware factory
export const validationMiddleware = (
  schema: ZodSchema<any>,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));

      throw ApiError.badRequest('Validation failed', errors);
    }

    // Update the request data with validated data
    req[source] = result.data;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Pagination
  pagination: {
    page: { type: 'number', min: 1, default: 1 },
    limit: { type: 'number', min: 1, max: 100, default: 20 },
    sortBy: { type: 'string' },
    sortOrder: { type: 'enum', values: ['asc', 'desc'] },
  },

  // Project
  createProject: {
    name: { type: 'string', min: 1, max: 100 },
    description: { type: 'string', max: 1000, optional: true },
    visibility: { type: 'enum', values: ['private', 'team', 'public'], default: 'private' },
    techStack: { type: 'object', optional: true },
  },

  updateProject: {
    name: { type: 'string', min: 1, max: 100, optional: true },
    description: { type: 'string', max: 1000, optional: true },
    visibility: { type: 'enum', values: ['private', 'team', 'public'], optional: true },
    status: { type: 'enum', values: ['planning', 'in_progress', 'review', 'deployed', 'archived'], optional: true },
  },

  // File
  createFile: {
    path: { type: 'string', min: 1 },
    name: { type: 'string', min: 1 },
    type: { type: 'enum', values: ['file', 'directory', 'config', 'documentation', 'test'] },
    content: { type: 'string', optional: true },
    language: { type: 'string', optional: true },
  },

  updateFile: {
    content: { type: 'string', optional: true },
    metadata: { type: 'object', optional: true },
  },

  // Generation
  generateCode: {
    prompt: { type: 'string', min: 1, max: 10000 },
    language: { type: 'string', optional: true },
    framework: { type: 'string', optional: true },
    style: { type: 'object', optional: true },
    context: { type: 'object', optional: true },
  },

  // Template
  createTemplate: {
    name: { type: 'string', min: 1, max: 100 },
    description: { type: 'string', max: 1000, optional: true },
    category: { type: 'string' },
    template: { type: 'string', min: 1 },
    role: { type: 'enum', values: ['user', 'assistant', 'system', 'mentor'], default: 'assistant' },
  },
};
