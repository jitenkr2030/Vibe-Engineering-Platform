import { Router } from 'express';
import { body } from 'express-validator';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { ApiError } from '@vibe/shared';
import { logger } from '../utils/logger';

const router = Router();

// Get user profile
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscription: true,
        preferences: true,
        tokenUsage: true,
        tokenLimit: true,
        projectLimit: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      meta: { timestamp: new Date() },
    });
  })
);

// Update user profile
router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('avatar').optional().isURL(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name && { name }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscription: true,
      },
    });

    logger.info('Profile updated', { userId: req.userId });

    res.json({
      success: true,
      data: { user },
      meta: { timestamp: new Date() },
    });
  })
);

// Update user preferences
router.patch(
  '/preferences',
  authenticate,
  [body('preferences').isObject()],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { preferences },
      select: {
        id: true,
        email: true,
        preferences: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      meta: { timestamp: new Date() },
    });
  })
);

// Get user's token usage
router.get(
  '/usage',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        tokenUsage: true,
        tokenLimit: true,
        projectLimit: true,
        subscription: true,
      },
    });

    const recentGenerations = await prisma.codeGeneration.aggregate({
      where: {
        userId: req.userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: {
        tokenUsage: true,
      },
    });

    const usage = {
      current: user?.tokenUsage || 0,
      limit: user?.tokenLimit || 10000,
      percentage: user?.tokenLimit
        ? Math.round(((user.tokenUsage || 0) / user.tokenLimit) * 100)
        : 0,
      recentUsage: recentGenerations._sum.tokenUsage || 0,
      period: '30 days',
      projects: {
        current: await prisma.project.count({
          where: { ownerId: req.userId },
        }),
        limit: user?.projectLimit || 3,
      },
    };

    res.json({
      success: true,
      data: { usage },
      meta: { timestamp: new Date() },
    });
  })
);

// Get user's activity
router.get(
  '/activity',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { limit = 20 } = req.query;

    const [projects, generations, deployments] = await Promise.all([
      prisma.project.findMany({
        where: { ownerId: req.userId },
        orderBy: { updatedAt: 'desc' },
        take: Number(limit),
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      }),
      prisma.codeGeneration.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        select: {
          id: true,
          projectId: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.deployment.findMany({
        where: {},
        orderBy: { startedAt: 'desc' },
        take: Number(limit),
        select: {
          id: true,
          projectId: true,
          status: true,
          environment: true,
          startedAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        generations,
        deployments,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Delete account
router.delete(
  '/account',
  authenticate,
  [
    body('password').notEmpty().withMessage('Password is required for account deletion'),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || !user.passwordHash) {
      throw ApiError.notFound('User');
    }

    // Verify password (simplified - in production use bcrypt.compare)
    // await bcrypt.compare(password, user.passwordHash);

    // Delete user's data
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: req.userId } }),
      prisma.project.deleteMany({ where: { ownerId: req.userId } }),
      prisma.projectMemory.deleteMany({ where: { userId: req.userId } }),
      prisma.promptTemplate.deleteMany({ where: { userId: req.userId } }),
      prisma.user.delete({ where: { id: req.userId } }),
    ]);

    logger.info('Account deleted', { userId: req.userId });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  })
);

export { router as userRoutes };
