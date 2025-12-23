import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { aiReviewer } from '../services/ai/aiReviewer';
import { prisma } from '../config/database';

const router = Router();

// Review a single file
router.post(
  '/review/file',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language, options } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const file = {
      path: filePath,
      content: fileContent,
      language: language || 'typescript',
      size: Buffer.byteLength(fileContent, 'utf8'),
    };

    const result = await aiReviewer.reviewCode(file, options || {});

    // Save review to database
    const savedReview = await prisma.codeReview.create({
      data: {
        filePath,
        language: file.language,
        score: result.score,
        issues: result.issues as any,
        summary: result.summary,
        highlights: result.highlights as any,
        userId: req.userId,
      },
    });

    res.json({
      success: true,
      data: {
        reviewId: savedReview.id,
        result,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Review multiple files (batch)
router.post(
  '/review/batch',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { files, options } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'files array is required',
      });
    }

    const codeFiles = files.map((f: any) => ({
      path: f.filePath,
      content: f.fileContent,
      language: f.language || 'typescript',
      size: Buffer.byteLength(f.fileContent, 'utf8'),
    }));

    const results = await aiReviewer.reviewMultipleFiles(codeFiles, options || {});

    res.json({
      success: true,
      data: {
        totalFiles: results.length,
        results,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Review entire project
router.post(
  '/review/project/:projectId',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId } = req.params;
    const { options } = req.body;

    // Get project files from database
    const projectFiles = await prisma.projectFile.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
        type: 'FILE',
      },
    });

    if (projectFiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No files found in project',
      });
    }

    const codeFiles = projectFiles.map((f) => ({
      path: f.path,
      content: f.content || '',
      language: f.language || 'typescript',
      size: f.size || 0,
    }));

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    const result = await aiReviewer.reviewProject(codeFiles, {
      name: project?.name || 'Unknown',
      language: project?.language || 'typescript',
      framework: project?.framework || undefined,
      description: project?.description || '',
    });

    // Save project review
    await prisma.projectReview.create({
      data: {
        projectId,
        score: result.summary.averageScore,
        totalIssues: result.summary.totalIssues,
        issuesByCategory: result.summary.categoryBreakdown as any,
        issuesBySeverity: result.summary.severityBreakdown as any,
        recommendations: result.recommendations as any,
        userId: req.userId,
      },
    });

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Security-focused review
router.post(
  '/review/security',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const file = {
      path: filePath,
      content: fileContent,
      language: language || 'typescript',
      size: Buffer.byteLength(fileContent, 'utf8'),
    };

    const result = await aiReviewer.reviewSecurity(file);

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Performance-focused review
router.post(
  '/review/performance',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const file = {
      path: filePath,
      content: fileContent,
      language: language || 'typescript',
      size: Buffer.byteLength(fileContent, 'utf8'),
    };

    const result = await aiReviewer.reviewPerformance(file);

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Architecture review
router.post(
  '/review/architecture',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language, projectContext } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const file = {
      path: filePath,
      content: fileContent,
      language: language || 'typescript',
      size: Buffer.byteLength(fileContent, 'utf8'),
    };

    const result = await aiReviewer.reviewArchitecture(file, projectContext || {
      name: 'Unknown',
      language: language || 'typescript',
    });

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Get review history for a file
router.get(
  '/review/history/:filePath(*)',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { filePath } = req.params;
    const decodedPath = decodeURIComponent(filePath);

    const stats = aiReviewer.getReviewStats(decodedPath);

    if (!stats) {
      return res.json({
        success: true,
        data: { hasHistory: false },
        meta: { timestamp: new Date() },
      });
    }

    res.json({
      success: true,
      data: {
        hasHistory: true,
        stats,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Get personalized learning resources
router.post(
  '/review/learning/:filePath(*)',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const { filePath } = req.params;
    const decodedPath = decodeURIComponent(filePath);
    const { developerLevel, areasForGrowth } = req.body;

    const resources = await aiReviewer.getPersonalizedLearning(decodedPath, {
      developerLevel: developerLevel || 'mid',
      areasForGrowth: areasForGrowth || [],
    });

    res.json({
      success: true,
      data: resources,
      meta: { timestamp: new Date() },
    });
  })
);

// Compare with best practices
router.post(
  '/review/best-practices',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language, pattern } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'pattern is required',
      });
    }

    const file = {
      path: filePath,
      content: fileContent,
      language: language || 'typescript',
      size: Buffer.byteLength(fileContent, 'utf8'),
    };

    const result = await aiReviewer.compareWithBestPractices(file, pattern);

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate inline comments
router.post(
  '/review/inline-comments',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const file = {
      path: filePath,
      content: fileContent,
      language: language || 'typescript',
      size: Buffer.byteLength(fileContent, 'utf8'),
    };

    const comments = await aiReviewer.generateInlineComments(file);

    res.json({
      success: true,
      data: { comments },
      meta: { timestamp: new Date() },
    });
  })
);

// Clear review history
router.delete(
  '/review/history',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { filePath, clearAll } = req.body;

    if (clearAll) {
      aiReviewer.clearAllHistory();
    } else if (filePath) {
      aiReviewer.clearHistory(filePath);
    }

    res.json({
      success: true,
      data: { message: 'History cleared' },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as aiReviewerRoutes };
