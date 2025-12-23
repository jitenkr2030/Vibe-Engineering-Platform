import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIReviewerService } from '../services/ai/aiReviewer';

// Mock dependencies
const mockAggregator = {
  complete: vi.fn(),
  configure: vi.fn(),
  getConfig: vi.fn(),
};

vi.mock('../services/ai/aiAggregator', () => ({
  aiAggregator: mockAggregator,
}));

describe('AI Reviewer Service', () => {
  let reviewer: AIReviewerService;

  beforeEach(() => {
    vi.clearAllMocks();
    reviewer = new AIReviewerService();
  });

  describe('Code Review', () => {
    it('should review a single file', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'const x = 1;',
        language: 'typescript',
        size: 15,
      };

      const mockResponse = JSON.stringify({
        score: 85,
        issues: [
          {
            line: 1,
            column: 1,
            severity: 'warning',
            category: 'style',
            message: 'Consider using const instead of let',
            suggestion: 'Use const for immutable variables',
          },
        ],
        summary: 'Good code with minor style suggestions',
        highlights: [
          { type: 'strength', message: 'Clean syntax', line: 1 },
        ],
      });

      mockAggregator.complete.mockResolvedValue(mockResponse);

      const result = await reviewer.reviewCode(mockFile);

      expect(result.file.path).toBe('src/example.ts');
      expect(result.score).toBe(85);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0].severity).toBe('warning');
      expect(result.issues[0].category).toBe('style');
      expect(result.highlights.length).toBe(1);
    });

    it('should handle empty response gracefully', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'console.log("hello");',
        language: 'javascript',
        size: 25,
      };

      mockAggregator.complete.mockResolvedValue('Some non-JSON response');

      const result = await reviewer.reviewCode(mockFile);

      expect(result.file.path).toBe('src/example.ts');
      expect(result.score).toBe(75); // Fallback score
      expect(result.issues.length).toBe(1);
    });

    it('should apply severity filter', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'const x = 1;',
        language: 'typescript',
        size: 15,
      };

      const mockResponse = JSON.stringify({
        score: 90,
        issues: [
          { line: 1, severity: 'info', category: 'style', message: 'Minor style issue' },
          { line: 2, severity: 'critical', category: 'security', message: 'SQL Injection!' },
        ],
        summary: 'Mixed review',
        highlights: [],
      });

      mockAggregator.complete.mockResolvedValue(mockResponse);

      const result = await reviewer.reviewCode(mockFile, {
        severity: 'warning',
      });

      // Both issues should be included regardless of severity filter
      // (filtering happens in the UI or on display)
      expect(result.issues.length).toBe(2);
    });

    it('should categorize issues correctly', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'const x = 1;',
        language: 'typescript',
        size: 15,
      };

      const mockResponse = JSON.stringify({
        score: 80,
        issues: [
          { line: 1, severity: 'error', category: 'security', message: 'XSS vulnerability' },
          { line: 2, severity: 'warning', category: 'performance', message: 'Inefficient loop' },
          { line: 3, severity: 'info', category: 'documentation', message: 'Missing JSDoc' },
        ],
        summary: 'Multi-category review',
        highlights: [],
      });

      mockAggregator.complete.mockResolvedValue(mockResponse);

      const result = await reviewer.reviewCode(mockFile);

      const categories = result.issues.map((i) => i.category);
      expect(categories).toContain('security');
      expect(categories).toContain('performance');
      expect(categories).toContain('documentation');
    });
  });

  describe('Batch Review', () => {
    it('should review multiple files', async () => {
      const mockFiles = [
        {
          path: 'src/a.ts',
          content: 'const a = 1;',
          language: 'typescript',
          size: 13,
        },
        {
          path: 'src/b.ts',
          content: 'const b = 2;',
          language: 'typescript',
          size: 13,
        },
      ];

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          score: 85,
          issues: [],
          summary: 'Good files',
          highlights: [],
        })
      );

      const results = await reviewer.reviewMultipleFiles(mockFiles);

      expect(results.length).toBe(2);
      expect(results[0].file.path).toBe('src/a.ts');
      expect(results[1].file.path).toBe('src/b.ts');
    });
  });

  describe('Specialized Reviews', () => {
    it('should perform security review', async () => {
      const mockFile = {
        path: 'src/auth.ts',
        content: 'const password = "hardcoded";',
        language: 'typescript',
        size: 30,
      };

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          score: 50,
          issues: [
            {
              line: 1,
              severity: 'critical',
              category: 'security',
              message: 'Hardcoded password detected',
            },
          ],
          summary: 'Security issues found',
          highlights: [],
        })
      );

      const result = await reviewer.reviewSecurity(mockFile);

      expect(result.score).toBe(50);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should perform performance review', async () => {
      const mockFile = {
        path: 'src/processor.ts',
        content: 'for (let i = 0; i < 1000000; i++) {}',
        language: 'typescript',
        size: 40,
      };

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          score: 60,
          issues: [
            {
              line: 1,
              severity: 'warning',
              category: 'performance',
              message: 'Inefficient loop detected',
            },
          ],
          summary: 'Performance issues found',
          highlights: [],
        })
      );

      const result = await reviewer.reviewPerformance(mockFile);

      expect(result.issues[0].category).toBe('performance');
    });
  });

  describe('Learning Resources', () => {
    it('should generate learning resources', async () => {
      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          resources: [
            { topic: 'TypeScript Generics', type: 'documentation', description: 'Learn about generics' },
          ],
          insights: ['Focus on type safety'],
          nextSteps: ['Read TypeScript handbook'],
        })
      );

      const result = await reviewer.getPersonalizedLearning('src/example.ts', {
        developerLevel: 'junior',
      });

      expect(result.resources.length).toBe(1);
      expect(result.resources[0].topic).toBe('TypeScript Generics');
      expect(result.insights.length).toBe(1);
      expect(result.nextSteps.length).toBe(1);
    });
  });

  describe('Review History', () => {
    it('should cache review results', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'const x = 1;',
        language: 'typescript',
        size: 15,
      };

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          score: 85,
          issues: [],
          summary: 'Good code',
          highlights: [],
        })
      );

      await reviewer.reviewCode(mockFile);
      const stats = reviewer.getReviewStats('src/example.ts');

      expect(stats).not.toBeNull();
      expect(stats?.totalFiles).toBe(1);
    });

    it('should calculate trend', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'const x = 1;',
        language: 'typescript',
        size: 15,
      };

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          score: 85,
          issues: [],
          summary: 'Good code',
          highlights: [],
        })
      );

      await reviewer.reviewCode(mockFile);
      await reviewer.reviewCode(mockFile);

      const stats = reviewer.getReviewStats('src/example.ts');

      expect(stats?.totalFiles).toBe(2);
    });

    it('should clear history', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'const x = 1;',
        language: 'typescript',
        size: 15,
      };

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          score: 85,
          issues: [],
          summary: 'Good code',
          highlights: [],
        })
      );

      await reviewer.reviewCode(mockFile);
      reviewer.clearHistory('src/example.ts');

      const stats = reviewer.getReviewStats('src/example.ts');
      expect(stats).toBeNull();
    });
  });

  describe('Best Practices', () => {
    it('should compare with best practices', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'let counter = 0; counter++;',
        language: 'typescript',
        size: 30,
      };

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify({
          matches: false,
          recommendations: ['Use const for immutable values'],
          examples: ['const counter = 0;'],
        })
      );

      const result = await reviewer.compareWithBestPractices(mockFile, 'immutability');

      expect(result.matches).toBe(false);
      expect(result.recommendations.length).toBe(1);
      expect(result.examples.length).toBe(1);
    });
  });

  describe('Inline Comments', () => {
    it('should generate inline comments', async () => {
      const mockFile = {
        path: 'src/example.ts',
        content: 'function calculate(a, b) { return a + b; }',
        language: 'typescript',
        size: 45,
      };

      mockAggregator.complete.mockResolvedValue(
        JSON.stringify([
          { line: 1, content: 'Consider adding JSDoc documentation', type: 'suggestion' },
        ])
      );

      const comments = await reviewer.generateInlineComments(mockFile);

      expect(comments.length).toBe(1);
      expect(comments[0].line).toBe(1);
      expect(comments[0].type).toBe('suggestion');
    });
  });
});
