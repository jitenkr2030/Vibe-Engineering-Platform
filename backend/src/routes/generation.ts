import { Router } from 'express';
import { body } from 'express-validator';
import { AuthenticatedRequest, authenticate, checkProjectAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { ApiError, HTTP_STATUS } from '@vibe/shared';
import { logger } from '../utils/logger';
import { generationRateLimiter } from '../middleware/rateLimiter';
import { CodeGenerationService } from '../services/ai/codeGeneration';

const router = Router();
const codeGenerationService = new CodeGenerationService();

// Generate code
router.post(
  '/code',
  authenticate,
  generationRateLimiter,
  [
    body('prompt').notEmpty().isLength({ max: 10000 }).withMessage('Prompt is required'),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('language').optional().isString(),
    body('framework').optional().isString(),
    body('style').optional().isObject(),
    body('context').optional().isObject(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { prompt, projectId, language, framework, style, context } = req.body;

    // Check token usage
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { tokenUsage: true, tokenLimit: true, subscription: true },
    });

    if (user && user.tokenUsage >= user.tokenLimit) {
      throw ApiError.badRequest('Token limit reached. Please upgrade your plan.');
    }

    // Get project files for context
    const projectFiles = await prisma.projectFile.findMany({
      where: { projectId, status: 'ACTIVE' },
      select: { path: true, content: true, language: true },
    });

    // Create generation record
    const generation = await prisma.codeGeneration.create({
      data: {
        projectId,
        userId: req.userId!,
        prompt,
        status: 'PROCESSING',
        metadata: { language, framework },
      },
    });

    // Start async generation
    const startTime = Date.now();

    try {
      const result = await codeGenerationService.generate(prompt, {
        files: projectFiles,
        techStack: context?.techStack || {},
        architecture: context?.architecture || {},
        language,
        framework,
        style,
      });

      // Update generation record
      await prisma.codeGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          response: result,
          tokenUsage: {
            prompt: result.tokenUsage?.prompt || 0,
            completion: result.tokenUsage?.completion || 0,
            total: result.tokenUsage?.total || 0,
          },
          latency: Date.now() - startTime,
          quality: result.quality,
        },
      });

      // Update user token usage
      if (result.tokenUsage?.total) {
        await prisma.user.update({
          where: { id: req.userId },
          data: { tokenUsage: { increment: result.tokenUsage.total } },
        });
      }

      logger.info('Code generated', { generationId: generation.id, projectId });

      res.json({
        success: true,
        data: {
          generationId: generation.id,
          ...result,
        },
        meta: {
          latency: Date.now() - startTime,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      await prisma.codeGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Generation failed',
        },
      });

      throw error;
    }
  })
);

// Get generation status
router.get(
  '/:generationId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { generationId } = req.params;

    const generation = await prisma.codeGeneration.findUnique({
      where: { id: generationId },
    });

    if (!generation) {
      throw ApiError.notFound('Generation');
    }

    if (generation.userId !== req.userId) {
      throw ApiError.forbidden('Access denied');
    }

    res.json({
      success: true,
      data: { generation },
      meta: { timestamp: new Date() },
    });
  })
);

// Get project generations
router.get(
  '/project/:projectId',
  authenticate,
  checkProjectAccess('read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const generations = await prisma.codeGeneration.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: { generations },
      meta: { timestamp: new Date() },
    });
  })
);

// Chat with AI (conversation-based)
router.post(
  '/chat',
  authenticate,
  generationRateLimiter,
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('conversationId').optional().isString(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { message, projectId, conversationId } = req.body;

    let conversation;

    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw ApiError.notFound('Conversation');
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          projectId,
          title: message.slice(0, 50),
          context: {},
        },
      });
    }

    // Add user message
    const userMessage = await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    // Get previous messages for context
    const previousMessages = await prisma.conversationMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Get project context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { techStack: true, architecture: true, name: true },
    });

    // Generate response
    const response = await codeGenerationService.chat(
      [...previousMessages.map((m) => ({
        role: m.role.toLowerCase(),
        content: m.content,
      })),
      { role: 'user', content: message }],
      {
        projectName: project?.name || 'Project',
        techStack: project?.techStack as object || {},
        architecture: project?.architecture as object || {},
      }
    );

    // Save AI response
    const aiMessage = await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: response.content,
        metadata: {
          tokens: response.tokens,
          model: response.model,
        },
      },
    });

    // Update conversation context
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
        context: {
          lastTopic: message.slice(0, 100),
        },
      },
    });

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        message: aiMessage,
        response: response.content,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Apply generated code
router.post(
  '/apply',
  authenticate,
  [
    body('generationId').notEmpty(),
    body('files').isArray(),
    body('files.*.path').notEmpty(),
    body('files.*.content').notEmpty(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { generationId, files } = req.body;

    const generation = await prisma.codeGeneration.findUnique({
      where: { id: generationId },
    });

    if (!generation || generation.userId !== req.userId) {
      throw ApiError.notFound('Generation');
    }

    const results = [];

    for (const fileData of files) {
      const checksum = crypto.createHash('sha256').update(fileData.content).digest('hex');

      const existingFile = await prisma.projectFile.findUnique({
        where: {
          projectId_path: {
            projectId: generation.projectId,
            path: fileData.path,
          },
        },
      });

      if (existingFile) {
        await prisma.projectFile.update({
          where: { id: existingFile.id },
          data: {
            content: fileData.content,
            size: fileData.content.length,
            checksum,
            status: 'MODIFIED',
          },
        });
      } else {
        const pathParts = fileData.path.split('/');
        await prisma.projectFile.create({
          data: {
            projectId: generation.projectId,
            path: fileData.path,
            name: pathParts[pathParts.length - 1],
            type: 'FILE',
            content: fileData.content,
            size: fileData.content.length,
            checksum,
            status: 'ACTIVE',
            language: detectLanguage(fileData.path),
          },
        });
      }

      results.push({ path: fileData.path, status: 'applied' });
    }

    logger.info('Generated code applied', { generationId, fileCount: files.length });

    res.json({
      success: true,
      data: { applied: results },
      meta: { timestamp: new Date() },
    });
  })
);

// Helper function to detect language from file extension
function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    json: 'json',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
  };

  return languageMap[ext || ''] || 'text';
}

import crypto from 'crypto';

export { router as generationRoutes };
