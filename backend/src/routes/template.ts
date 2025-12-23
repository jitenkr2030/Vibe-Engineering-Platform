import { Router } from 'express';
import { body, query } from 'express-validator';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { ApiError } from '@vibe/shared';
import { logger } from '../utils/logger';

const router = Router();

// Get all templates
router.get(
  '/',
  authenticate,
  [
    query('category').optional().isString(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { category, page = 1, limit = 20 } = req.query;

    const where: any = {
      OR: [
        { isSystem: true },
        { userId: req.userId },
      ],
    };

    if (category) {
      where.category = category;
    }

    const [templates, total] = await Promise.all([
      prisma.promptTemplate.findMany({
        where,
        orderBy: [{ usage: 'desc' }, { rating: 'desc' }],
        skip: (page as number - 1) * limit,
        take: limit as number,
      }),
      prisma.promptTemplate.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page: page as number,
          limit: limit as number,
          total,
          totalPages: Math.ceil(total / (limit as number)),
        },
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Get single template
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const template = await prisma.promptTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      throw ApiError.notFound('Template');
    }

    // Check access
    if (!template.isSystem && template.userId !== req.userId) {
      throw ApiError.forbidden('Access denied');
    }

    res.json({
      success: true,
      data: { template },
      meta: { timestamp: new Date() },
    });
  })
);

// Create template
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().isLength({ max: 100 }),
    body('description').optional().isLength({ max: 1000 }),
    body('category').notEmpty().isString(),
    body('template').notEmpty().isLength({ max: 10000 }),
    body('role').optional().isIn(['user', 'assistant', 'system', 'mentor']),
    body('variables').optional().isArray(),
    body('examples').optional().isArray(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, category, template, role, variables, examples } = req.body;

    const newTemplate = await prisma.promptTemplate.create({
      data: {
        name,
        description,
        category,
        template,
        role: role || 'ASSISTANT',
        variables: variables || [],
        examples: examples || [],
        userId: req.userId,
        isSystem: false,
      },
    });

    logger.info('Template created', { templateId: newTemplate.id });

    res.status(201).json({
      success: true,
      data: { template: newTemplate },
      meta: { timestamp: new Date() },
    });
  })
);

// Update template
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const template = await prisma.promptTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      throw ApiError.notFound('Template');
    }

    if (template.userId !== req.userId) {
      throw ApiError.forbidden('Access denied');
    }

    const { name, description, category, template: templateContent, role, variables, examples } = req.body;

    const updated = await prisma.promptTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(templateContent && { template: templateContent }),
        ...(role && { role }),
        ...(variables && { variables }),
        ...(examples && { examples }),
      },
    });

    res.json({
      success: true,
      data: { template: updated },
      meta: { timestamp: new Date() },
    });
  })
);

// Delete template
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const template = await prisma.promptTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      throw ApiError.notFound('Template');
    }

    if (template.userId !== req.userId) {
      throw ApiError.forbidden('Access denied');
    }

    await prisma.promptTemplate.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Template deleted',
    });
  })
);

// Rate template
router.post(
  '/:id/rate',
  authenticate,
  [body('rating').isInt({ min: 1, max: 5 })],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { rating } = req.body;
    const template = await prisma.promptTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      throw ApiError.notFound('Template');
    }

    // Simple rating update - in production, you'd track individual ratings
    const newRating = ((template.rating * template.usage) + rating) / (template.usage + 1);

    await prisma.promptTemplate.update({
      where: { id: req.params.id },
      data: {
        rating: newRating,
        usage: { increment: 1 },
      },
    });

    res.json({
      success: true,
      message: 'Rating submitted',
    });
  })
);

// Get template categories
router.get(
  '/categories/list',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const categories = [
      { id: 'ARCHITECTURE', name: 'Architecture', description: 'System design and architecture patterns' },
      { id: 'API_DESIGN', name: 'API Design', description: 'RESTful API and endpoint design' },
      { id: 'FRONTEND', name: 'Frontend', description: 'Frontend development templates' },
      { id: 'BACKEND', name: 'Backend', description: 'Backend development templates' },
      { id: 'DATABASE', name: 'Database', description: 'Database design and queries' },
      { id: 'TESTING', name: 'Testing', description: 'Test generation templates' },
      { id: 'SECURITY', name: 'Security', description: 'Security and authentication' },
      { id: 'DEPLOYMENT', name: 'Deployment', description: 'DevOps and deployment' },
      { id: 'REFACTORING', name: 'Refactoring', description: 'Code refactoring templates' },
      { id: 'DOCUMENTATION', name: 'Documentation', description: 'Documentation templates' },
    ];

    res.json({
      success: true,
      data: { categories },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as templateRoutes };
