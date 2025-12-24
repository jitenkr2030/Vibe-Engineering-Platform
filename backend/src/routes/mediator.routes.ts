import { Router, Request, Response } from 'express';
import { aiMediatorService } from '../../services/ai/aiMediator';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Analyze discussion and determine if intervention is needed
 * POST /api/v1/collaboration/mediator/analyze
 */
router.post('/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { messages, projectId, prId, filesChanged, codeDiff, language, teamSize } = req.body;

  if (!messages || !projectId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: messages, projectId',
    });
  }

  logger.info('Analyzing discussion for mediation', {
    projectId,
    messageCount: messages.length,
    prId,
  });

  const result = await aiMediatorService.analyzeDiscussion(messages, {
    projectId,
    prId,
    filesChanged,
    codeDiff,
    language,
    teamSize,
  });

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Generate summary of discussion
 * POST /api/v1/collaboration/mediator/summarize
 */
router.post('/summarize', asyncHandler(async (req: Request, res: Response) => {
  const { messages, projectId, prId, filesChanged, language } = req.body;

  if (!messages || !projectId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: messages, projectId',
    });
  }

  const summary = await aiMediatorService.generateSummary(messages, {
    projectId,
    prId,
    filesChanged,
    language,
  });

  res.json({
    success: true,
    data: { summary },
  });
}));

/**
 * Generate resolution options for a disagreement
 * POST /api/v1/collaboration/mediator/resolve
 */
router.post('/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { disagreement, projectId, filesChanged, language, preferences } = req.body;

  if (!disagreement || !projectId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: disagreement, projectId',
    });
  }

  logger.info('Generating resolution options', { projectId });

  const suggestion = await aiMediatorService.generateResolutionOptions(
    disagreement,
    { projectId, filesChanged, language },
    preferences
  );

  res.json({
    success: true,
    data: suggestion,
  });
}));

/**
 * Facilitate consensus building
 * POST /api/v1/collaboration/mediator/consensus
 */
router.post('/consensus', asyncHandler(async (req: Request, res: Response) => {
  const { messages, options } = req.body;

  if (!messages || !options || !Array.isArray(options)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: messages, options (array)',
    });
  }

  const result = await aiMediatorService.facilitateConsensus(messages, options);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Get debate metrics for a discussion
 * POST /api/v1/collaboration/mediator/metrics
 */
router.post('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: messages (array)',
    });
  }

  const metrics = aiMediatorService.calculateDebateMetrics(messages);

  res.json({
    success: true,
    data: metrics,
  });
}));

export default router;
