import { Router } from 'express';
import { AuthenticatedRequest, authenticate, checkProjectAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { ApiError } from '@vibe/shared';
import { QualityGateService } from '../services/quality/qualityGate';

const router = Router();
const qualityService = new QualityGateService();

// Run quality gate on project
router.post(
  '/check/:projectId',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    // Get all project files
    const files = await prisma.projectFile.findMany({
      where: { projectId, status: 'ACTIVE', type: 'FILE' },
    });

    // Create quality gate record
    const qualityGate = await prisma.qualityGate.create({
      data: {
        projectId,
        name: `Quality Check ${new Date().toISOString()}`,
        status: 'RUNNING',
        triggeredBy: req.userId,
      },
    });

    // Run quality checks
    const results = await qualityService.runChecks(files);

    // Calculate summary
    const summary = {
      total: results.length,
      passed: results.filter((r) => r.status === 'passed').length,
      failed: results.filter((r) => r.status === 'failed').length,
      warnings: results.filter((r) => r.status === 'warning').length,
      score: Math.round(
        (results.filter((r) => r.status === 'passed').length / results.length) * 100
      ),
    };

    const status =
      summary.failed > 0 ? 'FAILED' : summary.warnings > 0 ? 'WARNING' : 'PASSED';

    await prisma.qualityGate.update({
      where: { id: qualityGate.id },
      data: {
        status,
        results,
        summary,
      },
    });

    // Update project metrics
    await prisma.project.update({
      where: { id: projectId },
      data: {
        metrics: {
          qualityScore: summary.score,
          lastChecked: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      data: {
        qualityGateId: qualityGate.id,
        status,
        summary,
        results,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Get quality gates for project
router.get(
  '/:projectId',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const gates = await prisma.qualityGate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: { gates },
      meta: { timestamp: new Date() },
    });
  })
);

// Get single quality gate
router.get(
  '/check/:gateId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { gateId } = req.params;

    const gate = await prisma.qualityGate.findUnique({
      where: { id: gateId },
    });

    if (!gate) {
      throw ApiError.notFound('Quality Gate');
    }

    res.json({
      success: true,
      data: { gate },
      meta: { timestamp: new Date() },
    });
  })
);

// Run specific check type
router.post(
  '/check/:projectId/:checkType',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId, checkType } = req.params;

    const files = await prisma.projectFile.findMany({
      where: { projectId, status: 'ACTIVE', type: 'FILE' },
    });

    const results = await qualityService.runSpecificCheck(checkType, files);

    res.json({
      success: true,
      data: { checkType, results },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as qualityRoutes };
