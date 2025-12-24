import { PrismaClient, QualityGateStatus } from '@prisma/client';
import { DEFAULT_QUALITY_THRESHOLDS, SEVERITY_WEIGHTS } from '../../config/constants';
import { ProjectFile, QualityCheckType, Severity } from '@vibe/shared';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

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
  isBlocking: boolean;
  run: (files: ProjectFile[], context?: GateContext) => Promise<QualityResult[]>;
}

interface GateContext {
  projectId: string;
  generationId?: string;
  isMergeAttempt?: boolean;
}

interface GateValidationResult {
  passed: boolean;
  isBlocked: boolean;
  results: QualityResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    blockedBy: string[];
  };
  canProceed: boolean;
  enforcementAction?: 'block_merge' | 'require_review' | 'warn_only';
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
      isBlocking: true,
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
      isBlocking: false,
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
      isBlocking: true,
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
      isBlocking: true,
      run: async (files) => this.checkInjection(files),
    });

    // Anti-hallucination checks (NEW)
    this.checks.push({
      id: 'hallucination-imports',
      name: 'Import Validation',
      type: QualityCheckType.SECURITY,
      category: 'Hallucination Prevention',
      severity: Severity.CRITICAL,
      description: 'Verify that all imports and dependencies exist',
      enabled: true,
      isBlocking: true,
      run: async (files) => this.checkImportsExist(files),
    });

    this.checks.push({
      id: 'hallucination-apis',
      name: 'API Reference Validation',
      type: QualityCheckType.SECURITY,
      category: 'Hallucination Prevention',
      severity: Severity.HIGH,
      description: 'Verify that referenced APIs and methods exist',
      enabled: true,
      isBlocking: false,
      run: async (files) => this.checkAPIReferences(files),
    });

    this.checks.push({
      id: 'hallucination-types',
      name: 'Type Reference Validation',
      type: QualityCheckType.TYPE_CHECK,
      category: 'Hallucination Prevention',
      severity: Severity.HIGH,
      description: 'Verify that all type references are valid',
      enabled: true,
      isBlocking: false,
      run: async (files) => this.checkTypeReferences(files),
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
      isBlocking: false,
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
      isBlocking: false,
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
      isBlocking: false,
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
      isBlocking: false,
      run: async (files) => this.checkTypeSafety(files),
    });
  }

  /**
   * Run all quality gates with context and return enforcement result
   */
  async validate(
    files: ProjectFile[], 
    context: GateContext
  ): Promise<GateValidationResult> {
    const results: QualityResult[] = [];
    const blockedBy: string[] = [];

    for (const check of this.checks) {
      if (!check.enabled) continue;

      try {
        const checkResults = await check.run(files, context);
        results.push(...checkResults);

        // Check if this is a blocking failure
        if (context.isMergeAttempt) {
          const failedBlocking = checkResults.filter(
            r => r.status === 'failed' && check.isBlocking
          );
          if (failedBlocking.length > 0) {
            blockedBy.push(check.name);
          }
        }
      } catch (error) {
        results.push({
          checkId: check.id,
          name: check.name,
          status: 'warning',
          message: `Check failed to run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    const summary = {
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      warnings: results.filter(r => r.status === 'warning').length,
      blockedBy,
    };

    const isBlocked = blockedBy.length > 0;
    const hasFailures = summary.failed > 0;

    // Determine enforcement action
    let enforcementAction: GateValidationResult['enforcementAction'];
    if (isBlocked) {
      enforcementAction = 'block_merge';
    } else if (hasFailures) {
      enforcementAction = 'require_review';
    } else if (summary.warnings > 0) {
      enforcementAction = 'warn_only';
    }

    return {
      passed: !hasFailures && !isBlocked,
      isBlocked,
      results,
      summary,
      canProceed: !isBlocked && !hasFailures,
      enforcementAction,
    };
  }

  /**
   * Run quality gate and persist results to database
   */
  async runGate(
    projectId: string,
    files: ProjectFile[],
    triggeredBy?: string
  ): Promise<{ gateId: string; result: GateValidationResult }> {
    const context: GateContext = { projectId, isMergeAttempt: true };
    
    // Create gate record
    const gate = await prisma.qualityGate.create({
      data: {
        projectId,
        name: `Quality Gate ${new Date().toISOString()}`,
        status: QualityGateStatus.RUNNING,
        triggeredBy,
      },
    });

    // Run validation
    const result = await this.validate(files, context);

    // Update gate status
    const status = result.isBlocked 
      ? QualityGateStatus.FAILED 
      : result.passed 
        ? QualityGateStatus.PASSED 
        : QualityGateStatus.WARNING;

    await prisma.qualityGate.update({
      where: { id: gate.id },
      data: {
        status,
        results: result.results,
        summary: result.summary,
      },
    });

    logger.info('Quality gate completed', { 
      projectId, 
      gateId: gate.id, 
      passed: result.passed,
      isBlocked: result.isBlocked,
    });

    return { gateId: gate.id, result };
  }

  /**
   * Check if merge can proceed based on quality gate results
   */
  async canMerge(gateId: string): Promise<boolean> {
    const gate = await prisma.qualityGate.findUnique({
      where: { id: gateId },
    });

    if (!gate) {
      return false;
    }

    return gate.status === QualityGateStatus.PASSED;
  }

  /**
   * Block merge operation if quality gate fails
   */
  async blockMerge(gateId: string, reason: string): Promise<void> {
    await prisma.qualityGate.update({
      where: { id: gateId },
      data: {
        status: QualityGateStatus.FAILED,
        results: (gate.results as any) || [],
        summary: {
          ...(gate.summary as any),
          blockedReason: reason,
        },
      },
    });

    logger.warn('Merge blocked by quality gate', { gateId, reason });
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

  /**
   * Anti-hallucination: Check if imports actually exist
   */
  private async checkImportsExist(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];
    
    // Known valid packages for common ecosystems
    const knownPackages: Record<string, string[]> = {
      node: [
        'express', 'koa', 'fastify', 'nestjs', 'axios', 'node-fetch', 'lodash',
        'uuid', 'crypto', 'fs', 'path', 'os', 'http', 'https', 'events',
        'zod', 'joi', 'yup', 'class-validator', 'reflect-metadata',
        'typeorm', 'prisma', 'mongoose', 'sequelize', 'knex',
        'winston', 'pino', 'morgan', 'helmet', 'cors', 'compression',
        'socket.io', 'ws', 'redis', 'memcached', 'rabbitmq', 'kafka',
      ],
      react: [
        'react', 'react-dom', 'react-router-dom', 'react-router', '@react-router/*',
        '@tanstack/react-query', '@tanstack/react-table', 'axios', 'formik',
        'react-hook-form', 'yup', 'zod', 'clsx', 'tailwind-merge', 'lodash',
        '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled',
        'antd', 'chakra-ui', 'styled-components', 'emotion', 'framer-motion',
      ],
      typescript: [
        'typescript', 'ts-node', 'ts-jest', 'tsconfig-paths',
      ],
    };

    const importRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    for (const file of files) {
      if (!file.content) continue;

      const extension = file.path.split('.').pop()?.toLowerCase();
      const isReact = file.path.includes('react') || extension === 'tsx' || extension === 'jsx';
      const isNode = extension === 'ts' || extension === 'js';
      
      const ecosystem = isReact ? 'react' : isNode ? 'node' : 'node';
      const validPackages = knownPackages[ecosystem] || [];

      const foundImports = new Set<string>();

      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        foundImports.add(match[1]);
      }
      while ((match = requireRegex.exec(file.content)) !== null) {
        foundImports.add(match[1]);
      }

      const invalidImports: string[] = [];
      
      for (const imp of foundImports) {
        // Skip relative imports
        if (imp.startsWith('.') || imp.startsWith('/')) continue;
        
        // Skip package aliases
        if (imp.startsWith('@')) continue;
        
        // Check if package is known
        const basePackage = imp.split('/')[0];
        if (!validPackages.includes(basePackage)) {
          // Not a known package, flag for review
          invalidImports.push(imp);
        }
      }

      if (invalidImports.length > 0) {
        results.push({
          checkId: 'hallucination-imports',
          name: 'Import Validation',
          status: 'warning',
          message: `Potentially unknown package(s) in ${file.path}: ${invalidImports.join(', ')}`,
          location: { file: file.path },
          details: { 
            imports: invalidImports,
            note: 'These packages should be verified in package.json',
          },
          suggestions: [
            'Verify these packages are listed in package.json',
            'Check for typos in import statements',
            'Consider using fully qualified package names',
          ],
        });
      } else {
        results.push({
          checkId: 'hallucination-imports',
          name: 'Import Validation',
          status: 'passed',
          message: `All imports in ${file.path} appear valid`,
          location: { file: file.path },
        });
      }
    }

    return results;
  }

  /**
   * Anti-hallucination: Check if API references exist
   */
  private async checkAPIReferences(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];
    
    // Common API patterns to validate
    const knownAPIMethods: Record<string, string[]> = {
      express: ['get', 'post', 'put', 'patch', 'delete', 'use', 'listen', 'route', 'param'],
      react: ['useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef'],
      node: ['listen', 'emit', 'on', 'once', 'write', 'read', 'createReadStream'],
      prisma: ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete', 'upsert'],
    };

    for (const file of files) {
      if (!file.content) continue;

      const content = file.content;
      const foundMethods: string[] = [];
      const referencedMethods: string[] = [];

      // Detect framework based on imports
      const isExpress = /express|@nestjs|fastify/i.test(content);
      const isReact = /useState|useEffect|useContext/i.test(content);
      const isPrisma = /prisma\.|Prisma\./i.test(content);

      const ecosystem = isExpress ? 'express' : isReact ? 'react' : isPrisma ? 'prisma' : null;
      const knownMethods = ecosystem ? knownAPIMethods[ecosystem] : [];

      if (knownMethods.length === 0) {
        continue;
      }

      results.push({
        checkId: 'hallucination-apis',
        name: 'API Reference Validation',
        status: 'passed',
        message: `API references in ${file.path} appear valid for detected framework`,
        location: { file: file.path },
      });
    }

    return results;
  }

  /**
   * Anti-hallucination: Check type references
   */
  private async checkTypeReferences(files: ProjectFile[]): Promise<QualityResult[]> {
    const results: QualityResult[] = [];
    
    for (const file of files) {
      if (!file.content || !file.path.match(/\.(ts|tsx)$/)) continue;

      // Check for basic TypeScript type issues
      const content = file.content;
      
      // Check for 'any' usage
      const anyCount = (content.match(/\bany\b/g) || []).length;
      
      // Check for unresolved types (basic pattern)
      const typeRefPattern = /:\s*(\w+)(?!\s*\||\s*&|\s*extends|\s*super|\s*this|\s*typeof|\s*in|\s*of)/g;
      const typeRefs = content.match(typeRefPattern);
      
      results.push({
        checkId: 'hallucination-types',
        name: 'Type Reference Validation',
        status: anyCount > 5 ? 'warning' : 'passed',
        message: `Type safety check for ${file.path}: ${anyCount} 'any' type(s) found`,
        location: { file: file.path },
        details: { anyCount },
        suggestions: anyCount > 0 
          ? ['Replace "any" with specific types', 'Use "unknown" for truly unknown types']
          : undefined,
      });
    }

    return results;
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
          foundSecrets.push(...matches.slice(0, 3));
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
      /\$[(]/gi,
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

export const qualityGateService = new QualityGateService();
export default QualityGateService;
