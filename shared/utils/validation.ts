import { ZodSchema, ZodError } from 'zod';
import APIError from './APIError';
import { ValidationError } from '../types';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

interface ValidationResult<T> {
  success: true;
  data: T;
} | {
  success: false;
  errors: ValidationError[];
}

const validation = {
  /**
   * Validate request body against a Zod schema
   */
  body<T>(schema: ZodSchema<T>) {
    return (value: unknown): ValidationResult<T> => {
      const result = schema.safeParse(value);

      if (result.success) {
        return { success: true, data: result.data };
      }

      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));

      return { success: false, errors };
    };
  },

  /**
   * Validate request params
   */
  params<T>(schema: ZodSchema<T>) {
    return (value: Record<string, unknown>): ValidationResult<T> => {
      const result = schema.safeParse(value);

      if (result.success) {
        return { success: true, data: result.data };
      }

      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));

      return { success: false, errors };
    };
  },

  /**
   * Validate query parameters
   */
  query<T>(schema: ZodSchema<T>) {
    return (value: Record<string, unknown>): ValidationResult<T> => {
      const result = schema.safeParse(value);

      if (result.success) {
        return { success: true, data: result.data };
      }

      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));

      return { success: false, errors };
    };
  },

  /**
   * Create a middleware from a schema
   */
  middleware<T>(
    schema: ZodSchema<T>,
    source: 'body' | 'params' | 'query' = 'body'
  ) {
    return (req: any, _res: any, next: any): void => {
      const sourceData = req[source];
      const result = schema.safeParse(sourceData);

      if (!result.success) {
        const errors: ValidationError[] = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
        }));

        throw APIError.badRequest('Validation failed', errors);
      }

      // Replace the source data with validated data
      req[source] = result.data;
      next();
    };
  },

  /**
   * Validate and throw on error
   */
  validateOrThrow<T>(
    schema: ZodSchema<T>,
    data: unknown,
    source: string = 'body'
  ): T {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));

      throw APIError.badRequest(`Invalid ${source}`, errors);
    }

    return result.data;
  },

  /**
   * Parse Zod error into ValidationError array
   */
  parseZodError(error: ZodError): ValidationError[] {
    return error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.input,
    }));
  },
};

export default validation;
