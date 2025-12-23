import pino, { Logger } from 'pino';
import { LOG_LEVEL, LOG_FORMAT, NODE_ENV } from '../config/constants';

const logLevel = LOG_LEVEL || 'info';

// Create the base logger
const logger = pino({
  level: logLevel,
  format: LOG_FORMAT === 'json' ? 'json' : 'pretty',
  base: {
    env: NODE_ENV,
    service: 'vibe-backend',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  // Custom pretty print for development
  ...(LOG_FORMAT !== 'json' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// Create child logger with context
export const createChildLogger = (context: string): Logger => {
  return logger.child({ context });
};

// Log levels helper functions
export const logDebug = (message: string, data?: Record<string, unknown>): void => {
  logger.debug(data, message);
};

export const logInfo = (message: string, data?: Record<string, unknown>): void => {
  logger.info(data, message);
};

export const logWarn = (message: string, data?: Record<string, unknown>): void => {
  logger.warn(data, message);
};

export const logError = (
  message: string,
  error?: Error | unknown,
  data?: Record<string, unknown>
): void => {
  if (error instanceof Error) {
    logger.error({
      message,
      error: error.message,
      stack: error.stack,
      ...data,
    }, 'Error occurred');
  } else {
    logger.error(data, message);
  }
};

// Request logging helper
export const logRequest = (req: any, res: any, duration: number): void => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.id,
    requestId: req.id,
    ip: req.ip,
  };

  if (res.statusCode >= 400) {
    logger.warn(logData, 'Request completed with error');
  } else {
    logger.info(logData, 'Request completed');
  }
};

// Performance logging helper
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
): void => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    durationMs: duration,
    ...metadata,
  };

  if (duration > 10000) {
    logger.warn(logData, 'Slow operation detected');
  } else if (duration > 5000) {
    logger.info(logData, 'Operation completed with moderate duration');
  } else {
    logger.debug(logData, 'Operation completed');
  }
};

export default logger;
