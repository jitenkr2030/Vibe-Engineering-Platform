import { Router, Request, Response } from "express";
import { testRunnerService } from "../services/TestRunnerService";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @route POST /api/v1/tests/run
 * @desc Run tests for a project
 * @access Private
 */
router.post("/run", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectPath, testCommand, testPath, coverage, environment } = req.body;

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        error: "projectPath is required",
      });
    }

    let result;

    if (coverage) {
      result = await testRunnerService.runTestsWithCoverage({
        projectPath,
        testCommand,
        environment,
      });
    } else if (testPath) {
      result = await testRunnerService.runSpecificTest(projectPath, testPath);
    } else {
      result = await testRunnerService.runTests({
        projectPath,
        testCommand,
        environment,
      });
    }

    return res.json({
      success: result.success,
      data: {
        exitCode: result.exitCode,
        duration: result.duration,
        stdout: result.stdout,
        stderr: result.stderr,
        testResults: result.testResults,
      },
    });
  } catch (error) {
    console.error("Error running tests:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route POST /api/v1/tests/config
 * @desc Detect test configuration for a project
 * @access Private
 */
router.post("/config", authenticate, async (req: Request, res: Response) => {
  try {
    const { projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        error: "projectPath is required",
      });
    }

    const config = await testRunnerService.detectTestConfig(projectPath);

    return res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error detecting test config:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/v1/tests/coverage/:projectId
 * @desc Get coverage report for a project
 * @access Private
 */
router.get(
  "/coverage/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectPath } = req.body;
      const { projectId } = req.params;

      if (!projectPath) {
        return res.status(400).json({
          success: false,
          error: "projectPath is required",
        });
      }

      const coverage = await testRunnerService.getCoverageReport(projectPath);

      return res.json({
        success: true,
        data: coverage,
      });
    } catch (error) {
      console.error("Error getting coverage:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/tests/npm-audit
 * @desc Run npm audit on a Node.js project
 * @access Private
 */
router.post(
  "/npm-audit",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectPath } = req.body;

      if (!projectPath) {
        return res.status(400).json({
          success: false,
          error: "projectPath is required",
        });
      }

      const auditResult = await testRunnerService.runNpmAudit?.(projectPath);

      return res.json({
        success: true,
        data: auditResult,
      });
    } catch (error) {
      console.error("Error running npm audit:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
