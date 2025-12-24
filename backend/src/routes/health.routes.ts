import { Router, Request, Response } from 'express';
import { monitoringService, healthCheckHandler, metricsHandler } from '../../services/monitoring';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Basic health check
 * GET /api/v1/health
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const health = await healthCheckHandler();
  
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    success: true,
    data: health,
  });
}));

/**
 * Detailed health check with all checks
 * GET /api/v1/health/detailed
 */
router.get('/detailed', asyncHandler(async (_req: Request, res: Response) => {
  const health = await healthCheckHandler();

  res.json({
    success: true,
    data: {
      ...health,
      checks: health.checks.map(check => ({
        name: check.name,
        status: check.status,
        message: check.message,
        latency: check.latency ? `${check.latency.toFixed(2)}ms` : undefined,
        details: check.details,
      })),
    },
  });
}));

/**
 * Liveness probe (for Kubernetes)
 * GET /api/v1/health/live
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe (for Kubernetes)
 * GET /api/v1/health/ready
 */
router.get('/ready', asyncHandler(async (_req: Request, res: Response) => {
  const health = await healthCheckHandler();
  
  if (health.status === 'unhealthy') {
    return res.status(503).json({
      status: 'not ready',
      reason: health.checks.find(c => c.status === 'unhealthy')?.message,
    });
  }

  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Get metrics
 * GET /api/v1/health/metrics
 */
router.get('/metrics', asyncHandler(async (_req: Request, res: Response) => {
  const metrics = metricsHandler();
  res.json({
    success: true,
    data: metrics,
  });
}));

/**
 * Get performance summary
 * GET /api/v1/health/performance
 */
router.get('/performance', asyncHandler(async (_req: Request, res: Response) => {
  const { performance } = metricsHandler();
  res.json({
    success: true,
    data: performance,
  });
}));

/**
 * Clear metrics (for testing)
 * POST /api/v1/health/metrics/clear
 */
router.post('/metrics/clear', asyncHandler(async (_req: Request, res: Response) => {
  monitoringService.clearMetrics();
  logger.info('Metrics cleared');
  
  res.json({
    success: true,
    message: 'Metrics cleared',
  });
}));

export default router;
