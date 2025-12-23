import * as fs from "fs/promises";
import * as path from "path";

export interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  description: string;
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  codeSnippet?: string;
  fix?: string;
  references?: string[];
  cwe?: string;
  owasp?: string;
}

export interface SecurityReport {
  fileId: string;
  filePath: string;
  language: string;
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  scanDuration: number;
  timestamp: Date;
}

export interface SecurityScanOptions {
  projectPath?: string;
  fileContent?: string;
  language: string;
  filePath?: string;
  rules?: string[];
  severity?: ("critical" | "high" | "medium" | "low" | "info")[];
}

interface SecurityRule {
  id: string;
  name: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  pattern: RegExp | string;
  message: string;
  cwe?: string;
  owasp?: string;
  fix?: string;
}

// Security rules for common vulnerabilities
const SECURITY_RULES: SecurityRule[] = [
  // Injection vulnerabilities
  {
    id: "SQL_INJECTION",
    name: "SQL Injection",
    category: "Injection",
    severity: "critical",
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP).*?['"].*?\$/i,
    message: "Potential SQL injection vulnerability detected. Use parameterized queries instead of string concatenation.",
    cwe: "CWE-89",
    owasp: "A03:2021 Injection",
  },
  {
    id: "NOSQL_INJECTION",
    name: "NoSQL Injection",
    category: "Injection",
    severity: "critical",
    pattern: /\$where.*?\(/i,
    message: "Potential NoSQL injection via $where operator. This allows arbitrary code execution.",
    cwe: "CWE-943",
    owasp: "A03:2021 Injection",
  },
  {
    id: "COMMAND_INJECTION",
    name: "Command Injection",
    category: "Injection",
    severity: "critical",
    pattern: /(?:exec|eval|execSync|spawn)\s*\(\s*[`"'].*?\$/i,
    message: "Potential command injection. Avoid using user input in command execution.",
    cwe: "CWE-78",
    owasp: "A03:2021 Injection",
  },
  {
    id: "XSS_REFLECTED",
    name: "Reflected Cross-Site Scripting",
    category: "Injection",
    severity: "high",
    pattern: /(?:innerHTML|outerHTML|dangerouslySetInnerHTML)\s*=.*?(?:req|query|params|body)/i,
    message: "Potential XSS vulnerability. Avoid setting innerHTML with user input. Use textContent or proper sanitization.",
    cwe: "CWE-79",
    owasp: "A03:2021 Injection",
  },
  {
    id: "XSS_DANGEROUSLY_SET_INNER_HTML",
    name: "Dangerous innerHTML Usage",
    category: "Injection",
    severity: "high",
    pattern: /dangerouslySetInnerHTML/i,
    message: "dangerouslySetInnerHTML can lead to XSS. Ensure content is properly sanitized with a library like DOMPurify.",
    cwe: "CWE-79",
    owasp: "A03:2021 Injection",
  },

  // Authentication and Authorization
  {
    id: "HARDCODED_SECRET",
    name: "Hardcoded Secret in Source Code",
    category: "Secrets",
    severity: "critical",
    pattern: /(?:api[_-]?key|apikey|secret|password|passwd|pwd|auth[_-]?token|bearer[_-]?token|access[_-]?token)['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i,
    message: "Hardcoded secret detected. Store secrets in environment variables or secure vault.",
    cwe: "CWE-798",
    owasp: "A07:2021 Identification and Authentication Failures",
  },
  {
    id: "JWT_NONE_ALGORITHM",
    name: "JWT with None Algorithm",
    category: "Authentication",
    severity: "critical",
    pattern: /alg.*?['"]?none['"]?/i,
    message: "JWT token with 'none' algorithm detected. Tokens with this algorithm are not signed and can be forged.",
    cwe: "CWE-347",
    owasp: "A07:2021 Identification and Authentication Failures",
  },
  {
    id: "WEAK_PASSWORD_HASH",
    name: "Weak Password Hashing",
    category: "Cryptography",
    severity: "high",
    pattern: /(?:md5|sha1)\s*\(/i,
    message: "Weak hashing algorithm detected. Use bcrypt, scrypt, or Argon2 for password hashing.",
    cwe: "CWE-328",
    owasp: "A02:2021 Cryptographic Failures",
  },
  {
    id: "EXPIRED_JWT",
    name: "JWT Without Expiration",
    category: "Authentication",
    severity: "medium",
    pattern: /expiresIn.*?(?:null|undefined|['"]?0['"]?)/i,
    message: "JWT token without expiration. Always set an appropriate expiration time for tokens.",
    cwe: "CWE-613",
    owasp: "A07:2021 Identification and Authentication Failures",
  },

  // Sensitive Data Exposure
  {
    id: "SENSITIVE_DATA_LOGGING",
    name: "Sensitive Data in Logs",
    category: "Sensitive Data",
    severity: "medium",
    pattern: /(?:console\.(?:log|info|warn|error)|logger\.(?:info|warn|error|debug)).*?(?:password|secret|token|key|credit|card|ssn|social[_-]?security)/i,
    message: "Potential sensitive data being logged. Avoid logging sensitive information.",
    cwe: "CWE-532",
    owasp: "A02:2021 Cryptographic Failures",
  },
  {
    id: "EXPOSED_DEBUG_INFO",
    name: "Debug Information Exposure",
    category: "Sensitive Data",
    severity: "medium",
    pattern: /(?:stack\s*\.?\s*trace|error\.(?:stack|message)|exception\.(?:stack|message))/i,
    message: "Error details may be exposed to users. Implement proper error handling that doesn't leak sensitive information.",
    cwe: "CWE-210",
    owasp: "A05:2021 Security Misconfiguration",
  },

  // Path Traversal
  {
    id: "PATH_TRAVERSAL",
    name: "Path Traversal",
    category: "File System",
    severity: "high",
    pattern: /(?:fs\.(?:readFile|writeFile|readFileSync|writeFileSync|unlink|unlinkSync|rename|renameSync)\s*\([^)]*?(?:path\.join|path\.resolve).*?\.\.\.)/i,
    message: "Potential path traversal vulnerability. Validate and sanitize file paths.",
    cwe: "CWE-22",
    owasp: "A01:2021 Broken Access Control",
  },
  {
    id: "EXPRESS_STATIC_SERVE",
    name: "Express Static Serve from Root",
    category: "File System",
    severity: "medium",
    pattern: /express\s*\(\s*\)\s*\.use\s*\(\s*['"]\/['"]\s*,\s*serveStatic\s*\(/i,
    message: "Serving static files from root path may expose sensitive files. Consider serving from a specific directory.",
    cwe: "CWE-22",
    owasp: "A01:2021 Broken Access Control",
  },

  // Security Misconfiguration
  {
    id: "CORS_INSECURE",
    name: "Insecure CORS Configuration",
    category: "Configuration",
    severity: "medium",
    pattern: /\.use\s*\(\s*cors\s*\([^)]*origin\s*:\s*['"\*]['"]/i,
    message: "CORS configuration allows all origins. Restrict to specific trusted domains.",
    cwe: "CWE-346",
    owasp: "A05:2021 Security Misconfiguration",
  },
  {
    id: "HELMET_MISSING",
    name: "Missing Security Headers",
    category: "Configuration",
    severity: "low",
    pattern: /express\s*\(\s*\)(?![\s\S]*helmet)/i,
    message: "Consider using helmet middleware to set security-related HTTP headers.",
    cwe: "CWE-693",
    owasp: "A05:2021 Security Misconfiguration",
  },
  {
    id: "RATE_LIMITING_MISSING",
    name: "Missing Rate Limiting",
    category: "Configuration",
    severity: "medium",
    pattern: /express\s*\(\s*\)(?![\s\S]*rate\s*limit)/i,
    message: "Rate limiting is not implemented. Consider adding rate limiting to prevent brute force attacks.",
    cwe: "CWE-307",
    owasp: "A07:2021 Identification and Authentication Failures",
  },

  // Dependencies
  {
    id: "INSECURE_DEPENDENCY",
    name: "Potentially Insecure Dependency",
    category: "Dependencies",
    severity: "medium",
    pattern: /require\s*\(\s*['"](?:lodash\.(?:4\.17\.[0-9]|3\.[0-9]+)|moment(?!\/[0-9])|underscore)/i,
    message: "Older version of a library with known vulnerabilities. Consider upgrading to a safer version.",
    cwe: "CWE-1104",
    owasp: "A06:2021 Vulnerable and Outdated Components",
  },

  // Input Validation
  {
    id: "MISSING_INPUT_VALIDATION",
    name: "Missing Input Validation",
    category: "Input Validation",
    severity: "high",
    pattern: /(?:req\.(?:body|query|params)\s*(?!\s*(?:sanitize|validate|check|is)))/
  },

  // Deserialization
  {
    id: "UNSAFE_DESERIALIZATION",
    name: "Unsafe Deserialization",
    category: "Deserialization",
    severity: "critical",
    pattern: /(?:eval\s*\(\s*JSON\.parse|new\s+Function\s*\([^)]*JSON\.parse|YAML\.load\s*\()/i,
    message: "Unsafe deserialization can lead to code execution. Validate and sanitize input before deserialization.",
    cwe: "CWE-502",
    owasp: "A08:2021 Software and Data Integrity Failures",
  },
];

export class SecurityService {
  private rules: SecurityRule[] = SECURITY_RULES;

  /**
   * Scan code for security vulnerabilities
   */
  async scan(options: SecurityScanOptions): Promise<SecurityReport> {
    const startTime = Date.now();
    const issues: SecurityIssue[] = [];

    const {
      projectPath,
      fileContent,
      language,
      filePath = "unknown",
      rules,
      severity,
    } = options;

    if (!projectPath && !fileContent) {
      throw new Error("Either projectPath or fileContent must be provided");
    }

    // Filter rules based on options
    const activeRules = this.rules.filter((rule) => {
      if (rules && rules.length > 0 && !rules.includes(rule.id)) {
        return false;
      }
      if (
        severity &&
        severity.length > 0 &&
        !severity.includes(rule.severity)
      ) {
        return false;
      }
      return true;
    });

    if (projectPath) {
      // Scan entire project
      const files = await this.getFilesToScan(projectPath, language);
      for (const file of files) {
        const content = await fs.readFile(file, "utf-8");
        const fileIssues = this.scanContent(
          content,
          language,
          file,
          activeRules
        );
        issues.push(...fileIssues);
      }
    } else if (fileContent) {
      // Scan single file content
      const fileIssues = this.scanContent(
        fileContent,
        language,
        filePath,
        activeRules
      );
      issues.push(...fileIssues);
    }

    const scanDuration = Date.now() - startTime;

    // Generate summary
    const summary = {
      critical: issues.filter((i) => i.severity === "critical").length,
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
      info: issues.filter((i) => i.severity === "info").length,
    };

    return {
      fileId: this.generateId(),
      filePath,
      language,
      issues,
      summary,
      scanDuration,
      timestamp: new Date(),
    };
  }

  /**
   * Scan content for security issues
   */
  private scanContent(
    content: string,
    language: string,
    filePath: string,
    rules: SecurityRule[]
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = content.split("\n");

    for (const rule of rules) {
      const pattern =
        typeof rule.pattern === "string"
          ? new RegExp(rule.pattern, "gim")
          : new RegExp(rule.pattern.source, rule.pattern.flags);

      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1] || "";
        const column = lineContent.indexOf(match[0]);

        issues.push({
          id: `${rule.id}-${issues.length + 1}`,
          severity: rule.severity,
          category: rule.category,
          title: rule.name,
          description: rule.message,
          file: filePath,
          line: lineNumber,
          column: column + 1,
          endLine: lineNumber,
          endColumn: column + match[0].length,
          codeSnippet: lineContent.trim(),
          fix: rule.fix,
          cwe: rule.cwe,
          owasp: rule.owasp,
          references: this.getReferences(rule.cwe, rule.owasp),
        });
      }
    }

    return issues;
  }

  /**
   * Get files to scan in a project
   */
  private async getFilesToScan(
    projectPath: string,
    language: string
  ): Promise<string[]> {
    const extensions = this.getLanguageExtensions(language);
    const files: string[] = [];

    const scanDirectory = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip common non-source directories
          if (
            entry.isDirectory() &&
            !["node_modules", ".git", "dist", "build", "coverage"].includes(
              entry.name
            )
          ) {
            await scanDirectory(fullPath);
          } else if (
            entry.isFile() &&
            extensions.some((ext) => entry.name.endsWith(ext))
          ) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory might not be accessible
      }
    };

    await scanDirectory(projectPath);
    return files;
  }

  /**
   * Get file extensions for a programming language
   */
  private getLanguageExtensions(language: string): string[] {
    const languageMap: Record<string, string[]> = {
      typescript: [".ts", ".tsx"],
      javascript: [".js", ".jsx"],
      python: [".py"],
      java: [".java"],
      go: [".go"],
      rust: [".rs"],
      c: [".c", ".h"],
      cpp: [".cpp", ".cc", ".cxx", ".hpp"],
      ruby: [".rb"],
      php: [".php"],
      csharp: [".cs"],
      kotlin: [".kt", ".kts"],
    };

    return languageMap[language.toLowerCase()] || [".txt"];
  }

  /**
   * Get line number from content index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get references for security issues
   */
  private getReferences(cwe?: string, owasp?: string): string[] {
    const references: string[] = [];

    if (cwe) {
      references.push(`https://cwe.mitre.org/data/definitions/${cwe.replace("CWE-", "")}.html`);
    }
    if (owasp) {
      references.push(`https://owasp.org/www-project-top-ten/${owasp.split(":")[0]}`);
    }

    return references;
  }

  /**
   * Run npm audit for Node.js projects
   */
  async runNpmAudit(projectPath: string): Promise<{
    vulnerabilities: SecurityIssue[];
    summary: { critical: number; high: number; medium: number; low: number };
  }> {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      const { stdout } = await execAsync("npm audit --json", {
        cwd: projectPath,
        maxBuffer: 10 * 1024 * 1024,
      });

      const auditResult = JSON.parse(stdout);
      const vulnerabilities: SecurityIssue[] = [];

      const processAdvisory = (advisory: any) => {
        const severity = this.mapNpmSeverity(advisory.severity);

        vulnerabilities.push({
          id: `NPM-${advisory.id}`,
          severity,
          category: "Dependency",
          title: advisory.title,
          description: advisory.overview,
          file: "package.json",
          fix: advisory.recommendation,
          references: advisory.references?.split("\n") || [],
          cwe: advisory.cwe?.[0],
        });
      };

      if (auditResult.advisories) {
        Object.values(auditResult.advisories).forEach(processAdvisory);
      }

      return {
        vulnerabilities,
        summary: {
          critical: vulnerabilities.filter((v) => v.severity === "critical")
            .length,
          high: vulnerabilities.filter((v) => v.severity === "high").length,
          medium: vulnerabilities.filter((v) => v.severity === "medium").length,
          low: vulnerabilities.filter((v) => v.severity === "low").length,
        },
      };
    } catch (error) {
      return {
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0 },
      };
    }
  }

  /**
   * Map npm severity to our severity levels
   */
  private mapNpmSeverity(
    npmSeverity: string
  ): "critical" | "high" | "medium" | "low" | "info" {
    const severityMap: Record<string, "critical" | "high" | "medium" | "low" | "info"> = {
      critical: "critical",
      high: "high",
      moderate: "medium",
      low: "low",
      info: "info",
    };

    return severityMap[npmSeverity] || "medium";
  }

  /**
   * Get security recommendations based on issues found
   */
  getRecommendations(report: SecurityReport): string[] {
    const recommendations: string[] = [];

    if (report.summary.critical > 0) {
      recommendations.push(
        "URGENT: Address all critical severity issues immediately. These vulnerabilities could lead to complete system compromise."
      );
    }

    if (report.summary.high > 0) {
      recommendations.push(
        "Address high severity issues in the next sprint. These vulnerabilities significantly impact security."
      );
    }

    const hasInjectionIssues = report.issues.some(
      (i) => i.category === "Injection"
    );
    if (hasInjectionIssues) {
      recommendations.push(
        "Consider implementing input validation and output encoding across all user inputs."
      );
    }

    const hasSecretsIssues = report.issues.some(
      (i) => i.category === "Secrets"
    );
    if (hasSecretsIssues) {
      recommendations.push(
        "Rotate any exposed secrets and implement a secrets management solution (e.g., HashiCorp Vault, AWS Secrets Manager)."
      );
    }

    const hasDependencyIssues = report.issues.some(
      (i) => i.category === "Dependencies"
    );
    if (hasDependencyIssues) {
      recommendations.push(
        "Update dependencies to their latest secure versions and implement automated dependency scanning."
      );
    }

    return recommendations;
  }
}

export const securityService = new SecurityService();
