import { ERROR_CODES, HTTP_STATUS } from '../constants';
import { ApiError as IApiError, ValidationError } from '../types';

class APIError extends Error {
  public code: string;
  public statusCode: number;
  public details?: Record<string, unknown>;
  public validationErrors?: ValidationError[];
  public isOperational: boolean;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>,
    validationErrors?: ValidationError[]
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.validationErrors = validationErrors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  // Static factory methods for common errors
  static badRequest(
    message: string,
    validationErrors?: ValidationError[]
  ): APIError {
    return new APIError(
      message,
      ERROR_CODES.GENERATION_INVALID_PROMPT,
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      validationErrors
    );
  }

  static unauthorized(message: string = 'Unauthorized'): APIError {
    return new APIError(
      message,
      ERROR_CODES.AUTH_INVALID_TOKEN,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  static forbidden(message: string = 'Forbidden'): APIError {
    return new APIError(
      message,
      ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      HTTP_STATUS.FORBIDDEN
    );
  }

  static notFound(resource: string = 'Resource'): APIError {
    return new APIError(
      `${resource} not found`,
      ERROR_CODES.FILE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  static conflict(message: string): APIError {
    return new APIError(
      message,
      ERROR_CODES.FILE_TYPE_NOT_ALLOWED,
      HTTP_STATUS.CONFLICT
    );
  }

  static rateLimited(message: string = 'Too many requests'): APIError {
    return new APIError(
      message,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  }

  static internal(message: string = 'Internal server error'): APIError {
    return new APIError(
      message,
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  static external(message: string): APIError {
    return new APIError(
      message,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      HTTP_STATUS.BAD_GATEWAY
    );
  }

  // Convert to API response format
  toJSON(): IApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      validationErrors: this.validationErrors,
    };
  }
}

export default APIError;
