import { Router, Request, Response } from 'express';
import { costOptimizationService } from '../../services/ai/costOptimization';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { ProjectFile } from '@vibe/shared';

const router = Router();

/**
 * Analyze costs and get optimization recommendations
 * POST /api/v1/ops/cost/analyze
 */
router.post('/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, files, infrastructureFiles, runtimeMetrics, cloudProvider } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: projectId',
    });
  }

  logger.info('Starting cost analysis', { projectId });

  const result = await costOptimizationService.analyze({
    projectId,
    files: files as ProjectFile[],
    infrastructureFiles: infrastructureFiles as ProjectFile[],
    runtimeMetrics,
    cloudProvider,
  });

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Get quick wins (high impact, low effort recommendations)
 * POST /api/v1/ops/cost/quick-wins
 */
router.post('/quick-wins', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, files, infrastructureFiles, runtimeMetrics, cloudProvider } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: projectId',
    });
  }

  const quickWins = await costOptimizationService.getQuickWins({
    projectId,
    files: files as ProjectFile[],
    infrastructureFiles: infrastructureFiles as ProjectFile[],
    runtimeMetrics,
    cloudProvider,
  });

  res.json({
    success: true,
    data: { quickWins, count: quickWins.length },
  });
}));

/**
 * Estimate monthly cost for a project setup
 * POST /api/v1/ops/cost/estimate
 */
router.post('/estimate', asyncHandler(async (req: Request, res: Response) => {
  const { hasBackend, hasFrontend, hasDatabase, hasCache, hasCDN, tier } = req.body;

  const estimate = costOptimizationService.estimateProjectCost({
    hasBackend: hasBackend || false,
    hasFrontend: hasFrontend || false,
    hasDatabase: hasDatabase || false,
    hasCache: hasCache || false,
    hasCDN: hasCDN || false,
    tier: tier || 'medium',
  });

  res.json({
    success: true,
    data: {
      estimatedMonthlyCost: estimate,
      tier,
      breakdown: {
        backend: hasBackend ? estimate * 0.5 : 0,
        frontend: hasFrontend ? estimate * 0.15 : 0,
        database: hasDatabase ? estimate * 0.25 : 0,
        cache: hasCache ? estimate * 0.05 : 0,
        cdn: hasCDN ? estimate * 0.05 : 0,
      },
    },
  });
}));

export default router;
