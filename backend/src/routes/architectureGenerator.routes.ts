import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { architectureGenerator } from '../services/ai/architectureGenerator';
import { prisma } from '../config/database';

const router = Router();

// Generate project architecture
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { description, requirements, constraints, preferences } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Project description is required',
      });
    }

    const result = await architectureGenerator.generateArchitecture({
      description,
      requirements: requirements || [],
      constraints: constraints || [],
      preferences: preferences || {},
    });

    // Save generated architecture
    await prisma.architectureTemplate.create({
      data: {
        name: result.projectName,
        description: result.description,
        structure: result.structure as any,
        technologies: result.recommendedTechnologies as any,
        generatedFor: req.userId,
      },
    });

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate folder structure
router.post(
  '/structure',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectType, framework, language, projectName } = req.body;

    if (!projectType || !projectName) {
      return res.status(400).json({
        success: false,
        error: 'projectType and projectName are required',
      });
    }

    const structure = await architectureGenerator.generateFolderStructure(
      projectType,
      framework,
      language,
      projectName
    );

    res.json({
      success: true,
      data: structure,
      meta: { timestamp: new Date() },
    });
  })
);

// Get tech stack recommendations
router.post(
  '/technologies',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectType, requirements, constraints } = req.body;

    const recommendations = await architectureGenerator.getTechnologyRecommendations(
      projectType,
      requirements || [],
      constraints || []
    );

    res.json({
      success: true,
      data: recommendations,
      meta: { timestamp: new Date() },
    });
  })
);

// Validate architecture
router.post(
  '/validate',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { architecture, requirements, constraints } = req.body;

    if (!architecture) {
      return res.status(400).json({
        success: false,
        error: 'Architecture structure is required',
      });
    }

    const validation = await architectureGenerator.validateArchitecture(
      architecture,
      requirements || [],
      constraints || []
    );

    res.json({
      success: true,
      data: validation,
      meta: { timestamp: new Date() },
    });
  })
);

// Suggest improvements
router.post(
  '/improve',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { architecture, projectType, focus } = req.body;

    if (!architecture) {
      return res.status(400).json({
        success: false,
        error: 'Architecture structure is required',
      });
    }

    const suggestions = await architectureGenerator.suggestImprovements(
      architecture,
      projectType || 'general',
      focus || []
    );

    res.json({
      success: true,
      data: suggestions,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate patterns
router.post(
  '/patterns',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { patternType, projectType, language } = req.body;

    const patterns = await architectureGenerator.generateCodePatterns(
      patternType || 'all',
      projectType || 'general',
      language || 'typescript'
    );

    res.json({
      success: true,
      data: patterns,
      meta: { timestamp: new Date() },
    });
  })
);

// Get architecture patterns
router.get(
  '/patterns',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const patterns = architectureGenerator.getArchitecturePatterns();

    res.json({
      success: true,
      data: { patterns },
      meta: { timestamp: new Date() },
    });
  })
);

// Expand architecture
router.post(
  '/expand',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { architecture, depth, focusAreas } = req.body;

    if (!architecture) {
      return res.status(400).json({
        success: false,
        error: 'Architecture structure is required',
      });
    }

    const expanded = await architectureGenerator.expandArchitecture(
      architecture,
      depth || 2,
      focusAreas || []
    );

    res.json({
      success: true,
      data: expanded,
      meta: { timestamp: new Date() },
    });
  })
);

// Get templates
router.get(
  '/templates',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const templates = architectureGenerator.getArchitectureTemplates();

    res.json({
      success: true,
      data: { templates },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as architectureGeneratorRoutes };
