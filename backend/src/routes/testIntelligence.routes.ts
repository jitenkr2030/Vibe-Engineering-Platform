import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { testIntelligence } from '../services/ai/testIntelligence';
import { prisma } from '../config/database';

const router = Router();

// Generate unit tests
router.post(
  '/unit',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language, testFramework, coverageGoal } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const result = await testIntelligence.generateUnitTests(
      fileContent,
      filePath,
      language,
      testFramework,
      coverageGoal
    );

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate integration tests
router.post(
  '/integration',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContents, filePaths, language, testFramework, endpoints } = req.body;

    if (!fileContents || !filePaths) {
      return res.status(400).json({
        success: false,
        error: 'fileContents and filePaths are required',
      });
    }

    const result = await testIntelligence.generateIntegrationTests(
      fileContents,
      filePaths,
      language,
      testFramework,
      endpoints
    );

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate E2E tests
router.post(
  '/e2e',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectType, pages, userFlows, testFramework } = req.body;

    if (!projectType || !pages || !userFlows) {
      return res.status(400).json({
        success: false,
        error: 'projectType, pages, and userFlows are required',
      });
    }

    const result = await testIntelligence.generateE2ETests(
      projectType,
      pages,
      userFlows,
      testFramework
    );

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate all tests for a project
router.post(
  '/project/:projectId',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId } = req.params;
    const { testFramework, coverageGoal, testTypes } = req.body;

    // Get project files
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    const fileContents = projectFiles.map((f) => ({
      path: f.path,
      content: f.content || '',
      language: f.language || project?.language || 'typescript',
    }));

    const result = await testIntelligence.generateAllTests(
      fileContents,
      project?.language || 'typescript',
      testFramework,
      coverageGoal,
      testTypes || ['unit', 'integration']
    );

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Detect edge cases
router.post(
  '/edge-cases',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const edgeCases = await testIntelligence.detectEdgeCases(
      fileContent,
      filePath,
      language
    );

    res.json({
      success: true,
      data: { edgeCases },
      meta: { timestamp: new Date() },
    });
  })
);

// Explain test coverage
router.post(
  '/explain-coverage',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, coverageReport, language } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const explanation = await testIntelligence.explainCoverageGaps(
      fileContent,
      filePath,
      coverageReport,
      language
    );

    res.json({
      success: true,
      data: { explanation },
      meta: { timestamp: new Date() },
    });
  })
);

// Get mock data
router.post(
  '/mock-data',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { schema, count, format } = req.body;

    if (!schema) {
      return res.status(400).json({
        success: false,
        error: 'schema is required',
      });
    }

    const mockData = await testIntelligence.generateMockData(
      schema,
      count || 10,
      format || 'json'
    );

    res.json({
      success: true,
      data: { mockData },
      meta: { timestamp: new Date() },
    });
  })
);

// Suggest test cases
router.post(
  '/suggestions',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { fileContent, filePath, language } = req.body;

    if (!fileContent || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'fileContent and filePath are required',
      });
    }

    const suggestions = await testIntelligence.suggestTestCases(
      fileContent,
      filePath,
      language
    );

    res.json({
      success: true,
      data: { suggestions },
      meta: { timestamp: new Date() },
    });
  })
);

// Get supported frameworks
router.get(
  '/frameworks',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const frameworks = testIntelligence.getSupportedFrameworks();

    res.json({
      success: true,
      data: { frameworks },
      meta: { timestamp: new Date() },
    });
  })
);

// Generate test documentation
router.post(
  '/documentation',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { testFiles, projectType, format } = req.body;

    if (!testFiles || !Array.isArray(testFiles)) {
      return res.status(400).json({
        success: false,
        error: 'testFiles array is required',
      });
    }

    const documentation = await testIntelligence.generateTestDocumentation(
      testFiles,
      projectType || 'general',
      format || 'markdown'
    );

    res.json({
      success: true,
      data: { documentation },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as testIntelligenceRoutes };
