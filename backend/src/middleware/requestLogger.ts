import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Add request ID to request object
export const requestId = (_req: Request, res: Response, next: NextFunction): void => {
  const id = uuidv4();
  res.setHeader('X-Request-ID', id);
  (res as any).req = { ..._req, id };
  next();
};

// Log incoming requests
export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    requestId: (req as any).id,
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      'content-length': req.get('content-length'),
    },
    ip: req.ip,
    query: req.query,
  });

  // Log response time when response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: (req as any).id,
      method: req.method,
      url: req.url,
      status: (res as any).statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
