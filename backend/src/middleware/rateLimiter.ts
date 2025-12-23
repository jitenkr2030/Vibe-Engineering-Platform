import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ApiError } from '@vibe/shared';
import { RATE_LIMITS } from '../config/constants';
import { logger } from '../utils/logger';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.api.windowMs,
  max: RATE_LIMITS.api.maxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _options, _next) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });

    res.set('Retry-After', String(Math.round(RATE_LIMITS.api.windowMs / 1000)));
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
      meta: {
        retryAfter: Math.round(RATE_LIMITS.api.windowMs / 1000),
        timestamp: new Date(),
      },
    });
  },
});

// Stricter rate limiter for code generation
export const generationRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.generation.windowMs,
  max: RATE_LIMITS.generation.maxRequests,
  message: {
    error: {
      code: 'GENERATION_LIMIT_EXCEEDED',
      message: 'Code generation limit reached. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
  handler: (req, res, _options, _next) => {
    logger.warn('Generation rate limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip,
    });

    res.set('Retry-After', String(Math.round(RATE_LIMITS.generation.windowMs / 1000)));
    res.status(429).json({
      success: false,
      error: {
        code: 'GENERATION_LIMIT_EXCEEDED',
        message: 'Code generation limit reached. Please try again later.',
      },
      meta: {
        retryAfter: Math.round(RATE_LIMITS.generation.windowMs / 1000),
        timestamp: new Date(),
      },
    });
  },
});

// File upload rate limiter
export const fileUploadRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.files.windowMs,
  max: RATE_LIMITS.files.maxRequests,
  message: {
    error: {
      code: 'FILE_UPLOAD_LIMIT_EXCEEDED',
      message: 'Too many file uploads. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom rate limiter with custom key generator
export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  keyGenerator?: (req: Request) => string | Promise<string>
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip || 'anonymous'),
  });
};
