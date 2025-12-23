import { Request, Response, NextFunction } from 'express';
import APIError from './APIError';
import { ApiResponse } from '../types';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | Promise<Response<ApiResponse<unknown>>>;

const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      // Handle known API errors
      if (error instanceof APIError) {
        const response: ApiResponse<null> = {
          success: false,
          error: error.toJSON(),
          meta: {
            requestId: req.id,
            timestamp: new Date(),
          },
        };

        // Handle validation errors specially
        if (error.validationErrors) {
          return res.status(error.statusCode).json(response);
        }

        return res.status(error.statusCode).json(response);
      }

      // Handle unexpected errors
      console.error('Unhandled error:', error);

      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message:
            process.env.NODE_ENV === 'production'
              ? 'An unexpected error occurred'
              : error.message,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date(),
        },
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    });
  };
};

export default asyncHandler;
