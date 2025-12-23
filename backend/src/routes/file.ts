import { Router } from 'express';
import { body, query } from 'express-validator';
import { AuthenticatedRequest, authenticate, checkProjectAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { ApiError, HTTP_STATUS, ERROR_CODES, ALLOWED_FILE_TYPES } from '@vibe/shared';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

// Get project files tree
router.get(
  '/:projectId/tree',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const files = await prisma.projectFile.findMany({
      where: { projectId },
      orderBy: [{ type: 'asc' }, { path: 'asc' }],
    });

    // Build tree structure
    const buildTree = (files: any[], parentPath = ''): any[] => {
      const directories = files
        .filter((f) => f.type === 'DIRECTORY' && (f.path === parentPath || f.path.startsWith(parentPath + '/')))
        .map((d) => ({
          id: d.id,
          name: d.name,
          type: 'directory',
          path: d.path,
          children: buildTree(files, d.path),
        }));

      const fileItems = files
        .filter((f) => f.type !== 'DIRECTORY' && f.path.startsWith(parentPath) && f.path.split('/').filter(Boolean).length === (parentPath ? parentPath.split('/').filter(Boolean).length + 1 : 1))
        .map((f) => ({
          id: f.id,
          name: f.name,
          type: 'file',
          path: f.path,
          language: f.language,
          status: f.status,
        }));

      return [...directories, ...fileItems];
    };

    const tree = buildTree(files);

    res.json({
      success: true,
      data: { files: tree },
      meta: { timestamp: new Date() },
    });
  })
);

// Get single file
router.get(
  '/:projectId/files/:fileId',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileId } = req.params;

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!file) {
      throw ApiError.notFound('File');
    }

    res.json({
      success: true,
      data: { file },
      meta: { timestamp: new Date() },
    });
  })
);

// Create file
router.post(
  '/:projectId/files',
  authenticate,
  checkProjectAccess('write'),
  [
    body('path').notEmpty().withMessage('File path is required'),
    body('name').notEmpty().withMessage('File name is required'),
    body('type').isIn(['file', 'directory', 'config', 'documentation', 'test']).withMessage('Invalid file type'),
    body('content').optional(),
    body('language').optional(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { path, name, type, content, language } = req.body;
    const { projectId } = req.params;

    // Check for duplicate
    const existing = await prisma.projectFile.findUnique({
      where: { projectId_path: { projectId, path } },
    });

    if (existing) {
      throw ApiError.conflict('File already exists at this path');
    }

    const checksum = content ? crypto.createHash('sha256').update(content).digest('hex') : '';

    const file = await prisma.projectFile.create({
      data: {
        projectId,
        path,
        name,
        type,
        content: content || null,
        language,
        size: content?.length || 0,
        checksum,
        status: 'ACTIVE',
      },
    });

    logger.info('File created', { fileId: file.id, projectId });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { file },
      meta: { timestamp: new Date() },
    });
  })
);

// Update file
router.patch(
  '/:projectId/files/:fileId',
  authenticate,
  checkProjectAccess('write'),
  [
    body('content').optional(),
    body('message').optional().isString(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileId } = req.params;
    const { content, message = 'Update file' } = req.body;

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw ApiError.notFound('File');
    }

    const checksum = content ? crypto.createHash('sha256').update(content).digest('hex') : '';

    // Create version before updating
    if (file.content && file.content !== content) {
      await prisma.fileVersion.create({
        data: {
          fileId,
          content: file.content,
          message: file.checksum === checksum ? 'Initial version' : message,
          checksum: file.checksum,
        },
      });
    }

    const updatedFile = await prisma.projectFile.update({
      where: { id: fileId },
      data: {
        content,
        size: content?.length || 0,
        checksum,
        status: 'MODIFIED',
        updatedAt: new Date(),
      },
    });

    logger.info('File updated', { fileId });

    res.json({
      success: true,
      data: { file: updatedFile },
      meta: { timestamp: new Date() },
    });
  })
);

// Delete file
router.delete(
  '/:projectId/files/:fileId',
  authenticate,
  checkProjectAccess('write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileId } = req.params;

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw ApiError.notFound('File');
    }

    // Soft delete - mark as deleted
    await prisma.projectFile.update({
      where: { id: fileId },
      data: { status: 'DELETED' },
    });

    logger.info('File deleted', { fileId });

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  })
);

// Get file versions
router.get(
  '/:projectId/files/:fileId/versions',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileId } = req.params;

    const versions = await prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { versions },
      meta: { timestamp: new Date() },
    });
  })
);

// Restore file version
router.post(
  '/:projectId/files/:fileId/restore/:versionId',
  authenticate,
  checkProjectAccess('write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileId, versionId } = req.params;

    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.fileId !== fileId) {
      throw ApiError.notFound('Version');
    }

    // Update file with version content
    await prisma.projectFile.update({
      where: { id: fileId },
      data: {
        content: version.content,
        checksum: version.checksum,
        status: 'MODIFIED',
      },
    });

    logger.info('File version restored', { fileId, versionId });

    res.json({
      success: true,
      message: 'Version restored successfully',
    });
  })
);

export { router as fileRoutes };
