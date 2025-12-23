import { Router, Request, Response } from "express";
import { securityService } from "../services/SecurityService";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @route POST /api/v1/security/scan
 * @desc Scan code for security vulnerabilities
 * @access Private
 */
router.post("/scan", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      projectPath,
      fileContent,
      language,
      filePath,
      rules,
      severity,
    } = req.body;

    if (!projectPath && !fileContent) {
      return res.status(400).json({
        success: false,
        error: "Either projectPath or fileContent must be provided",
      });
    }

    const report = await securityService.scan({
      projectPath,
      fileContent,
      language: language || "typescript",
      filePath,
      rules,
      severity,
    });

    return res.json({
      success: true,
      data: {
        report,
        recommendations: securityService.getRecommendations(report),
      },
    });
  } catch (error) {
    console.error("Error scanning for security issues:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route POST /api/v1/security/scan/file
 * @desc Scan a single file for security vulnerabilities
 * @access Private
 */
router.post(
  "/scan/file",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { fileContent, language, filePath } = req.body;

      if (!fileContent) {
        return res.status(400).json({
          success: false,
          error: "fileContent is required",
        });
      }

      const report = await securityService.scan({
        fileContent,
        language: language || "typescript",
        filePath: filePath || "unknown",
      });

      return res.json({
        success: true,
        data: {
          report,
          recommendations: securityService.getRecommendations(report),
        },
      });
    } catch (error) {
      console.error("Error scanning file:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/security/npm-audit
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

      const auditResult = await securityService.runNpmAudit(projectPath);

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

/**
 * @route POST /api/v1/security/scan/diff
 * @desc Scan git diff for security issues
 * @access Private
 */
router.post(
  "/scan/diff",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { diffContent, language } = req.body;

      if (!diffContent) {
        return res.status(400).json({
          success: false,
          error: "diffContent is required",
        });
      }

      // Parse diff to extract added and removed lines
      const addedLines = diffContent
        .split("\n")
        .filter((line: string) => line.startsWith("+") && !line.startsWith("+++"))
        .map((line: string) => line.substring(1));

      const removedLines = diffContent
        .split("\n")
        .filter((line: string) => line.startsWith("-") && !line.startsWith("---"))
        .map((line: string) => line.substring(1));

      // Scan the added lines (most critical for security)
      const report = await securityService.scan({
        fileContent: addedLines.join("\n"),
        language: language || "typescript",
        filePath: "git-diff",
        severity: ["critical", "high", "medium"],
      });

      // Add context about removed lines
      const issuesWithContext = report.issues.map((issue) => ({
        ...issue,
        context:
          issue.severity === "critical" || issue.severity === "high"
            ? "This issue was introduced in the recent changes"
            : "This issue was detected in the changes",
      }));

      return res.json({
        success: true,
        data: {
          report: {
            ...report,
            issues: issuesWithContext,
          },
          recommendations: securityService.getRecommendations(report),
        },
      });
    } catch (error) {
      console.error("Error scanning diff:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route GET /api/v1/security/rules
 * @desc Get list of available security rules
 * @access Private
 */
router.get("/rules", authenticate, async (_req: Request, res: Response) => {
  try {
    // This would typically come from the service
    const rules = [
      {
        id: "SQL_INJECTION",
        name: "SQL Injection",
        category: "Injection",
        severity: "critical",
        description: "Detects potential SQL injection vulnerabilities",
      },
      {
        id: "XSS_REFLECTED",
        name: "Reflected Cross-Site Scripting",
        category: "Injection",
        severity: "high",
        description: "Detects potential XSS vulnerabilities",
      },
      {
        id: "HARDCODED_SECRET",
        name: "Hardcoded Secret",
        category: "Secrets",
        severity: "critical",
        description: "Detects hardcoded secrets in source code",
      },
      {
        id: "JWT_NONE_ALGORITHM",
        name: "JWT with None Algorithm",
        category: "Authentication",
        severity: "critical",
        description: "Detects JWT tokens using the insecure 'none' algorithm",
      },
      {
        id: "PATH_TRAVERSAL",
        name: "Path Traversal",
        category: "File System",
        severity: "high",
        description: "Detects potential path traversal vulnerabilities",
      },
      {
        id: "COMMAND_INJECTION",
        name: "Command Injection",
        category: "Injection",
        severity: "critical",
        description: "Detects potential command injection vulnerabilities",
      },
      {
        id: "NOSQL_INJECTION",
        name: "NoSQL Injection",
        category: "Injection",
        severity: "critical",
        description: "Detects potential NoSQL injection vulnerabilities",
      },
      {
        id: "WEAK_PASSWORD_HASH",
        name: "Weak Password Hashing",
        category: "Cryptography",
        severity: "high",
        description: "Detects use of weak hashing algorithms",
      },
      {
        id: "UNSAFE_DESERIALIZATION",
        name: "Unsafe Deserialization",
        category: "Deserialization",
        severity: "critical",
        description: "Detects unsafe deserialization patterns",
      },
      {
        id: "SENSITIVE_DATA_LOGGING",
        name: "Sensitive Data in Logs",
        category: "Sensitive Data",
        severity: "medium",
        description: "Detects potential sensitive data being logged",
      },
    ];

    return res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error("Error getting security rules:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
