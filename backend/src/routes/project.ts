import { Router } from 'express';
import { body, query } from 'express-validator';
import { AuthenticatedRequest, authenticate, checkProjectAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validationMiddleware } from '../middleware/validation';
import { prisma } from '../config/database';
import { ApiError, HTTP_STATUS, ERROR_CODES, PAGINATION } from '@vibe/shared';
import { logger } from '../utils/logger';
import { generateShortId } from '../utils/helpers';

const router = Router();

// Validation rules
const createProjectValidation = [
  body('name').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Project name is required (1-100 characters)'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('visibility').optional().isIn(['private', 'team', 'public']).default('private'),
  body('techStack').optional().isObject(),
  body('architecture').optional().isObject(),
];

const updateProjectValidation = [
  body('name').optional().trim().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('visibility').optional().isIn(['private', 'team', 'public']),
  body('status').optional().isIn(['planning', 'in_progress', 'review', 'deployed', 'archived']),
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().default(PAGINATION.defaultPage),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().default(PAGINATION.defaultLimit),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString(),
  query('status').optional().isString(),
  query('visibility').optional().isString(),
];

// Get all projects for user
router.get(
  '/',
  authenticate,
  paginationValidation,
  validationMiddleware as any,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page, limit, sortBy, sortOrder, search, status, visibility } = req.query as any;

    // Build where clause
    const where: any = {
      OR: [
        { ownerId: req.userId },
        { collaborators: { some: { userId: req.userId } } },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (visibility) {
      where.visibility = visibility;
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        collaborators: {
          select: { userId: true, role: true },
        },
        _count: {
          select: { files: true, deployments: true },
        },
      },
      orderBy: { [sortBy || 'updatedAt']: sortOrder || 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Get single project
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        files: {
          where: { type: 'DIRECTORY' },
          select: { id: true, path: true, name: true },
        },
        architecture: true,
        _count: {
          select: { files: true, generations: true, qualityGates: true },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project');
    }

    // Check access
    const hasAccess =
      project.ownerId === req.userId ||
      project.collaborators.some((c) => c.userId === req.userId) ||
      project.visibility === 'public';

    if (!hasAccess) {
      throw ApiError.forbidden('Access denied');
    }

    res.json({
      success: true,
      data: { project },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Create project
router.post(
  '/',
  authenticate,
  createProjectValidation,
  validationMiddleware as any,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, visibility, techStack, architecture } = req.body;

    // Check project limit
    const projectCount = await prisma.project.count({
      where: { ownerId: req.userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { projectLimit: true },
    });

    if (projectCount >= (user?.projectLimit || 3)) {
      throw ApiError.badRequest('Project limit reached. Please upgrade your plan.');
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.userId,
        visibility,
        techStack: techStack || {},
        architecture: architecture || { type: 'monolith', pattern: 'mvc' },
        status: 'PLANNING',
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create default files
    const rootFiles = [
      { name: 'src', type: 'DIRECTORY', path: 'src', projectId: project.id },
      { name: 'tests', type: 'DIRECTORY', path: 'tests', projectId: project.id },
      { name: 'docs', type: 'DIRECTORY', path: 'docs', projectId: project.id },
    ];

    await prisma.projectFile.createMany({
      data: rootFiles,
    });

    logger.info('Project created', { projectId: project.id, userId: req.userId });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { project },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Update project
router.patch(
  '/:id',
  authenticate,
  checkProjectAccess('write'),
  updateProjectValidation,
  validationMiddleware as any,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, visibility, status } = req.body;
    const project = req.body.project;

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility }),
        ...(status && { status }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info('Project updated', { projectId: project.id });

    res.json({
      success: true,
      data: { project: updatedProject },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Delete project
router.delete(
  '/:id',
  authenticate,
  checkProjectAccess('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const project = req.body.project;

    await prisma.project.delete({
      where: { id: project.id },
    });

    logger.info('Project deleted', { projectId: project.id });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  })
);

// Add collaborator
router.post(
  '/:id/collaborators',
  authenticate,
  checkProjectAccess('admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['admin', 'developer', 'viewer']).withMessage('Invalid role'),
  ],
  validationMiddleware as any,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, role } = req.body;
    const project = req.body.project;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('User');
    }

    // Check if already a collaborator
    const existing = await prisma.collaborator.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict('User is already a collaborator');
    }

    const collaborator = await prisma.collaborator.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    logger.info('Collaborator added', { projectId: project.id, userId: user.id });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { collaborator },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Remove collaborator
router.delete(
  '/:id/collaborators/:userId',
  authenticate,
  checkProjectAccess('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id, userId } = req.params;
    const project = req.body.project;

    // Can't remove owner
    if (userId === project.ownerId) {
      throw ApiError.badRequest('Cannot remove project owner');
    }

    await prisma.collaborator.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    logger.info('Collaborator removed', { projectId: id, userId });

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
    });
  })
);

// Get project metrics
router.get(
  '/:id/metrics',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const project = req.body.project;

    const [fileCount, totalLines, generationsCount, deploymentsCount, latestGate] = await Promise.all([
      prisma.projectFile.count({ where: { projectId: project.id } }),
      prisma.projectFile.aggregate({
        where: { projectId: project.id },
        _sum: { size: true },
      }),
      prisma.codeGeneration.count({ where: { projectId: project.id } }),
      prisma.deployment.count({ where: { projectId: project.id } }),
      prisma.qualityGate.findFirst({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const metrics = {
      fileCount,
      totalLines: totalLines._sum.size || 0,
      generationsCount,
      deploymentsCount,
      lastQualityCheck: latestGate?.createdAt,
      lastQualityStatus: latestGate?.status,
      status: project.status,
      visibility: project.visibility,
    };

    res.json({
      success: true,
      data: { metrics },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

export { router as projectRoutes };
