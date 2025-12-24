import { Router, Request, Response } from 'express';
import { documentationService } from '../../services/ai/documentationService';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Generate full project documentation
 * POST /api/documentation/generate
 */
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  const { projectName, description, techStack, architecture, files, language } = req.body;

  if (!projectName || !description || !techStack || !files) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectName, description, techStack, files',
    });
  }

  logger.info('Generating documentation', { projectName });

  const result = await documentationService.generateDocumentation({
    projectName,
    description,
    techStack,
    architecture: architecture || {},
    files,
    language,
  });

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * Generate README only
 * POST /api/documentation/readme
 */
router.post('/readme', asyncHandler(async (req: Request, res: Response) => {
  const { projectName, description, techStack, files } = req.body;

  if (!projectName || !description || !techStack) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectName, description, techStack',
    });
  }

  const fileContents = files
    .filter((f: any) => f.type === 'FILE')
    .slice(0, 20)
    .map((f: any) => {
      const depth = f.path.split('/').length;
      const indent = '  '.repeat(depth - 1);
      return `${indent}📄 ${f.path}`;
    })
    .join('\n');

  const readme = await documentationService.generateReadme(
    { projectName, description, techStack, architecture: {}, files, language: 'en' },
    fileContents
  );

  res.json({
    success: true,
    data: { readme },
  });
}));

/**
 * Generate API documentation
 * POST /api/documentation/api-docs
 */
router.post('/api-docs', asyncHandler(async (req: Request, res: Response) => {
  const { files } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: files',
    });
  }

  const apiDocs = await documentationService.generateAPIDocs(files);

  if (!apiDocs) {
    return res.json({
      success: true,
      data: { apiDocs: null, message: 'No API endpoints detected in the provided files' },
    });
  }

  // Also generate OpenAPI spec
  const openApiSpec = documentationService.generateOpenAPISpec(apiDocs);

  res.json({
    success: true,
    data: { apiDocs, openApiSpec },
  });
}));

/**
 * Update documentation on code changes
 * POST /api/documentation/update
 */
router.post('/update', asyncHandler(async (req: Request, res: Response) => {
  const { projectId, changedFiles, currentReadme } = req.body;

  if (!projectId || !changedFiles || !currentReadme) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectId, changedFiles, currentReadme',
    });
  }

  const { updatedReadme, changes } = await documentationService.updateDocumentationOnChange(
    projectId,
    changedFiles,
    currentReadme
  );

  res.json({
    success: true,
    data: {
      readme: updatedReadme,
      changes,
      hasChanges: changes.length > 0,
    },
  });
}));

/**
 * Generate changelog
 * POST /api/documentation/changelog
 */
router.post('/changelog', asyncHandler(async (req: Request, res: Response) => {
  const { projectName, changes } = req.body;

  if (!projectName || !changes || !Array.isArray(changes)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectName, changes (array)',
    });
  }

  const changelog = await documentationService.generateChangelog(projectName, changes);

  res.json({
    success: true,
    data: { changelog },
  });
}));

/**
 * Generate contribution guide
 * POST /api/documentation/contribution-guide
 */
router.post('/contribution-guide', asyncHandler(async (req: Request, res: Response) => {
  const { projectName, techStack } = req.body;

  if (!projectName || !techStack) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectName, techStack',
    });
  }

  const guide = await documentationService.generateContributionGuide(projectName, techStack);

  res.json({
    success: true,
    data: { guide },
  });
}));

/**
 * Generate architecture documentation
 * POST /api/documentation/architecture
 */
router.post('/architecture', asyncHandler(async (req: Request, res: Response) => {
  const { projectName, description, techStack, architecture } = req.body;

  if (!projectName || !description || !techStack) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: projectName, description, techStack',
    });
  }

  const docs = await documentationService.generateArchitectureDocs({
    projectName,
    description,
    techStack,
    architecture: architecture || {},
    files: [],
  });

  res.json({
    success: true,
    data: { architectureDocs: docs },
  });
}));

export default router;
