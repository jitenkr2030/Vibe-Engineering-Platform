import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG } from '../../config/constants';
import { ProjectFile } from '@vibe/shared';

const prisma = new PrismaClient();

export interface RegressionCheckRequest {
  projectId: string;
  newCode: ProjectFile[];
  previousCode?: ProjectFile[];
  baseCommit?: string;
  compareCommit?: string;
}

export interface RegressionResult {
  hasRegressions: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  regressions: RegressionIssue[];
  breakingChanges: BreakingChange[];
  performanceImpact?: PerformanceImpact;
  testImpact: TestImpact;
  score: number;
  summary: string;
}

export interface RegressionIssue {
  type: 'functional' | 'api' | 'database' | 'performance' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  originalBehavior: string;
  newBehavior: string;
  suggestion: string;
  affectedUsers?: string[];
}

export interface BreakingChange {
  type: 'api' | 'database' | 'config' | 'behavior';
  file: string;
  change: string;
  impact: string;
  migrationPath?: string;
}

export interface PerformanceImpact {
  change: 'improved' | 'degraded' | 'unchanged';
  areas: Array<{
    area: string;
    before: string;
    after: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

export interface TestImpact {
  affectedTests: number;
  newTestsNeeded: number;
  testsToUpdate: string[];
  coverageChange: number;
}

export interface CodeSnapshot {
  id: string;
  projectId: string;
  filePath: string;
  content: string;
  checksum: string;
  embedding?: number[];
  createdAt: Date;
  commitHash?: string;
}

export class RegressionDetectorService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (AI_CONFIG.primary.apiKey) {
      this.openai = new OpenAI({ apiKey: AI_CONFIG.primary.apiKey });
    }
    if (AI_CONFIG.alternative.apiKey) {
      this.anthropic = new Anthropic({ apiKey: AI_CONFIG.alternative.apiKey });
    }
    logger.info('RegressionDetectorService initialized');
  }

  /**
   * Detect regressions between code versions
   */
  async detectRegressions(request: RegressionCheckRequest): Promise<RegressionResult> {
    logger.info('Starting regression detection', { projectId: request.projectId });

    const regressions: RegressionIssue[] = [];
    const breakingChanges: BreakingChange[] = [];
    let testImpact: TestImpact = {
      affectedTests: 0,
      newTestsNeeded: 0,
      testsToUpdate: [],
      coverageChange: 0,
    };

    // Get previous code snapshots if not provided
    let previousCode = request.previousCode;
    if (!previousCode || previousCode.length === 0) {
      previousCode = await this.getPreviousCodeSnapshots(request.projectId, request.baseCommit);
    }

    // Compare each file
    for (const newFile of request.newCode) {
      const oldFile = previousCode?.find(
        f => f.path === newFile.path && f.type !== 'DELETED'
      );

      if (oldFile?.content !== newFile.content) {
        // Analyze the changes
        const fileRegressions = await this.analyzeFileChanges(
          oldFile?.content || '',
          newFile.content || '',
          newFile.path
        );
        regressions.push(...fileRegressions.issues);
        breakingChanges.push(...fileRegressions.breakingChanges);
      }
    }

    // Analyze test impact
    testImpact = await this.analyzeTestImpact(request.newCode, previousCode || []);

    // Calculate overall score and severity
    const severityScore = this.calculateSeverityScore(regressions);
    const score = Math.max(0, 100 - severityScore);

    const hasRegressions = regressions.length > 0;
    const severity = this.determineSeverity(regressions, breakingChanges);

    const summary = this.generateSummary(
      hasRegressions,
      severity,
      regressions.length,
      breakingChanges.length,
      testImpact
    );

    logger.info('Regression detection completed', {
      projectId: request.projectId,
      hasRegressions,
      severity,
      regressionCount: regressions.length,
    });

    return {
      hasRegressions,
      severity,
      regressions,
      breakingChanges,
      testImpact,
      score,
      summary,
    };
  }

  /**
   * Analyze changes in a specific file
   */
  private async analyzeFileChanges(
    oldContent: string,
    newContent: string,
    filePath: string
  ): Promise<{ issues: RegressionIssue[]; breakingChanges: BreakingChange[] }> {
    const issues: RegressionIssue[] = [];
    const breakingChanges: BreakingChange[] = [];

    // Detect API changes
    const apiChanges = this.detectAPIChanges(oldContent, newContent, filePath);
    issues.push(...apiChanges.issues);
    breakingChanges.push(...apiChanges.breakingChanges);

    // Detect database changes
    const dbChanges = this.detectDatabaseChanges(oldContent, newContent, filePath);
    issues.push(...dbChanges.issues);
    breakingChanges.push(...dbChanges.breakingChanges);

    // Detect behavioral changes
    const behaviorChanges = this.detectBehavioralChanges(oldContent, newContent, filePath);
    issues.push(...behaviorChanges.issues);

    // Detect performance changes
    const perfChanges = this.detectPerformanceChanges(oldContent, newContent, filePath);
    issues.push(...perfChanges.issues);

    // Use AI for complex regression detection
    if (oldContent && newContent && (oldContent.length > 100 || newContent.length > 100)) {
      const aiAnalysis = await this.analyzeWithAI(oldContent, newContent, filePath);
      issues.push(...aiAnalysis.issues);
      breakingChanges.push(...aiAnalysis.breakingChanges);
    }

    return { issues, breakingChanges };
  }

  /**
   * Detect API changes that might break clients
   */
  private detectAPIChanges(
    oldContent: string,
    newContent: string,
    filePath: string
  ): { issues: RegressionIssue[]; breakingChanges: BreakingChange[] } {
    const issues: RegressionIssue[] = [];
    const breakingChanges: BreakingChange[] = [];

    // Detect removed exports
    const oldExports = this.extractExports(oldContent);
    const newExports = this.extractExports(newContent);

    const removedExports = oldExports.filter(e => !newExports.includes(e));
    for (const exportName of removedExports) {
      issues.push({
        type: 'api',
        severity: 'critical',
        file: filePath,
        description: `Removed public export: ${exportName}`,
        originalBehavior: `Function/class ${exportName} was available`,
        newBehavior: `${exportName} is no longer available`,
        suggestion: `Restore the export or provide a migration path`,
      });

      breakingChanges.push({
        type: 'api',
        file: filePath,
        change: `Removed export: ${exportName}`,
        impact: 'Clients using this export will break',
        migrationPath: 'Remove usage or find alternative',
      });
    }

    // Detect changed function signatures
    const oldSignatures = this.extractFunctionSignatures(oldContent);
    const newSignatures = this.extractFunctionSignatures(newContent);

    for (const oldSig of oldSignatures) {
      const newSig = newSignatures.find(s => s.name === oldSig.name);
      if (newSig && oldSig.params.length !== newSig.params.length) {
        issues.push({
          type: 'api',
          severity: 'high',
          file: filePath,
          description: `Function signature changed: ${oldSig.name}`,
          originalBehavior: `Function accepted ${oldSig.params.length} parameters`,
          newBehavior: `Function now accepts ${newSig.params.length} parameters`,
          suggestion: 'Update function calls or use optional parameters',
        });
      }
    }

    return { issues, breakingChanges };
  }

  /**
   * Detect database-related changes
   */
  private detectDatabaseChanges(
    oldContent: string,
    newContent: string,
    filePath: string
  ): { issues: RegressionIssue[]; breakingChanges: BreakingChange[] } {
    const issues: RegressionIssue[] = [];
    const breakingChanges: BreakingChange[] = [];

    // Detect Prisma schema changes
    if (filePath.includes('schema.prisma') || filePath.includes('.prisma')) {
      const oldFields = this.extractPrismaFields(oldContent);
      const newFields = this.extractPrismaFields(newContent);

      const removedFields = oldFields.filter(f => !newFields.includes(f));
      for (const field of removedFields) {
        issues.push({
          type: 'database',
          severity: 'critical',
          file: filePath,
          description: `Removed database field: ${field}`,
          originalBehavior: `Field ${field} existed in the schema`,
          newBehavior: `Field ${field} has been removed`,
          suggestion: 'Create a migration or restore the field',
        });

        breakingChanges.push({
          type: 'database',
          file: filePath,
          change: `Removed field: ${field}`,
          impact: 'Data loss for existing records',
          migrationPath: 'Add the field back or migrate data',
        });
      }

      // Detect required field additions
      const addedRequiredFields = newFields.filter(
        f => !oldFields.includes(f) && this.isRequiredField(newContent, f)
      );
      for (const field of addedRequiredFields) {
        issues.push({
          type: 'database',
          severity: 'medium',
          file: filePath,
          description: `Added required field: ${field}`,
          originalBehavior: `Field was optional or didn't exist`,
          newBehavior: `Field is now required`,
          suggestion: 'Provide default values or update existing records',
        });
      }
    }

    // Detect SQL changes
    if (filePath.endsWith('.sql')) {
      if (oldContent.includes('DROP TABLE') && !newContent.includes('DROP TABLE')) {
        issues.push({
          type: 'database',
          severity: 'high',
          file: filePath,
          description: 'Table drop operation detected',
          originalBehavior: 'Tables were preserved',
          newBehavior: 'Tables are being dropped',
          suggestion: 'Verify this is intentional and backups exist',
        });
      }
    }

    return { issues, breakingChanges };
  }

  /**
   * Detect behavioral changes
   */
  private detectBehavioralChanges(
    oldContent: string,
    newContent: string,
    filePath: string
  ): { issues: RegressionIssue[] } {
    const issues: RegressionIssue[] = [];

    // Detect error handling changes
    const oldErrorHandling = this.countErrorHandling(oldContent);
    const newErrorHandling = this.countErrorHandling(newContent);

    if (newErrorHandling < oldErrorHandling * 0.8) {
      issues.push({
        type: 'functional',
        severity: 'medium',
        file: filePath,
        description: 'Reduced error handling coverage',
        originalBehavior: `Found ${oldErrorHandling} error handling patterns`,
        newBehavior: `Found ${newErrorHandling} error handling patterns`,
        suggestion: 'Ensure error cases are still handled',
      });
    }

    // Detect validation changes
    const oldValidation = this.countValidation(oldContent);
    const newValidation = this.countValidation(newContent);

    if (newValidation < oldValidation * 0.7) {
      issues.push({
        type: 'functional',
        severity: 'high',
        file: filePath,
        description: 'Reduced input validation',
        originalBehavior: `Found ${oldValidation} validation checks`,
        newBehavior: `Found ${newValidation} validation checks`,
        suggestion: 'Add back input validation for security',
      });
    }

    return { issues };
  }

  /**
   * Detect performance-related changes
   */
  private detectPerformanceChanges(
    oldContent: string,
    newContent: string,
    filePath: string
  ): { issues: RegressionIssue[] } {
    const issues: RegressionIssue[] = [];

    // Detect N+1 query patterns
    if (this.containsNPlusOnePattern(newContent)) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        file: filePath,
        description: 'Potential N+1 query pattern detected',
        originalBehavior: 'Previous implementation',
        newBehavior: 'New implementation may have N+1 issues',
        suggestion: 'Use batch queries or eager loading',
      });
    }

    // Detect missing indexes in queries
    if (this.containsFullTableScan(newContent)) {
      issues.push({
        type: 'performance',
        severity: 'low',
        file: filePath,
        description: 'Potential full table scan detected',
        originalBehavior: 'Previous query patterns',
        newBehavior: 'New query may scan entire table',
        suggestion: 'Consider adding database indexes',
      });
    }

    return { issues };
  }

  /**
   * Use AI for complex regression analysis
   */
  private async analyzeWithAI(
    oldContent: string,
    newContent: string,
    filePath: string
  ): Promise<{ issues: RegressionIssue[]; breakingChanges: BreakingChange[] }> {
    const prompt = `Analyze the following code changes for regressions and breaking changes:

**File**: ${filePath}

**Old Code**:
\`\`\`
${oldContent.slice(0, 3000)}
\`\`\`

**New Code**:
\`\`\`
${newContent.slice(0, 3000)}
\`\`\`

Identify:
1. Functional regressions (behavior that changed)
2. API breaking changes
3. Security implications
4. Performance impacts

**Output Format** (JSON):
{
  "issues": [
    {
      "type": "functional|api|security|performance",
      "severity": "critical|high|medium|low",
      "description": "Clear description",
      "originalBehavior": "What was the old behavior",
      "newBehavior": "What is the new behavior",
      "suggestion": "How to fix or mitigate"
    }
  ],
  "breakingChanges": [
    {
      "type": "api|database|config|behavior",
      "change": "What changed",
      "impact": "Impact on users",
      "migrationPath": "How to migrate"
    }
  ]
}`;

    try {
      let response: string;
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: AI_CONFIG.primary.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert software architect specializing in detecting code regressions and breaking changes.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        });
        response = completion.choices[0]?.message?.content || '';
      } else {
        return { issues: [], breakingChanges: [] };
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          issues: result.issues || [],
          breakingChanges: result.breakingChanges || [],
        };
      }
    } catch (error) {
      logger.error('AI regression analysis failed', { error });
    }

    return { issues: [], breakingChanges: [] };
  }

  /**
   * Analyze impact on tests
   */
  private async analyzeTestImpact(
    newCode: ProjectFile[],
    oldCode: ProjectFile[]
  ): Promise<TestImpact> {
    const affectedTests: string[] = [];
    let newTestsNeeded = 0;
    let testsToUpdate: string[] = [];

    // Find test files that might need updates
    for (const file of newCode) {
      const testFile = this.findMatchingTestFile(file.path);
      if (testFile) {
        affectedTests.push(testFile);
        testsToUpdate.push(testFile);
      }
    }

    // Count new code that needs tests
    const untestedCode = newCode.filter(f => !this.hasMatchingTest(f.path, oldCode));
    newTestsNeeded = untestedCode.length;

    return {
      affectedTests: affectedTests.length,
      newTestsNeeded,
      testsToUpdate,
      coverageChange: -5, // Estimate
    };
  }

  /**
   * Create a code snapshot for future comparison
   */
  async createSnapshot(
    projectId: string,
    files: ProjectFile[],
    commitHash?: string
  ): Promise<CodeSnapshot[]> {
    const snapshots: CodeSnapshot[] = [];

    for (const file of files) {
      const snapshot: CodeSnapshot = {
        id: crypto.randomUUID(),
        projectId,
        filePath: file.path,
        content: file.content || '',
        checksum: this.calculateChecksum(file.content || ''),
        createdAt: new Date(),
        commitHash,
      };

      await prisma.codeSnapshot.create({
        data: snapshot,
      });

      snapshots.push(snapshot);
    }

    logger.info('Created code snapshots', { projectId, count: snapshots.length });
    return snapshots;
  }

  /**
   * Get previous code snapshots
   */
  private async getPreviousCodeSnapshots(
    projectId: string,
    commitHash?: string
  ): Promise<ProjectFile[]> {
    try {
      const snapshots = await prisma.codeSnapshot.findMany({
        where: {
          projectId,
          ...(commitHash ? { commitHash } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return snapshots.map(s => ({
        id: s.id,
        path: s.filePath,
        name: s.filePath.split('/').pop() || '',
        type: 'FILE' as const,
        content: s.content,
      }));
    } catch (error) {
      logger.error('Failed to get previous snapshots', { projectId, error });
      return [];
    }
  }

  // Helper methods
  private extractExports(content: string): string[] {
    const patterns = [
      /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g,
    ];
    
    const exports: string[] = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        exports.push(match[1] || match[0]);
      }
    }
    return [...new Set(exports)];
  }

  private extractFunctionSignatures(content: string): Array<{ name: string; params: string[] }> {
    const signatureRegex = /(?:function|const|let|var)\s+(\w+)\s*\(([^)]*)\)/g;
    const signatures: Array<{ name: string; params: string[] }> = [];
    let match;

    while ((match = signatureRegex.exec(content)) !== null) {
      signatures.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(Boolean),
      });
    }

    return signatures;
  }

  private extractPrismaFields(content: string): string[] {
    const fieldRegex = /(\w+)\s+(?:String|Int|Float|Boolean|DateTime|Json|Bytes)\s*(?:\?)?/g;
    const fields: string[] = [];
    let match;

    while ((match = fieldRegex.exec(content)) !== null) {
      fields.push(match[1]);
    }

    return fields;
  }

  private isRequiredField(content: string, fieldName: string): boolean {
    const pattern = new RegExp(`${fieldName}\\s+(?:String|Int|Float|Boolean|DateTime)`, 'g');
    return !pattern.test(content) || content.includes(`${fieldName}?`);
  }

  private countErrorHandling(content: string): number {
    return (content.match(/try\s*\{/g) || []).length +
           (content.match(/catch\s*\(/g) || []).length +
           (content.match(/if\s*\([^)]*error/gi) || []).length;
  }

  private countValidation(content: string): number {
    return (content.match(/validate|validates|assert|check/gi) || []).length +
           (content.match(/typeof|instanceof/gi) || []).length;
  }

  private containsNPlusOnePattern(content: string): boolean {
    return /for\s*\([^)]*\)\s*\{[\s\S]*\.(?:find|query|fetch|select)/i.test(content) &&
           /for\s*\(/.test(content);
  }

  private containsFullTableScan(content: string): boolean {
    return /\.findMany\(\)/.test(content) && !/\.where\(/.test(content);
  }

  private findMatchingTestFile(filePath: string): string {
    return filePath
      .replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')
      .replace(/src\//, 'src/__tests__/');
  }

  private hasMatchingTest(filePath: string, files: ProjectFile[]): boolean {
    const testPath = this.findMatchingTestFile(filePath);
    return files.some(f => f.path === testPath);
  }

  private calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private calculateSeverityScore(regressions: RegressionIssue[]): number {
    const weights = { critical: 50, high: 25, medium: 10, low: 5 };
    return regressions.reduce((sum, r) => sum + (weights[r.severity] || 0), 0);
  }

  private determineSeverity(
    regressions: RegressionIssue[],
    breakingChanges: BreakingChange[]
  ): 'critical' | 'high' | 'medium' | 'low' | 'none' {
    if (breakingChanges.some(b => b.type === 'database') || 
        regressions.some(r => r.severity === 'critical')) {
      return 'critical';
    }
    if (breakingChanges.length > 0 || regressions.some(r => r.severity === 'high')) {
      return 'high';
    }
    if (regressions.length > 0) {
      return 'medium';
    }
    return 'none';
  }

  private generateSummary(
    hasRegressions: boolean,
    severity: string,
    regressionCount: number,
    breakingCount: number,
    testImpact: TestImpact
  ): string {
    if (!hasRegressions) {
      return 'No regressions detected. Code changes appear safe.';
    }

    return `Found ${regressionCount} potential regression(s) and ${breakingCount} breaking change(s). ` +
           `Severity: ${severity}. ` +
           `Test impact: ${testImpact.newTestsNeeded} new tests needed, ` +
           `${testImpact.testsToUpdate.length} tests may need updates.`;
  }
}

export const regressionDetectorService = new RegressionDetectorService();
export default RegressionDetectorService;
