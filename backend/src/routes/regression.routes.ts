import { Router, Request, Response } from 'express';
import { regressionDetectorService } from '../../services/quality/regressionDetector';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { ProjectFile } from '@vibe/shared';

const router = Router();

/**
 * Detect regressions between code versions
 * POST /api/v1/quality/regression/detect
 */
router.post('/detect', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, newCode, previousCode, baseCommit, compareCommit } = req.body;

  if (!projectId || !newCode) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectId, newCode',
    });
  }

  logger.info('Starting regression detection', { projectId });

  const result = await regressionDetectorService.detectRegressions({
    projectId,
    newCode: newCode as ProjectFile[],
    previousCode: previousCode as ProjectFile[],
    baseCommit,
    compareCommit,
  });

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Create a code snapshot for future comparison
 * POST /api/v1/quality/regression/snapshot
 */
router.post('/snapshot', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, files, commitHash } = req.body;

  if (!projectId || !files) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectId, files',
    });
  }

  logger.info('Creating code snapshots', { projectId, fileCount: files.length });

  const snapshots = await regressionDetectorService.createSnapshot(
    projectId,
    files as ProjectFile[],
    commitHash
  );

  res.json({
    success: true,
    data: { snapshots, count: snapshots.length },
  });
}));

/**
 * Compare against a specific commit
 * POST /api/v1/quality/regression/compare
 */
router.post('/compare', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, newCode, baseCommit, compareCommit } = req.body;

  if (!projectId || !newCode || !baseCommit) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectId, newCode, baseCommit',
    });
  }

  logger.info('Comparing against commit', { projectId, baseCommit });

  const result = await regressionDetectorService.detectRegressions({
    projectId,
    newCode: newCode as ProjectFile[],
    baseCommit,
    compareCommit,
  });

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Get regression history for a project
 * GET /api/v1/quality/regression/history?projectId=xxx
 */
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, limit } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query param: projectId',
    });
  }

  // This would typically query the database for historical results
  res.json({
    success: true,
    data: {
      message: 'Historical regression data would be returned here',
      projectId,
      limit: limit || 10,
    },
  });
}));

export default router;
