import { Router } from 'express';
import { body } from 'express-validator';
import { AuthenticatedRequest, authenticate, checkProjectAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { ApiError, DeploymentEnvironment, DeploymentStatus } from '@vibe/shared';
import { logger } from '../utils/logger';

const router = Router();

// Get deployments for project
router.get(
  '/:projectId',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const deployments = await prisma.deployment.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: { deployments },
      meta: { timestamp: new Date() },
    });
  })
);

// Get single deployment
router.get(
  '/:projectId/:deploymentId',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw ApiError.notFound('Deployment');
    }

    res.json({
      success: true,
      data: { deployment },
      meta: { timestamp: new Date() },
    });
  })
);

// Create deployment
router.post(
  '/:projectId',
  authenticate,
  checkProjectAccess('write'),
  [
    body('environment').isIn(['development', 'staging', 'production']).withMessage('Invalid environment'),
    body('version').optional().isString(),
    body('config').optional().isObject(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { environment, version, config } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw ApiError.notFound('Project');
    }

    // Check for existing deployment in progress
    const inProgress = await prisma.deployment.findFirst({
      where: {
        projectId,
        status: { in: ['PENDING', 'BUILDING', 'DEPLOYING'] },
      },
    });

    if (inProgress) {
      throw ApiError.badRequest('Deployment already in progress');
    }

    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        version: version || `v${Date.now()}`,
        environment: environment.toUpperCase(),
        status: 'PENDING',
        config: config || {},
        logs: [],
      },
    });

    logger.info('Deployment initiated', { deploymentId: deployment.id, environment });

    // TODO: Start deployment process asynchronously
    // await deploymentService.startDeployment(deployment.id);

    res.status(201).json({
      success: true,
      data: { deployment },
      meta: { timestamp: new Date() },
    });
  })
);

// Cancel deployment
router.post(
  '/:projectId/:deploymentId/cancel',
  authenticate,
  checkProjectAccess('write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw ApiError.notFound('Deployment');
    }

    if (!['PENDING', 'BUILDING', 'DEPLOYING'].includes(deployment.status)) {
      throw ApiError.badRequest('Deployment cannot be cancelled');
    }

    const updated = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    logger.info('Deployment cancelled', { deploymentId });

    res.json({
      success: true,
      data: { deployment: updated },
      meta: { timestamp: new Date() },
    });
  })
);

// Rollback deployment
router.post(
  '/:projectId/:deploymentId/rollback',
  authenticate,
  checkProjectAccess('write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId, projectId } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw ApiError.notFound('Deployment');
    }

    // Find previous successful deployment
    const previous = await prisma.deployment.findFirst({
      where: {
        projectId,
        status: 'SUCCESS',
        id: { not: deploymentId },
      },
      orderBy: { completedAt: 'desc' },
    });

    if (!previous) {
      throw ApiError.notFound('No previous deployment to rollback to');
    }

    const rollback = await prisma.deployment.create({
      data: {
        projectId,
        version: `rollback-to-${previous.version}`,
        environment: previous.environment,
        status: 'ROLLING_BACK',
        config: previous.config,
        logs: [],
        rollbackVersion: previous.version,
      },
    });

    // TODO: Perform rollback
    // await deploymentService.rollback(deploymentId, previous.id);

    logger.info('Deployment rollback initiated', { deploymentId: rollback.id, toVersion: previous.version });

    res.json({
      success: true,
      data: { deployment: rollback, rollbackTo: previous.version },
      meta: { timestamp: new Date() },
    });
  })
);

// Get deployment logs
router.get(
  '/:projectId/:deploymentId/logs',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw ApiError.notFound('Deployment');
    }

    const logs = (deployment.logs as any[]) || [];

    res.json({
      success: true,
      data: { logs },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as deploymentRoutes };
