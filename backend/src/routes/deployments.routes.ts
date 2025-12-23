import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { deploymentService, DeploymentConfig, CloudProvider } from "../services/deploymentService";

const router = Router();

/**
 * @route POST /api/v1/deployments
 * @desc Create a new deployment
 * @access Private
 */
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      projectName,
      image,
      tag,
      ports,
      environment,
      volumes,
      healthCheck,
      resources,
      cloudProvider,
      cloudConfig,
    } = req.body;

    if (!projectId || !image) {
      return res.status(400).json({
        success: false,
        error: "projectId and image are required",
      });
    }

    const containerName = `vibe-${projectId}`;

    const config: DeploymentConfig = {
      projectId,
      projectName: projectName || projectId,
      containerName,
      image,
      tag: tag || "latest",
      ports: ports || [3000],
      environment: environment || {},
      volumes,
      healthCheck,
      resources,
      cloudProvider: cloudProvider as CloudProvider || "local",
      cloudConfig,
    };

    const deployment = await deploymentService.createDeployment(config);

    return res.json({
      success: true,
      data: { deployment },
    });
  } catch (error) {
    console.error("Error creating deployment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/v1/deployments/:id
 * @desc Get deployment by ID
 * @access Private
 */
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deployment = deploymentService.getDeployment(id);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: "Deployment not found",
      });
    }

    return res.json({
      success: true,
      data: { deployment },
    });
  } catch (error) {
    console.error("Error getting deployment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/v1/deployments/project/:projectId
 * @desc Get deployments for a project
 * @access Private
 */
router.get(
  "/project/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const deployments = deploymentService.getProjectDeployments(projectId);

      return res.json({
        success: true,
        data: { deployments },
      });
    } catch (error) {
      console.error("Error getting project deployments:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route GET /api/v1/deployments/project/:projectId/current
 * @desc Get current (latest) deployment for a project
 * @access Private
 */
router.get(
  "/project/:projectId/current",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const deployment = deploymentService.getCurrentDeployment(projectId);

      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: "No deployment found for this project",
        });
      }

      return res.json({
        success: true,
        data: { deployment },
      });
    } catch (error) {
      console.error("Error getting current deployment:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/deployments/:id/stop
 * @desc Stop a deployment
 * @access Private
 */
router.post("/:id/stop", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deploymentService.stopDeployment(id);

    return res.json({
      success: true,
      message: "Deployment stopped successfully",
    });
  } catch (error) {
    console.error("Error stopping deployment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route POST /api/v1/deployments/:id/rollback
 * @desc Rollback a deployment
 * @access Private
 */
router.post("/:id/rollback", authenticate, async (req: Request, res: Response) => {
  try {
    const deployment = deploymentService.getDeployment(req.params.id);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: "Deployment not found",
      });
    }

    const previousDeployment = await deploymentService.rollbackDeployment(
      deployment.projectId
    );

    return res.json({
      success: true,
      data: { deployment: previousDeployment },
      message: "Rollback initiated",
    });
  } catch (error) {
    console.error("Error rolling back deployment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/v1/deployments/:id/logs
 * @desc Stream deployment logs (SSE)
 * @access Private
 */
router.get("/:id/logs", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deployment = deploymentService.getDeployment(id);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: "Deployment not found",
      });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    // Stream logs
    const unsubscribe = await deploymentService.streamLogs(id, (log) => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    });

    // Handle client disconnect
    req.on("close", () => {
      unsubscribe();
      res.end();
    });
  } catch (error) {
    console.error("Error streaming logs:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/v1/deployments/stats
 * @desc Get deployment statistics
 * @access Private
 */
router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await deploymentService.getStats();

    return res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Error getting deployment stats:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route POST /api/v1/deployments/cleanup/:projectId
 * @desc Clean up old deployments
 * @access Private
 */
router.post(
  "/cleanup/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { keepCount } = req.body;

      await deploymentService.cleanupOldDeployments(projectId, keepCount || 5);

      return res.json({
        success: true,
        message: "Old deployments cleaned up successfully",
      });
    } catch (error) {
      console.error("Error cleaning up deployments:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route GET /api/v1/deployments/health
 * @desc Check deployment service health
 * @access Public
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const isDockerAvailable = deploymentService.isDockerAvailable();
    const isNetworkOk = await deploymentService.checkNetwork();

    return res.json({
      success: true,
      data: {
        status: isDockerAvailable ? "healthy" : "degraded",
        docker: isDockerAvailable ? "connected" : "unavailable",
        network: isNetworkOk ? "ok" : "issue",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
