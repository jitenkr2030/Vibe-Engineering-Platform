import { spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const exec = promisify(require("child_process").exec);

export interface TestResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  testResults?: TestSuiteResult[];
}

export interface TestSuiteResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  tests: number;
  failures: number;
  errors: TestError[];
}

export interface TestError {
  name: string;
  message: string;
  stack?: string;
  line?: number;
}

export interface TestRunnerOptions {
  projectPath: string;
  testCommand?: string;
  testPattern?: string;
  timeout?: number;
  environment?: Record<string, string>;
}

export class TestRunnerService {
  private defaultCommands: Record<string, string> = {
    npm: "npm test",
    yarn: "yarn test",
    pnpm: "pnpm test",
    bun: "bun test",
    python: "python -m pytest",
    go: "go test ./...",
    rust: "cargo test",
    java: "mvn test",
  };

  private readonly maxBufferSize = 10 * 1024 * 1024; // 10MB

  /**
   * Detect the package manager and test framework for a project
   */
  async detectTestConfig(projectPath: string): Promise<{
    packageManager: string;
    testCommand: string;
    framework: string;
  }> {
    const packageJsonPath = path.join(projectPath, "package.json");
    const poetryPath = path.join(projectPath, "pyproject.toml");
    const cargoPath = path.join(projectPath, "Cargo.toml");
    const pomPath = path.join(projectPath, "pom.xml");
    const goPath = path.join(projectPath, "go.mod");

    // Check for Node.js project
    try {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8")
      );
      if (packageJson.scripts?.test) {
        return {
          packageManager: "npm",
          testCommand: "npm test",
          framework: "jest",
        };
      }
    } catch {
      // Not a Node.js project
    }

    // Check for Python project
    try {
      await fs.access(poetryPath);
      return {
        packageManager: "python",
        testCommand: "python -m pytest",
        framework: "pytest",
      };
    } catch {
      // Not a Python project
    }

    // Check for Go project
    try {
      await fs.access(goPath);
      return {
        packageManager: "go",
        testCommand: "go test ./...",
        framework: "testing",
      };
    } catch {
      // Not a Go project
    }

    // Check for Rust project
    try {
      await fs.access(cargoPath);
      return {
        packageManager: "rust",
        testCommand: "cargo test",
        framework: "cargo",
      };
    } catch {
      // Not a Rust project
    }

    // Check for Java project
    try {
      await fs.access(pomPath);
      return {
        packageManager: "java",
        testCommand: "mvn test",
        framework: "maven",
      };
    } catch {
      // Not a Java project
    }

    // Default to npm if package.json exists
    try {
      await fs.access(packageJsonPath);
      return {
        packageManager: "npm",
        testCommand: "npm test",
        framework: "unknown",
      };
    } catch {
      throw new Error("Unable to detect project type for test execution");
    }
  }

  /**
   * Run tests for a project
   */
  async runTests(options: TestRunnerOptions): Promise<TestResult> {
    const {
      projectPath,
      testCommand,
      timeout = 300000, // 5 minutes default timeout
      environment = {},
    } = options;

    const startTime = Date.now();
    let stdout = "";
    let stderr = "";

    try {
      // Check if project path exists
      try {
        await fs.access(projectPath);
      } catch {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }

      // Get the test command to run
      const command = testCommand || (await this.detectTestConfig(projectPath))
        .testCommand;

      // Set up environment variables
      const env = {
        ...process.env,
        ...environment,
        CI: "true",
        NODE_ENV: "test",
      };

      // Execute the test command
      const result = await this.executeCommand(command, projectPath, env, {
        timeout,
        maxBuffer: this.maxBufferSize,
      });

      const duration = Date.now() - startTime;

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration,
        testResults: this.parseTestResults(result.stdout, result.stderr),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof Error && error.name === "TimeoutError") {
        return {
          success: false,
          exitCode: -1,
          stdout,
          stderr: "Test execution timed out",
          duration,
        };
      }

      return {
        success: false,
        exitCode: -1,
        stdout,
        stderr: error instanceof Error ? error.message : "Unknown error",
        duration,
      };
    }
  }

  /**
   * Run a specific test file or test suite
   */
  async runSpecificTest(
    projectPath: string,
    testPath: string,
    additionalArgs?: string[]
  ): Promise<TestResult> {
    const { testCommand } = await this.detectTestConfig(projectPath);
    const args = testPath.split(" ").concat(additionalArgs || []);
    const command = `${testCommand} ${args.join(" ")}`;

    return this.runTests({
      projectPath,
      testCommand: command,
    });
  }

  /**
   * Run tests with coverage
   */
  async runTestsWithCoverage(options: TestRunnerOptions): Promise<TestResult> {
    const {
      projectPath,
      testCommand,
      environment = {},
    } = options;

    const env = {
      ...environment,
      CI: "true",
      NODE_ENV: "test",
      COVERAGE: "true",
    };

    const coverageCommand = testCommand
      ? `${testCommand} --coverage`
      : "npm test -- --coverage";

    const startTime = Date.now();

    try {
      const result = await this.executeCommand(coverageCommand, projectPath, env, {
        timeout: options.timeout || 300000,
        maxBuffer: this.maxBufferSize,
      });

      const duration = Date.now() - startTime;

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration,
        testResults: this.parseTestResults(result.stdout, result.stderr),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        exitCode: -1,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown error",
        duration,
      };
    }
  }

  /**
   * Get test coverage report
   */
  async getCoverageReport(projectPath: string): Promise<{
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  } | null> {
    const coveragePath = path.join(projectPath, "coverage", "coverage-summary.json");

    try {
      const coverageData = await fs.readFile(coveragePath, "utf-8");
      const coverage = JSON.parse(coverageData);

      return {
        lines: coverage.total.lines?.pct || 0,
        functions: coverage.total.functions?.pct || 0,
        branches: coverage.total.branches?.pct || 0,
        statements: coverage.total.statements?.pct || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Execute a command and capture output
   */
  private async executeCommand(
    command: string,
    cwd: string,
    env: NodeJS.ProcessEnv,
    options: { timeout: number; maxBuffer: number }
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, {
        shell: true,
        cwd,
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      childProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("close", (exitCode) => {
        resolve({ exitCode: exitCode || 0, stdout, stderr });
      });

      childProcess.on("error", (error) => {
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        childProcess.kill("SIGTERM");
        reject(new Error("Command execution timed out"));
      }, options.timeout);
    });
  }

  /**
   * Parse test results from stdout/stderr
   */
  private parseTestResults(
    stdout: string,
    _stderr: string
  ): TestSuiteResult[] {
    const results: TestSuiteResult[] = [];

    // Try to parse Jest-style output
    const jestMatch = stdout.match(/Test Suites:\s*(\d+)\s*passed,\s*(\d+)\s*total/);
    const testsMatch = stdout.match(/Tests:\s*(\d+)\s*passed,\s*(\d+)\s*total/);
    const timeMatch = stdout.match(/Time:\s*([\d.]+)s/);

    if (jestMatch || testsMatch) {
      const passed = parseInt(jestMatch?.[1] || testsMatch?.[1] || "0");
      const total = parseInt(jestMatch?.[2] || testsMatch?.[2] || "0");
      const failures = total - passed;
      const duration = parseFloat(timeMatch?.[1] || "0");

      results.push({
        name: "Test Suite",
        status: failures === 0 ? "passed" : "failed",
        duration,
        tests: total,
        failures,
        errors: this.parseFailureDetails(stdout),
      });
    }

    // Try to parse pytest output
    const pytestMatch = stdout.match(/passed=(\d+),\s*failed=(\d+)/);
    if (pytestMatch) {
      const passed = parseInt(pytestMatch[1]);
      const failed = parseInt(pytestMatch[2]);
      const total = passed + failed;

      results.push({
        name: "Pytest Suite",
        status: failed === 0 ? "passed" : "failed",
        duration: 0,
        tests: total,
        failures: failed,
        errors: [],
      });
    }

    return results;
  }

  /**
   * Parse failure details from test output
   */
  private parseFailureDetails(output: string): TestError[] {
    const errors: TestError[] = [];
    const failurePattern = /●\s+(.+?)\n\s+Message:\s*(.+?)\n\s+Expected:\s*([\s\S]*?)\n\s+Received:\s*([\s\S]*?)\n/g;
    const simplePattern = /(.+?)\n\s+at\s+.+?:(\d+)/g;

    let match;
    while ((match = failurePattern.exec(output)) !== null) {
      errors.push({
        name: match[1].trim(),
        message: match[2].trim(),
        stack: match[0],
      });
    }

    if (errors.length === 0) {
      while ((match = simplePattern.exec(output)) !== null) {
        errors.push({
          name: match[1].trim(),
          message: match[1].trim(),
          line: parseInt(match[2]),
        });
      }
    }

    return errors;
  }
}

export const testRunnerService = new TestRunnerService();
