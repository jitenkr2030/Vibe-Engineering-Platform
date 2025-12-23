import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestIntelligenceService } from '../services/ai/testIntelligence';

// Mock dependencies
const mockAggregator = {
  complete: vi.fn(),
};

vi.mock('../services/ai/aiAggregator', () => ({
  aiAggregator: mockAggregator,
}));

describe('Test Intelligence Service', () => {
  let testIntelligence: TestIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    testIntelligence = new TestIntelligenceService();
  });

  describe('Unit Test Generation', () => {
    it('should generate unit tests', async () => {
      const code = `export function add(a: number, b: number): number {
  return a + b;
}`;

      const mockTests = `import { add } from './math';

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, 2)).toBe(1);
  });
});`;

      mockAggregator.complete.mockResolvedValue(mockTests);

      const result = await testIntelligence.generateUnitTests(
        code,
        'src/math.ts',
        'typescript',
        'jest',
        80
      );

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.tests[0].code).toContain('describe');
      expect(result.tests[0].type).toBe('unit');
    });

    it('should include edge cases in test generation', async () => {
      const code = `export function divide(a: number, b: number): number {
  return a / b;
}`;

      mockAggregator.complete.mockResolvedValue(`import { divide } from './math';

describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(6, 2)).toBe(3);
  });

  it('should throw on division by zero', () => {
    expect(() => divide(1, 0)).toThrow();
  });
});`);

      const result = await testIntelligence.generateUnitTests(
        code,
        'src/math.ts',
        'typescript',
        'jest',
        90
      );

      // Should detect division by zero edge case
      expect(result.edgeCases.length).toBeGreaterThan(0);
    });

    it('should respect coverage goal', async () => {
      const code = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`;

      mockAggregator.complete.mockResolvedValue(`import { greet } from './greet';

describe('greet', () => {
  it('should greet with name', () => {
    expect(greet('World')).toBe('Hello, World!');
  });
});`);

      const result = await testIntelligence.generateUnitTests(
        code,
        'src/greet.ts',
        'typescript',
        'vitest',
        100
      );

      expect(result.coverageGoal).toBe(100);
    });
  });

  describe('Integration Test Generation', () => {
    it('should generate integration tests', async () => {
      const files = [
        {
          path: 'src/controllers/user.ts',
          content: 'export const getUser = async (id: string) => { /* ... */ }',
        },
        {
          path: 'src/services/user.ts',
          content: 'export const findUserById = async (id: string) => { /* ... */ }',
        },
      ];

      mockAggregator.complete.mockResolvedValue(`import request from 'supertest';
import { app } from '../app';
import { getUser } from '../controllers/user';

describe('User API', () => {
  it('should return user by ID', async () => {
    const response = await request(app)
      .get('/api/users/123')
      .expect(200);
      
    expect(response.body).toHaveProperty('id');
  });
});`);

      const result = await testIntelligence.generateIntegrationTests(
        files.map((f) => f.content),
        files.map((f) => f.path),
        'typescript',
        'jest'
      );

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.tests[0].type).toBe('integration');
    });

    it('should test API endpoints', async () => {
      const files = ['src/routes/api.ts'];
      const endpoints = ['GET /users', 'POST /users'];

      mockAggregator.complete.mockResolvedValue(`import request from 'supertest';
import { app } from '../app';

describe('API Endpoints', () => {
  describe('GET /users', () => {
    it('should return list of users', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);
        
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});`);

      const result = await testIntelligence.generateIntegrationTests(
        ['const api = () => {};'],
        files,
        'typescript',
        'jest',
        endpoints
      );

      expect(result.tests.length).toBeGreaterThan(0);
    });
  });

  describe('E2E Test Generation', () => {
    it('should generate E2E tests', async () => {
      mockAggregator.complete.mockResolvedValue(`import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should complete login flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'user@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=submit]');
    
    await expect(page).toHaveURL(/\\/dashboard/);
  });
});`);

      const result = await testIntelligence.generateE2ETests(
        'web',
        ['login', 'dashboard', 'settings'],
        ['user-login', 'profile-update']
      );

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.tests[0].type).toBe('e2e');
    });
  });

  describe('Edge Case Detection', () => {
    it('should detect edge cases', async () => {
      const code = `export function processInput(input: string): string {
  return input.trim().toLowerCase();
}`;

      mockAggregator.complete.mockResolvedValue(JSON.stringify([
        { type: 'empty-string', description: 'Handle empty string input' },
        { type: 'null-undefined', description: 'Handle null or undefined' },
        { type: 'whitespace', description: 'Handle strings with only whitespace' },
        { type: 'unicode', description: 'Handle unicode characters' },
      ]));

      const result = await testIntelligence.detectEdgeCases(
        code,
        'src/utils.ts',
        'typescript'
      );

      expect(result.edgeCases.length).toBeGreaterThan(0);
    });

    it('should analyze complexity', async () => {
      const code = `export function complexFunction(a: number, b: number): number {
  if (a > 0) {
    if (b > 0) {
      return a + b;
    } else {
      return a - b;
    }
  } else {
    return b;
  }
}`;

      mockAggregator.complete.mockResolvedValue(JSON.stringify([
        { type: 'nested-conditionals', description: 'Deeply nested if statements' },
        { type: 'boundary-values', description: 'Test boundary values for a and b' },
      ]));

      const result = await testIntelligence.detectEdgeCases(
        code,
        'src/complex.ts',
        'typescript'
      );

      expect(result.edgeCases.some((e: any) => 
        e.type === 'nested-conditionals'
      )).toBe(true);
    });
  });

  describe('Coverage Explanation', () => {
    it('should explain coverage gaps', async () => {
      const code = `export function foo(x: number): number {
  return x * 2;
}`;

      const coverageReport = {
        lineCoverage: 100,
        branchCoverage: 50,
        functionCoverage: 100,
      };

      mockAggregator.complete.mockResolvedValue(
        'Consider adding tests for negative numbers, zero, and large values to improve branch coverage.'
      );

      const result = await testIntelligence.explainCoverageGaps(
        code,
        'src/foo.ts',
        coverageReport,
        'typescript'
      );

      expect(result.explanation).toBeDefined();
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate mock data', async () => {
      const schema = {
        name: 'string',
        age: 'number',
        email: 'string',
        isActive: 'boolean',
      };

      mockAggregator.complete.mockResolvedValue(JSON.stringify([
        { name: 'John', age: 30, email: 'john@example.com', isActive: true },
        { name: 'Jane', age: 25, email: 'jane@example.com', isActive: false },
      ]));

      const result = await testIntelligence.generateMockData(schema, 2, 'json');

      expect(result.mockData.length).toBe(2);
      expect(result.mockData[0]).toHaveProperty('name');
      expect(result.mockData[0]).toHaveProperty('age');
    });

    it('should generate multiple mock data entries', async () => {
      const schema = {
        id: 'uuid',
        title: 'string',
        content: 'string',
        createdAt: 'date',
      };

      mockAggregator.complete.mockResolvedValue(JSON.stringify(
        Array(10).fill(null).map((_, i) => ({
          id: \`uuid-\${i}\`,
          title: \`Title \${i}\`,
          content: \`Content for item \${i}\`,
          createdAt: new Date().toISOString(),
        }))
      ));

      const result = await testIntelligence.generateMockData(schema, 10, 'json');

      expect(result.mockData.length).toBe(10);
    });
  });

  describe('Test Suggestions', () => {
    it('should suggest test cases', async () => {
      const code = `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}`;

      mockAggregator.complete.mockResolvedValue(JSON.stringify([
        { name: 'add positive numbers', scenario: '2 + 3 = 5', priority: 'high' },
        { name: 'add negative numbers', scenario: '-1 + -2 = -3', priority: 'medium' },
        { name: 'add zero', scenario: '5 + 0 = 5', priority: 'medium' },
      ]));

      const result = await testIntelligence.suggestTestCases(
        code,
        'src/calculator.ts',
        'typescript'
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toHaveProperty('name');
      expect(result.suggestions[0]).toHaveProperty('priority');
    });
  });

  describe('Supported Frameworks', () => {
    it('should return supported frameworks', () => {
      const frameworks = testIntelligence.getSupportedFrameworks();

      expect(frameworks).toContain('jest');
      expect(frameworks).toContain('vitest');
      expect(frameworks).toContain('pytest');
      expect(frameworks).toContain('mocha');
    });
  });

  describe('Test Documentation', () => {
    it('should generate test documentation', async () => {
      const testFiles = [
        { path: 'src/math.test.ts', content: 'describe("math", () => {})' },
        { path: 'src/utils.test.ts', content: 'describe("utils", () => {})' },
      ];

      mockAggregator.complete.mockResolvedValue(`# Test Documentation

## Overview
This document describes the test coverage for the project.

## Test Files
- \`src/math.test.ts\` - Math utility tests
- \`src/utils.test.ts\` - Utility function tests

## Coverage Summary
- Unit Tests: 85%
- Integration Tests: 70%
`);

      const result = await testIntelligence.generateTestDocumentation(
        testFiles,
        'general',
        'markdown'
      );

      expect(result.documentation).toContain('Test Documentation');
    });
  });

  describe('All Tests Generation', () => {
    it('should generate all test types for a project', async () => {
      const files = [
        { path: 'src/a.ts', content: 'export const a = () => {};', language: 'typescript' },
        { path: 'src/b.ts', content: 'export const b = () => {};', language: 'typescript' },
      ];

      mockAggregator.complete.mockResolvedValue(JSON.stringify({
        tests: [
          { name: 'test-a', code: 'describe("a", () => {})', type: 'unit', edgeCases: [] },
          { name: 'test-b', code: 'describe("b", () => {})', type: 'unit', edgeCases: [] },
        ],
        coverage: { line: 85, branch: 70 },
      }));

      const result = await testIntelligence.generateAllTests(
        files,
        'typescript',
        'jest',
        80,
        ['unit', 'integration']
      );

      expect(result.tests.length).toBe(2);
      expect(result.coverage).toBeDefined();
    });
  });
});
