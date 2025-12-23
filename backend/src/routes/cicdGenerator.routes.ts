import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { cicdGenerator } from '../services/ai/cicdGenerator';

const router = Router();

// Get available pipeline templates
router.get(
  '/templates',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const templates = cicdGenerator.getAvailableTemplates();

    res.json({
      success: true,
      data: { templates },
      meta: { timestamp: new Date() },
    });
  })
);

// Generate CI/CD pipeline
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const config = req.body;

    if (!config.platform || !config.language || !config.projectType) {
      return res.status(400).json({
        success: false,
        error: 'platform, language, and projectType are required',
      });
    }

    const pipelines = await cicdGenerator.generatePipeline(config);

    res.json({
      success: true,
      data: {
        pipelines,
        count: pipelines.length,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Generate GitHub Actions workflow
router.post(
  '/github',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const config = { ...req.body, platform: 'github' as const };

    if (!config.language || !config.projectType) {
      return res.status(400).json({
        success: false,
        error: 'language and projectType are required',
      });
    }

    const pipeline = await cicdGenerator.generateGitHubActions(config);

    res.json({
      success: true,
      data: pipeline,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate GitLab CI configuration
router.post(
  '/gitlab',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const config = { ...req.body, platform: 'gitlab' as const };

    const pipeline = await cicdGenerator.generateGitLabCI(config);

    res.json({
      success: true,
      data: pipeline,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate Jenkinsfile
router.post(
  '/jenkins',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const config = { ...req.body, platform: 'jenkins' as const };

    const pipeline = await cicdGenerator.generateJenkinsfile(config);

    res.json({
      success: true,
      data: pipeline,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate Docker Compose configuration
router.post(
  '/docker-compose',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { config, services } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'config is required',
      });
    }

    const composeContent = await cicdGenerator.generateDockerCompose(
      config,
      services || []
    );

    res.json({
      success: true,
      data: {
        filename: 'docker-compose.yml',
        content: composeContent,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Generate Kubernetes manifests
router.post(
  '/kubernetes',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { provider, environment, config } = req.body;

    if (!provider || !environment || !config) {
      return res.status(400).json({
        success: false,
        error: 'provider, environment, and config are required',
      });
    }

    const manifests = await cicdGenerator.generateKubernetesManifests({
      provider,
      environment,
      config,
    });

    res.json({
      success: true,
      data: manifests,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate deployment workflow
router.post(
  '/deployment-workflow',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { provider, environment, region, secrets, environmentUrl } = req.body;

    if (!provider || !environment) {
      return res.status(400).json({
        success: false,
        error: 'provider and environment are required',
      });
    }

    const workflow = await cicdGenerator.generateDeploymentWorkflow(provider, {
      environment,
      region,
      secrets,
      environmentUrl,
    });

    res.json({
      success: true,
      data: {
        filename: `deploy-${environment}.yml`,
        content: workflow,
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Generate testing pipeline
router.post(
  '/testing',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const config = req.body;

    if (!config.language || !config.projectType) {
      return res.status(400).json({
        success: false,
        error: 'language and projectType are required',
      });
    }

    const pipeline = await cicdGenerator.generateTestingPipeline(config);

    res.json({
      success: true,
      data: pipeline,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate security scanning pipeline
router.post(
  '/security',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const config = req.body;

    const pipeline = await cicdGenerator.generateSecurityScanningPipeline(config);

    res.json({
      success: true,
      data: pipeline,
      meta: { timestamp: new Date() },
    });
  })
);

// Suggest deployment strategy
router.post(
  '/deployment-strategy',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectType, traffic, tolerance } = req.body;

    if (!projectType || !traffic || !tolerance) {
      return res.status(400).json({
        success: false,
        error: 'projectType, traffic, and tolerance are required',
      });
    }

    const strategy = await cicdGenerator.suggestDeploymentStrategy(
      projectType,
      traffic,
      tolerance
    );

    res.json({
      success: true,
      data: strategy,
      meta: { timestamp: new Date() },
    });
  })
);

// Validate existing pipeline
router.post(
  '/validate',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { content, platform } = req.body;

    if (!content || !platform) {
      return res.status(400).json({
        success: false,
        error: 'content and platform are required',
      });
    }

    const validation = await cicdGenerator.validatePipeline(content, platform);

    res.json({
      success: true,
      data: validation,
      meta: { timestamp: new Date() },
    });
  })
);

// Optimize existing pipeline
router.post(
  '/optimize',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { content, platform } = req.body;

    if (!content || !platform) {
      return res.status(400).json({
        success: false,
        error: 'content and platform are required',
      });
    }

    const optimization = await cicdGenerator.optimizePipeline(content, platform);

    res.json({
      success: true,
      data: optimization,
      meta: { timestamp: new Date() },
    });
  })
);

// Generate multi-environment configuration
router.post(
  '/environments',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { baseConfig, environments } = req.body;

    if (!baseConfig || !environments || !Array.isArray(environments)) {
      return res.status(400).json({
        success: false,
        error: 'baseConfig and environments array are required',
      });
    }

    const pipelines = await cicdGenerator.generateEnvironmentConfig(
      baseConfig,
      environments
    );

    const pipelinesArray = Array.from(pipelines.entries()).map(([env, pipeline]) => ({
      environment: env,
      ...pipeline,
    }));

    res.json({
      success: true,
      data: {
        pipelines: pipelinesArray,
        count: pipelinesArray.length,
      },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as cicdGeneratorRoutes };
