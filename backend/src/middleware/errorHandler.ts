import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@vibe/shared';
import { logger } from '../utils/logger';
import { NODE_ENV } from '../config/constants';

// Global error handler middleware
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  // Handle API errors
  if (error instanceof ApiError) {
    const response = {
      success: false,
      error: error.toJSON(),
      meta: {
        requestId: _req.id,
        timestamp: new Date(),
      },
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    // Handle unique constraint violations
    if (prismaError.code === 'P2002') {
      const response = {
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this value already exists',
          details: {
            field: prismaError.meta?.target,
          },
        },
        meta: {
          requestId: _req.id,
          timestamp: new Date(),
        },
      };

      res.status(409).json(response);
      return;
    }

    // Handle not found errors
    if (prismaError.code === 'P2025') {
      const response = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
        },
        meta: {
          requestId: _req.id,
          timestamp: new Date(),
        },
      };

      res.status(404).json(response);
      return;
    }
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const zodError = error as any;
    const validationErrors = zodError.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.input,
    }));

    const response = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        validationErrors,
      },
      meta: {
        requestId: _req.id,
        timestamp: new Date(),
      },
    };

    res.status(400).json(response);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
      meta: {
        requestId: _req.id,
        timestamp: new Date(),
      },
    };

    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response = {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
      meta: {
        requestId: _req.id,
        timestamp: new Date(),
      },
    };

    res.status(401).json(response);
    return;
  }

  // Handle unknown errors
  const statusCode = 500;
  const message =
    NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message;

  const response = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(NODE_ENV !== 'production' && { stack: error.stack }),
    },
    meta: {
      requestId: _req.id,
      timestamp: new Date(),
    },
  };

  res.status(statusCode).json(response);
};

// Async handler wrapper to catch errors
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
    meta: {
      timestamp: new Date(),
    },
  });
};
