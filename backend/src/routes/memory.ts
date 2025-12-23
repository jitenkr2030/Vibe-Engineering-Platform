import { Router } from 'express';
import { body } from 'express-validator';
import { AuthenticatedRequest, authenticate, checkProjectAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { ApiError } from '@vibe/shared';
import { logger } from '../utils/logger';

const router = Router();

// Get project memories
router.get(
  '/:projectId',
  authenticate,
  checkProjectAccess('read'),
  [
    body('type').optional().isIn(['PREFERENCE', 'DECISION', 'MISTAKE', 'PATTERN', 'CONTEXT']),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { type } = req.query as any;

    const where: any = { projectId };
    if (type) where.type = type;

    const memories = await prisma.projectMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get architecture decisions
    const decisions = await prisma.architectureDecision.findMany({
      where: { projectId },
      orderBy: { decidedAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        memories,
        decisions,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Add memory
router.post(
  '/:projectId',
  authenticate,
  checkProjectAccess('write'),
  [
    body('type').isIn(['PREFERENCE', 'DECISION', 'MISTAKE', 'PATTERN', 'CONTEXT']),
    body('data').isObject(),
    body('confidence').optional().isFloat({ min: 0, max: 1 }),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { type, data, confidence = 1.0 } = req.body;

    const memory = await prisma.projectMemory.create({
      data: {
        projectId,
        userId: req.userId,
        type,
        data,
        confidence,
      },
    });

    logger.info('Memory added', { projectId, type });

    res.status(201).json({
      success: true,
      data: { memory },
      meta: { timestamp: new Date() },
    });
  })
);

// Add architecture decision
router.post(
  '/:projectId/decisions',
  authenticate,
  checkProjectAccess('write'),
  [
    body('title').notEmpty().isLength({ max: 200 }),
    body('description').notEmpty().isLength({ max: 5000 }),
    body('context').notEmpty().isLength({ max: 5000 }),
    body('decision').notEmpty().isLength({ max: 5000 }),
    body('alternatives').optional().isArray(),
    body('consequences').optional().isArray(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { title, description, context, decision, alternatives, consequences } = req.body;

    const decisionRecord = await prisma.architectureDecision.create({
      data: {
        projectId,
        title,
        description,
        context,
        decision,
        alternatives: alternatives || [],
        consequences: consequences || [],
        decidedBy: req.userId,
      },
    });

    logger.info('Architecture decision recorded', { projectId, title });

    res.status(201).json({
      success: true,
      data: { decision: decisionRecord },
      meta: { timestamp: new Date() },
    });
  })
);

// Update memory
router.patch(
  '/:projectId/:memoryId',
  authenticate,
  checkProjectAccess('write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { memoryId } = req.params;
    const { data, confidence } = req.body;

    const memory = await prisma.projectMemory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      throw ApiError.notFound('Memory');
    }

    const updated = await prisma.projectMemory.update({
      where: { id: memoryId },
      data: {
        ...(data && { data }),
        ...(confidence !== undefined && { confidence }),
      },
    });

    res.json({
      success: true,
      data: { memory: updated },
      meta: { timestamp: new Date() },
    });
  })
);

// Delete memory
router.delete(
  '/:projectId/:memoryId',
  authenticate,
  checkProjectAccess('write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { memoryId } = req.params;

    await prisma.projectMemory.delete({
      where: { id: memoryId },
    });

    res.json({
      success: true,
      message: 'Memory deleted',
    });
  })
);

// Learn from mistake
router.post(
  '/:projectId/learn',
  authenticate,
  checkProjectAccess('write'),
  [
    body('description').notEmpty(),
    body('solution').notEmpty(),
    body('category').notEmpty(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { description, solution, category } = req.body;

    // Check if similar mistake exists
    const existing = await prisma.projectMemory.findFirst({
      where: {
        projectId,
        type: 'MISTAKE',
        data: { path: { description } },
      },
    });

    if (existing) {
      // Increment prevention count
      await prisma.projectMemory.update({
        where: { id: existing.id },
        data: {
          data: {
            ...existing.data as object,
            preventedCount: ((existing.data as any).preventedCount || 0) + 1,
          },
        },
      });

      res.json({
        success: true,
        message: 'Mistake recorded',
        data: { preventedCount: ((existing.data as any).preventedCount || 0) + 1 },
      });
      return;
    }

    const memory = await prisma.projectMemory.create({
      data: {
        projectId,
        userId: req.userId,
        type: 'MISTAKE',
        data: {
          description,
          solution,
          category,
          preventedCount: 1,
        },
        confidence: 1.0,
      },
    });

    logger.info('Learning from mistake', { projectId, category });

    res.status(201).json({
      success: true,
      data: { memory },
      meta: { timestamp: new Date() },
    });
  })
);

// Get user preferences
router.get(
  '/user/preferences',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const memories = await prisma.projectMemory.findMany({
      where: {
        userId: req.userId,
        type: 'PREFERENCE',
      },
    });

    const preferences: Record<string, unknown> = {};
    for (const memory of memories) {
      Object.assign(preferences, memory.data);
    }

    res.json({
      success: true,
      data: { preferences },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as memoryRoutes };
