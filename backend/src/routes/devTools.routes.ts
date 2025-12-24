import { Router, Request, Response } from 'express';
import { tddGeneratorService } from '../../services/ai/tddGenerator';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { ProjectFile } from '@vibe/shared';

const router = Router();

/**
 * Start a TDD process (generate tests first, then implementation)
 * POST /api/v1/dev-tools/tdd/start
 */
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, requirement, language, framework, testFramework, coverageTarget } = req.body;

  if (!projectId || !requirement || !language) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectId, requirement, language',
    });
  }

  logger.info('Starting TDD process', { projectId, language });

  const result = await tddGeneratorService.startTDDProcess(projectId, {
    requirement,
    language,
    framework,
    testFramework,
    coverageTarget,
  });

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Generate tests for existing code (Test-after approach)
 * POST /api/v1/dev-tools/tdd/generate-tests
 */
router.post('/generate-tests', asyncHandler(async (req: Request, res: Response) => {
  const { code, language, framework, coverageTarget } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: code, language',
    });
  }

  logger.info('Generating tests for code', { language });

  const result = await tddGeneratorService.generateTestsForCode(
    code,
    language,
    framework,
    coverageTarget
  );

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Implement code to pass tests
 * POST /api/v1/dev-tools/tdd/implement
 */
router.post('/implement', asyncHandler(async (req: Request, res: Response) => {
  const { processId, testContent, language, framework } = req.body;

  if (!testContent || !language) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: testContent, language',
    });
  }

  logger.info('Implementing code for tests', { processId });

  const implementation = await tddGeneratorService.implementForTests(
    processId || 'default',
    testContent,
    language,
    framework
  );

  res.json({
    success: true,
    data: { implementation },
  });
}));

/**
 * Refactor existing code
 * POST /api/v1/dev-tools/tdd/refactor
 */
router.post('/refactor', asyncHandler(async (req: Request, res: Response) => {
  const { code, language, focusArea } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: code, language',
    });
  }

  logger.info('Refactoring code', { focusArea });

  const refactored = await tddGeneratorService.refactorCode(
    code,
    language,
    focusArea || 'maintainability'
  );

  res.json({
    success: true,
    data: { refactored },
  });
}));

/**
 * Analyze test coverage gap
 * POST /api/v1/dev-tools/tdd/analyze-coverage
 */
router.post('/analyze-coverage', asyncHandler(async (req: Request, res: Response) => {
  const { code, tests, language } = req.body;

  if (!code || !tests || !language) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: code, tests, language',
    });
  }

  const result = await tddGeneratorService.analyzeCoverageGap(code, tests, language);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Get TDD process status
 * GET /api/v1/dev-tools/tdd/process/:processId
 */
router.get('/process/:processId', asyncHandler(async (req: Request, res: Response) => {
  const { processId } = req.params;

  const process = tddGeneratorService.getProcess(processId);

  if (!process) {
    return res.status(404).json({
      success: false,
      error: 'Process not found',
    });
  }

  res.json({
    success: true,
    data: process,
  });
}));

/**
 * List TDD processes for a project
 * GET /api/v1/dev-tools/tdd/processes?projectId=xxx
 */
router.get('/processes', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.query;

  const processes = tddGeneratorService.listProcesses(projectId as string);

  res.json({
    success: true,
    data: { processes, count: processes.length },
  });
}));

/**
 * Cleanup old TDD processes
 * POST /api/v1/dev-tools/tdd/cleanup
 */
router.post('/cleanup', asyncHandler(async (req: Request, res: Response) => {
  const { maxAgeMs } = req.body;

  const cleaned = tddGeneratorService.cleanupOldProcesses(maxAgeMs);

  res.json({
    success: true,
    data: { cleaned },
  });
}));

export default router;
