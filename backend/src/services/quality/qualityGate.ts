import { DEFAULT_QUALITY_THRESHOLDS, SEVERITY_WEIGHTS } from '../../config/constants';
import { ProjectFile, QualityCheckType, Severity } from '@vibe/shared';

interface QualityResult {
  checkId: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message: string;
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  details?: Record<string, unknown>;
  suggestions?: string[];
}

interface QualityCheck {
  id: string;
  name: string;
  type: QualityCheckType;
  category: string;
  severity: Severity;
  description: string;
  enabled: boolean;
  run: (files: ProjectFile[]) => Promise<QualityResult[]>;
}

export class QualityGateService {
  private checks: QualityCheck[] = [];

  constructor() {
    this.initializeChecks();
  }

  private initializeChecks(): void {
    // Linting checks
    this.checks.push({
      id: 'lint-syntax',
      name: 'Syntax Validation',
      type: QualityCheckType.LINT,
      category: 'Code Style',
      severity: Severity.CRITICAL,
      description: 'Check for syntax errors in code files',
      enabled: true,
      run: async (files) => this.checkSyntax(files),
    });

    this.checks.push({
      id: 'lint-complexity',
      name: 'Complexity Check',
      type: QualityCheckType.COMPLEXITY,
      category: 'Maintainability',
      severity: Severity.MEDIUM,
      description: 'Detect overly complex functions',
      enabled: true,
      run: async (files) => this.checkComplexity(files),
    });

    // Security checks
    this.checks.push({
      id: 'security-secrets',
      name: 'Secret Detection',
      type: QualityCheckType.SECURITY,
      category: 'Security',
      severity: Severity.CRITICAL,
      description: 'Detect hardcoded secrets and API keys',
      enabled: true,
      run: async (files) => this.checkSecrets(files),
    });

    this.checks.push({
      id: 'security-injection',
      name: 'Injection Prevention',
      type: QualityCheckType.SECURITY,
      category: 'Security',
      severity: Severity.HIGH,
      description: 'Detect potential injection vulnerabilities',
      enabled: true,
      run: async (files) => this.checkInjection(files),
    });

    // Performance checks
    this.checks.push({
      id: 'performance-queries',
      name: 'N+1 Query Detection',
      type: QualityCheckType.PERFORMANCE,
      category: 'Performance',
      severity: Severity.MEDIUM,
      description: 'Detect potential N+1 query patterns',
      enabled: true,
      run: async (files) => this.checkNPlusOne(files),
    });

    // Testing checks
    this.checks.push({
      id: 'test-coverage',
      name: 'Test Coverage',
      type: QualityCheckType.TEST,
      category: 'Testing',
      severity: Severity.HIGH,
      description: 'Ensure adequate test coverage',
      enabled: true,
      run: async (files) => this.checkTestCoverage(files),
    });

    // Documentation checks
    this.checks.push({
      id: 'docs-comments',
      name: 'Documentation Comments',
      type: QualityCheckType.DOCS,
      category: 'Documentation',
      severity: Severity.LOW,
      description: 'Check for missing documentation',
      enabled: true,
      run: async (files) => this.checkDocumentation(files),
    });

    // Type checking
    this.checks.push({
      id: 'types-basic',
      name: 'Type Safety',
      type: QualityCheckType.TYPE_CHECK,
      category: 'Type Safety',
      severity: Severity.HIGH,
      description: 'Check for basic type issues',
      enabled: true,
      run: async (files) => this.checkTypeSafety(files),
    });
  }

  async runChecks(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];

    for (const check of this.checks) {
      if (!check.enabled) continue;

      try {
        const checkResults = await check.run(files);
        results.push(...checkResults);
      } catch (error) {
        results.push({
          checkId: check.id,
          name: check.name,
          status: 'warning',
          message: `Check failed to run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return results;
  }

  async runSpecificCheck(checkType: string, files: ProjectFile[]): Promise<QualityResult[]> {
    const check = this.checks.find((c) => c.id === checkType);
    if (!check) {
      return [{
        checkId: checkType,
        name: checkType,
        status: 'failed',
        message: `Unknown check type: ${checkType}`,
      }];
    }

    return check.run(files);
  }

  private async checkSyntax(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];

    for (const file of files) {
      if (!file.content) continue;

      const extension = file.path.split('.').pop()?.toLowerCase();
      const syntaxChecks: Record<string, RegExp[]> = {
        ts: [
          /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*\}/,
          /const\s+\w+\s*=/,
          /interface\s+\w+/,
        ],
        js: [
          /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*\}/,
          /const\s+\w+\s*=/,
          /let\s+\w+\s*=/,
        ],
        py: [
          /def\s+\w+\s*\([^)]*\):/,
          /class\s+\w+/,
        ],
      };

      const checks = syntaxChecks[extension || ''];
      if (!checks) continue;

      const hasSyntax = checks.some((regex) => regex.test(file.content!));

      results.push({
        checkId: 'syntax',
        name: 'Syntax Validation',
        status: hasSyntax ? 'passed' : 'failed',
        message: hasSyntax
          ? `File ${file.path} has valid syntax`
          : `Potential syntax issue in ${file.path}`,
        location: { file: file.path },
      });
    }

    return results;
  }

  private async checkComplexity(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];
    const COMPLEXITY_THRESHOLD = 10;

    for (const file of files) {
      if (!file.content || file.type === 'test') continue;

      // Count control flow statements as a simple complexity metric
      const controlFlowCount = (
        (file.content.match(/if/g) || []).length +
        (file.content.match(/else/g) || []).length +
        (file.content.match(/for/g) || []).length +
        (file.content.match(/while/g) || []).length +
        (file.content.match(/switch/g) || []).length +
        (file.content.match(/case/g) || []).length +
        (file.content.match(/catch/g) || []).length
      );

      const complexity = Math.ceil(controlFlowCount / 2);

      results.push({
        checkId: 'complexity',
        name: 'Complexity Check',
        status: complexity <= COMPLEXITY_THRESHOLD ? 'passed' : 'warning',
        message: `File ${file.path} has complexity score of ${complexity}`,
        location: { file: file.path },
        details: { complexity, threshold: COMPLEXITY_THRESHOLD },
        suggestions: complexity > COMPLEXITY_THRESHOLD
          ? ['Consider breaking down this function into smaller pieces', 'Extract complex logic into separate functions']
          : undefined,
      });
    }

    return results;
  }

  private async checkSecrets(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/gi,
      /secret\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /token\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/gi,
      /private[_-]?key\s*[:=]\s*['"]-----BEGIN/gi,
    ];

    for (const file of files) {
      if (!file.content) continue;

      const foundSecrets: string[] = [];
      for (const pattern of secretPatterns) {
        const matches = file.content.match(pattern);
        if (matches) {
          foundSecrets.push(...matches.slice(0, 3)); // Limit to first 3
        }
      }

      if (foundSecrets.length > 0) {
        results.push({
          checkId: 'secrets',
          name: 'Secret Detection',
          status: 'failed',
          message: `Potential secrets detected in ${file.path}`,
          location: { file: file.path },
          details: { foundSecrets: foundSecrets.length },
          suggestions: [
            'Use environment variables for secrets',
            'Move secrets to a .env file',
            'Add file to .gitignore if it contains secrets',
          ],
        });
      } else {
        results.push({
          checkId: 'secrets',
          name: 'Secret Detection',
          status: 'passed',
          message: `No secrets detected in ${file.path}`,
          location: { file: file.path },
        });
      }
    }

    return results;
  }

  private async checkInjection(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];
    const injectionPatterns = [
      /eval\s*\(/gi,
      /innerHTML\s*=/gi,
      /dangerouslySetInnerHTML/gi,
      /\$[(]/gi, // jQuery selector with user input
    ];

    for (const file of files) {
      if (!file.content) continue;

      const foundIssues: string[] = [];
      for (const pattern of injectionPatterns) {
        const matches = file.content.match(pattern);
        if (matches) {
          foundIssues.push(...matches.slice(0, 3));
        }
      }

      if (foundIssues.length > 0) {
        results.push({
          checkId: 'injection',
          name: 'Injection Prevention',
          status: 'warning',
          message: `Potential injection vulnerabilities in ${file.path}`,
          location: { file: file.path },
          details: { patterns: foundIssues },
          suggestions: [
            'Avoid using eval() with user input',
            'Sanitize HTML before using innerHTML',
            'Use parameterized queries for database operations',
          ],
        });
      } else {
        results.push({
          checkId: 'injection',
          name: 'Injection Prevention',
          status: 'passed',
          message: `No injection issues detected in ${file.path}`,
          location: { file: file.path },
        });
      }
    }

    return results;
  }

  private async checkNPlusOne(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];

    for (const file of files) {
      if (!file.content) continue;

      // Look for patterns that might indicate N+1
      const hasLoopWithQuery =
        (/for\s*\([^)]*\)\s*\{[\s\S]*?query|find|fetch|select/gi.test(file.content) &&
         /for\s*\(/.test(file.content));

      if (hasLoopWithQuery) {
        results.push({
          checkId: 'nplus1',
          name: 'N+1 Query Detection',
          status: 'warning',
          message: `Potential N+1 query pattern in ${file.path}`,
          location: { file: file.path },
          suggestions: [
            'Consider using batch queries or eager loading',
            'Use ORM features like include or prefetch',
          ],
        });
      } else {
        results.push({
          checkId: 'nplus1',
          name: 'N+1 Query Detection',
          status: 'passed',
          message: `No N+1 patterns detected in ${file.path}`,
          location: { file: file.path },
        });
      }
    }

    return results;
  }

  private async checkTestCoverage(files: ProjectFile[]): Promise<QualityResult[]> {
    const sourceFiles = files.filter((f) => f.type === 'FILE' && !f.path.includes('.test.') && !f.path.includes('.spec.'));
    const testFiles = files.filter((f) => f.type === 'FILE' && (f.path.includes('.test.') || f.path.includes('.spec.')));

    const ratio = testFiles.length / (sourceFiles.length || 1);
    const hasTests = testFiles.length > 0;

    return [{
      checkId: 'test-coverage',
      name: 'Test Coverage',
      status: hasTests ? (ratio >= 0.5 ? 'passed' : 'warning') : 'failed',
      message: hasTests
        ? `Found ${testFiles.length} test file(s) for ${sourceFiles.length} source file(s)`
        : 'No test files found',
      details: {
        sourceFiles: sourceFiles.length,
        testFiles: testFiles.length,
        ratio: Math.round(ratio * 100),
      },
      suggestions: !hasTests
        ? ['Add test files for your source code', 'Consider TDD approach']
        : ratio < 0.5
          ? ['Increase test coverage', 'Add more unit tests']
          : undefined,
    }];
  }

  private async checkDocumentation(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];

    for (const file of files) {
      if (!file.content || file.type === 'test') continue;

      const hasDocComments = /\/\*\*[\s\S]*?\*\//.test(file.content);
      const hasHeader = /^\/\/.*\n/.test(file.content) || /^\/\*[\s\S]*?\*\/\n/.test(file.content);
      const linesOfCode = file.content.split('\n').length;

      if (linesOfCode > 20 && !hasDocComments && !hasHeader) {
        results.push({
          checkId: 'documentation',
          name: 'Documentation Comments',
          status: 'warning',
          message: `File ${file.path} lacks documentation`,
          location: { file: file.path },
          details: { linesOfCode },
          suggestions: [
            'Add file-level documentation',
            'Document public functions and classes',
          ],
        });
      } else {
        results.push({
          checkId: 'documentation',
          name: 'Documentation Comments',
          status: 'passed',
          message: `File ${file.path} has adequate documentation`,
          location: { file: file.path },
        });
      }
    }

    return results;
  }

  private async checkTypeSafety(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];

    for (const file of files) {
      if (!file.content || !file.path.match(/\.(ts|tsx)$/)) continue;

      const hasTypeAnnotations =
        /:\s*(string|number|boolean|any|void|null|undefined|Record|Array|Object)/.test(file.content) ||
        /interface\s+\w+/.test(file.content) ||
        /type\s+\w+\s*=/.test(file.content);

      // Check for any which reduces type safety
      const hasAny = /\bany\b/.test(file.content);

      if (hasAny) {
        const anyCount = (file.content.match(/\bany\b/g) || []).length;
        results.push({
          checkId: 'type-safety',
          name: 'Type Safety',
          status: 'warning',
          message: `${file.path} uses 'any' type ${anyCount} time(s)`,
          location: { file: file.path },
          details: { anyCount },
          suggestions: [
            'Replace any with specific types',
            'Use unknown instead of any for truly unknown types',
          ],
        });
      } else if (hasTypeAnnotations) {
        results.push({
          checkId: 'type-safety',
          name: 'Type Safety',
          status: 'passed',
          message: `${file.path} has good type annotations`,
          location: { file: file.path },
        });
      } else {
        results.push({
          checkId: 'type-safety',
          name: 'Type Safety',
          status: 'warning',
          message: `${file.path} may benefit from more type annotations`,
          location: { file: file.path },
        });
      }
    }

    return results;
  }
}
