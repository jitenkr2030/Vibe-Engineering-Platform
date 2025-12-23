import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: HealthServiceStatus;
    redis: HealthServiceStatus;
  };
  uptime: number;
  memory: MemoryStatus;
}

interface HealthServiceStatus {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}

interface MemoryStatus {
  heapUsed: number;
  heapTotal: number;
  external: number;
  unit: string;
}

export const healthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: { status: 'up' },
      redis: { status: 'up' },
    },
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
      unit: 'MB',
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database.latency = Date.now() - dbStart;
  } catch (error) {
    healthStatus.services.database.status = 'down';
    healthStatus.services.database.error = error instanceof Error ? error.message : 'Unknown error';
    healthStatus.status = 'degraded';
    logger.error('Database health check failed', { error });
  }

  // Check Redis connection
  try {
    const redisStart = Date.now();
    const { Redis } = await import('ioredis');
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await redis.ping();
    healthStatus.services.redis.latency = Date.now() - redisStart;
    await redis.quit();
  } catch (error) {
    healthStatus.services.redis.status = 'down';
    healthStatus.services.redis.error = error instanceof Error ? error.message : 'Unknown error';
    healthStatus.status = 'degraded';
    logger.warn('Redis health check failed (non-critical)', { error });
  }

  const totalLatency = Date.now() - startTime;

  const statusCode = healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    success: true,
    data: healthStatus,
    meta: {
      latency: totalLatency,
      timestamp: new Date(),
    },
  });
};

export const detailedHealthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const health = await healthCheck(_req, res as any);

  // Add more detailed checks
  const detailedInfo = {
    ...health,
    checks: {
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
      },
      limits: {
        maxMemory: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    },
  };

  res.status(200).json({
    success: true,
    data: detailedInfo,
  });
};
