import { aiAggregator } from './aiAggregator';
import { CodeFile, ReviewResult, ReviewCategory, ReviewIssue, ReviewSuggestion } from './types';

/**
 * AI Reviewer Service
 * 
 * Provides intelligent code review capabilities including:
 * - Automated code analysis and quality assessment
 * - Best practices enforcement
 * - Security vulnerability detection
 * - Performance optimization suggestions
 * - Learning-focused feedback for developers
 */

interface ReviewOptions {
  severity?: 'info' | 'warning' | 'error' | 'critical';
  categories?: ReviewCategory[];
  includeExplanation?: boolean;
  suggestAlternatives?: boolean;
  focusAreas?: string[];
}

interface ReviewStats {
  totalFiles: number;
  totalIssues: number;
  criticalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface LearningResource {
  topic: string;
  description: string;
  type: 'documentation' | 'tutorial' | 'best-practice' | 'pattern';
  relevance: string;
}

interface AILearnerContext {
  developerLevel: 'junior' | 'mid' | 'senior';
  commonMistakes: string[];
  strengths: string[];
  areasForGrowth: string[];
}

class AIReviewerService {
  private aggregator: any;
  private reviewHistory: Map<string, ReviewResult[]>;
  private readonly DEFAULT_SEVERITY_THRESHOLD = 'warning';
  private readonly CATEGORIES: ReviewCategory[] = [
    'security',
    'performance',
    'maintainability',
    'style',
    'correctness',
    'documentation',
    'architecture'
  ];

  constructor() {
    this.aggregator = aiAggregator;
    this.reviewHistory = new Map();
  }

  /**
   * Perform a comprehensive code review on a single file
   */
  async reviewCode(file: CodeFile, options: ReviewOptions = {}): Promise<ReviewResult> {
    const {
      severity = 'info',
      categories = this.CATEGORIES,
      includeExplanation = true,
      suggestAlternatives = true,
      focusAreas = []
    } = options;

    // Build the review prompt
    const prompt = this.buildReviewPrompt(file, {
      severity,
      categories,
      includeExplanation,
      suggestAlternatives,
      focusAreas
    });

    try {
      // Get AI review from aggregator
      const response = await this.aggregator.complete({
        prompt,
        context: 'code-review',
        temperature: 0.3
      });

      // Parse the AI response into structured review results
      const reviewResult = this.parseReviewResponse(file, response, options);
      
      // Cache the review for trend analysis
      this.cacheReview(file.path, reviewResult);

      return reviewResult;
    } catch (error) {
      console.error('Code review failed:', error);
      throw new Error(`Failed to review code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform batch review on multiple files
   */
  async reviewMultipleFiles(files: CodeFile[], options: ReviewOptions = {}): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];
    
    // Process files in parallel with concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(file => this.reviewCode(file, options))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Review an entire project structure
   */
  async reviewProject(
    files: CodeFile[],
    projectContext: {
      name: string;
      language: string;
      framework?: string;
      description: string;
    }
  ): Promise<{
    results: ReviewResult[];
    summary: ProjectReviewSummary;
    recommendations: string[];
  }> {
    // Perform batch review on all files
    const results = await this.reviewMultipleFiles(files);

    // Generate project-level summary
    const summary = this.generateProjectSummary(results, projectContext);

    // Generate recommendations based on findings
    const recommendations = this.generateRecommendations(results, projectContext);

    return {
      results,
      summary,
      recommendations
    };
  }

  /**
   * Get personalized learning resources based on review history
   */
  async getPersonalizedLearning(
    filePath: string,
    learnerContext?: Partial<AILearnerContext>
  ): Promise<{
    resources: LearningResource[];
    insights: string[];
    nextSteps: string[];
  }> {
    const history = this.reviewHistory.get(filePath) || [];
    
    // Analyze common issues from history
    const commonIssues = this.analyzeCommonIssues(history);
    
    // Build learning context prompt
    const prompt = `Based on the following code review history and developer context:
    
Common Issues Found:
${commonIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Developer Level: ${learnerContext?.developerLevel || 'mid'}
Areas for Growth: ${learnerContext?.areasForGrowth?.join(', ') || 'General improvements'}

Provide:
1. Top 5 personalized learning resources (documentation, tutorials, best practices)
2. Key insights about recurring patterns
3. Concrete next steps for improvement

Format as JSON with keys: resources (array with topic, description, type, relevance), insights (array), nextSteps (array)`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'learning-recommendations',
        temperature: 0.5
      });

      return this.parseLearningResponse(response);
    } catch (error) {
      console.error('Failed to generate learning resources:', error);
      return {
        resources: [],
        insights: [],
        nextSteps: []
      };
    }
  }

  /**
   * Get review statistics and trends
   */
  getReviewStats(filePath: string): ReviewStats | null {
    const history = this.reviewHistory.get(filePath);
    if (!history || history.length === 0) return null;

    const recentReviews = history.slice(-10); // Last 10 reviews
    
    const stats: ReviewStats = {
      totalFiles: recentReviews.length,
      totalIssues: 0,
      criticalIssues: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      score: 0,
      trend: 'stable'
    };

    let totalScore = 0;
    
    for (const review of recentReviews) {
      for (const issue of review.issues) {
        stats.totalIssues++;
        switch (issue.severity) {
          case 'critical':
            stats.criticalIssues++;
            break;
          case 'error':
            stats.errors++;
            break;
          case 'warning':
            stats.warnings++;
            break;
          case 'info':
            stats.info++;
            break;
        }
      }
      totalScore += review.score;
    }

    stats.score = Math.round(totalScore / recentReviews.length);
    stats.trend = this.calculateTrend(recentReviews);

    return stats;
  }

  /**
   * Get security-focused review
   */
  async reviewSecurity(file: CodeFile): Promise<ReviewResult> {
    return this.reviewCode(file, {
      severity: 'warning',
      categories: ['security'],
      includeExplanation: true,
      suggestAlternatives: true,
      focusAreas: ['vulnerabilities', 'injection', 'authentication', 'encryption']
    });
  }

  /**
   * Get performance-focused review
   */
  async reviewPerformance(file: CodeFile): Promise<ReviewResult> {
    return this.reviewCode(file, {
      severity: 'warning',
      categories: ['performance'],
      includeExplanation: true,
      suggestAlternatives: true,
      focusAreas: ['complexity', 'memory', 'algorithms', 'io']
    });
  }

  /**
   * Get architecture-focused review
   */
  async reviewArchitecture(file: CodeFile, projectContext: {
    name: string;
    language: string;
    architecture?: string;
  }): Promise<ReviewResult> {
    const prompt = `Perform an architecture-focused code review on the following file:

File: ${file.path}
Language: ${file.language}
Content:
\`\`\`${file.language}
${file.content}
\`\`\`

Context:
- Project: ${projectContext.name}
- Language: ${projectContext.language}
- Architecture Pattern: ${projectContext.architecture || 'Not specified'}

Evaluate:
1. Separation of concerns
2. Coupling and cohesion
3. Design pattern usage
4. SOLID principle adherence
5. Extensibility and maintainability

Focus on architectural quality and provide specific improvement suggestions.

Format response as JSON with structure matching ReviewResult interface.`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'architecture-review',
        temperature: 0.4
      });

      return this.parseReviewResponse(file, response, {
        categories: ['architecture'],
        includeExplanation: true,
        suggestAlternatives: true
      });
    } catch (error) {
      console.error('Architecture review failed:', error);
      throw new Error(`Failed to review architecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare code against best practices
   */
  async compareWithBestPractices(file: CodeFile, pattern: string): Promise<{
    matches: boolean;
    recommendations: string[];
    examples: string[];
  }> {
    const prompt = `Compare the following code against the "${pattern}" best practice pattern:

File: ${file.path}
Language: ${file.language}
Content:
\`\`\`${file.language}
${file.content}
\`\`\`

Best Practice Pattern: ${pattern}

Evaluate:
1. Does the code follow this pattern?
2. What specific changes would align it better?
3. Provide corrected code examples

Format as JSON with keys: matches (boolean), recommendations (array of strings), examples (array of strings)`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'best-practices',
        temperature: 0.3
      });

      return this.parseBestPracticesResponse(response);
    } catch (error) {
      console.error('Best practices comparison failed:', error);
      return {
        matches: false,
        recommendations: ['Failed to analyze best practices'],
        examples: []
      };
    }
  }

  /**
   * Generate inline comments for a file
   */
  async generateInlineComments(file: CodeFile): Promise<Array<{
    line: number;
    content: string;
    type: 'suggestion' | 'issue' | 'praise' | 'question';
  }>> {
    const prompt = `Generate inline comments for the following code file:

File: ${file.path}
Language: ${file.language}
Content:
\`\`\`${file.language}
${file.content}
\`\`\`

Generate comments at appropriate lines for:
- Potential issues or bugs
- Improvement suggestions
- Things done well (praise)
- Questions for the developer
- TODO/FIXME suggestions

Format as JSON array with objects: { line: number, content: string, type: "suggestion" | "issue" | "praise" | "question" }`;

    try {
      const response = await this.aggregator.complete({
        prompt,
        context: 'inline-comments',
        temperature: 0.4
      });

      return this.parseInlineCommentsResponse(response);
    } catch (error) {
      console.error('Failed to generate inline comments:', error);
      return [];
    }
  }

  /**
   * Clear review history for a file
   */
  clearHistory(filePath: string): void {
    this.reviewHistory.delete(filePath);
  }

  /**
   * Clear all review history
   */
  clearAllHistory(): void {
    this.reviewHistory.clear();
  }

  // Private helper methods

  private buildReviewPrompt(file: CodeFile, options: ReviewOptions): string {
    const lines = file.content.split('\n');
    const startLine = Math.max(1, lines.length > 50 ? lines.length - 50 : 1);
    const relevantCode = lines.slice(startLine - 1).join('\n');

    return `Perform a comprehensive code review on the following file:

**File Information:**
- Path: ${file.path}
- Language: ${file.language}
- Size: ${file.size} bytes

**Review Configuration:**
- Severity Threshold: ${options.severity}
- Categories: ${options.categories?.join(', ') || 'All'}
- Include Explanations: ${options.includeExplanation}
- Suggest Alternatives: ${options.suggestAlternatives}
- Focus Areas: ${options.focusAreas?.join(', ') || 'General'}

**Code Content (lines ${startLine}-${lines.length} of ${lines.length}):
\`\`\`${file.language}
${relevantCode}
\`\`\`

**Review Guidelines:**

1. **Security Analysis**: Check for:
   - SQL injection vulnerabilities
   - XSS (Cross-Site Scripting) risks
   - Authentication/authorization issues
   - Sensitive data exposure
   - Input validation gaps

2. **Performance Analysis**: Check for:
   - Algorithmic complexity issues
   - Unnecessary memory allocations
   - Inefficient loops or iterations
   - Blocking operations
   - Missing optimizations

3. **Code Quality**: Check for:
   - Code style violations
   - Naming convention issues
   - Duplicate code
   - Long functions/methods
   - High cyclomatic complexity

4. **Best Practices**: Check for:
   - Error handling patterns
   - Resource cleanup (memory, file handles, connections)
   - Logging practices
   - Configuration management
   - Dependency management

5. **Documentation**: Check for:
   - Missing or unclear comments
   - Outdated documentation
   - API documentation gaps
   - Complex logic without explanation

Provide your review as a JSON object matching this structure:
{
  "file": { "path": string, "language": string },
  "score": number (0-100, where 100 is perfect),
  "issues": [{
    "line": number,
    "column": number,
    "severity": "info" | "warning" | "error" | "critical",
    "category": string,
    "message": string,
    "explanation": string (optional),
    "suggestion": string (optional),
    "relatedLines": number[] (optional)
  }],
  "summary": string,
  "highlights": [{
    "type": "strength" | "improvement",
    "message": string,
    "line": number (optional)
  }]
}`;
  }

  private parseReviewResponse(file: CodeFile, response: string, options: ReviewOptions): ReviewResult {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      
      return {
        file,
        score: parsed.score || 80,
        issues: this.normalizeIssues(parsed.issues || []),
        summary: parsed.summary || 'Code review completed.',
        highlights: parsed.highlights || [],
        timestamp: new Date(),
        options: {
          severity: options.severity,
          categories: options.categories,
          includeExplanation: options.includeExplanation,
          suggestAlternatives: options.suggestAlternatives,
          focusAreas: options.focusAreas
        }
      };
    } catch (jsonError) {
      // If JSON parsing fails, parse as text and create a basic result
      return this.fallbackParse(file, response);
    }
  }

  private normalizeIssues(issues: any[]): ReviewIssue[] {
    return issues.map(issue => ({
      line: issue.line || 1,
      column: issue.column || 0,
      severity: this.validateSeverity(issue.severity),
      category: this.validateCategory(issue.category),
      message: issue.message || 'Issue detected',
      explanation: issue.explanation || '',
      suggestion: issue.suggestion || '',
      relatedLines: issue.relatedLines || []
    }));
  }

  private validateSeverity(severity: string): ReviewIssue['severity'] {
    const validSeverities: ReviewIssue['severity'][] = ['info', 'warning', 'error', 'critical'];
    return validSeverities.includes(severity) ? severity : 'info';
  }

  private validateCategory(category: string): ReviewCategory {
    const validCategories: ReviewCategory[] = [
      'security', 'performance', 'maintainability', 'style',
      'correctness', 'documentation', 'architecture'
    ];
    return validCategories.includes(category) ? category : 'maintainability';
  }

  private fallbackParse(file: CodeFile, response: string): ReviewResult {
    // Simple fallback parser for non-JSON responses
    return {
      file,
      score: 75,
      issues: [{
        line: 1,
        column: 0,
        severity: 'info' as const,
        category: 'maintainability' as const,
        message: response.substring(0, 200),
        explanation: '',
        suggestion: ''
      }],
      summary: 'Review completed. Please check issues for details.',
      highlights: [],
      timestamp: new Date()
    };
  }

  private cacheReview(filePath: string, result: ReviewResult): void {
    const existing = this.reviewHistory.get(filePath) || [];
    existing.push(result);
    this.reviewHistory.set(filePath, existing);
  }

  private generateProjectSummary(results: ReviewResult[], projectContext: any): ProjectReviewSummary {
    let totalScore = 0;
    let totalIssues = 0;
    const categoryCounts: Record<string, number> = {};
    const severityCounts = { critical: 0, error: 0, warning: 0, info: 0 };

    for (const result of results) {
      totalScore += result.score;
      for (const issue of result.issues) {
        totalIssues++;
        categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
        severityCounts[issue.severity]++;
      }
    }

    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 100;

    return {
      totalFiles: results.length,
      totalIssues,
      averageScore: avgScore,
      categoryBreakdown: categoryCounts,
      severityBreakdown: severityCounts,
      healthStatus: avgScore >= 80 ? 'healthy' : avgScore >= 60 ? 'needs-attention' : 'critical',
      topIssues: Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }))
    };
  }

  private generateRecommendations(results: ReviewResult[], projectContext: any): string[] {
    const recommendations: string[] = [];
    
    // Aggregate issues by category
    const categoryIssues: Record<string, number> = {};
    for (const result of results) {
      for (const issue of result.issues) {
        categoryIssues[issue.category] = (categoryIssues[issue.category] || 0) + 1;
      }
    }

    // Generate recommendations based on most common issues
    const sortedCategories = Object.entries(categoryIssues)
      .sort((a, b) => b[1] - a[1]);

    for (const [category, count] of sortedCategories.slice(0, 3)) {
      recommendations.push(
        `Address ${count} ${category} issues detected across the codebase.`
      );
    }

    // Add project-specific recommendations
    recommendations.push(
      `Consider setting up automated code reviews in CI/CD pipeline for ${projectContext.name}.`
    );

    return recommendations;
  }

  private analyzeCommonIssues(history: ReviewResult[]): string[] {
    const issueMessages: string[] = [];
    
    for (const review of history) {
      for (const issue of review.issues) {
        // Extract common patterns from issue messages
        issueMessages.push(issue.message);
      }
    }

    // Return unique issue patterns (simplified)
    return [...new Set(issueMessages)].slice(0, 10);
  }

  private parseLearningResponse(response: string): {
    resources: LearningResource[];
    insights: string[];
    nextSteps: string[];
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        resources: parsed.resources || [],
        insights: parsed.insights || [],
        nextSteps: parsed.nextSteps || []
      };
    } catch {
      return {
        resources: [],
        insights: ['Continue practicing code reviews to identify patterns'],
        nextSteps: ['Review code regularly', 'Apply suggestions from reviews']
      };
    }
  }

  private calculateTrend(reviews: ReviewResult[]): 'improving' | 'stable' | 'declining' {
    if (reviews.length < 2) return 'stable';
    
    const recentScores = reviews.slice(-5).map(r => r.score);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderScores = reviews.slice(0, Math.min(5, reviews.length - 5)).map(r => r.score);
    const avgOlder = olderScores.length > 0 
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length 
      : avgRecent;

    const diff = avgRecent - avgOlder;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private parseBestPracticesResponse(response: string): {
    matches: boolean;
    recommendations: string[];
    examples: string[];
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        matches: parsed.matches || false,
        recommendations: parsed.recommendations || [],
        examples: parsed.examples || []
      };
    } catch {
      return {
        matches: false,
        recommendations: ['Review code against best practices'],
        examples: []
      };
    }
  }

  private parseInlineCommentsResponse(response: string): Array<{
    line: number;
    content: string;
    type: 'suggestion' | 'issue' | 'praise' | 'question';
  }> {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

// Types for internal use
interface ProjectReviewSummary {
  totalFiles: number;
  totalIssues: number;
  averageScore: number;
  categoryBreakdown: Record<string, number>;
  severityBreakdown: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  healthStatus: 'healthy' | 'needs-attention' | 'critical';
  topIssues: Array<{
    category: string;
    count: number;
  }>;
}

// Export singleton instance
export const aiReviewer = new AIReviewerService();

// Export class for testing
export { AIReviewerService };
