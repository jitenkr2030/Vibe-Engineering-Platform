import { aiAggregator } from './aiAggregator';
import { AIResponse } from '../types';

export interface TestGenerationRequest {
  sourceCode: string;
  language: string;
  testFramework: 'jest' | 'vitest' | 'pytest' | 'junit' | 'mocha';
  testType: 'unit' | 'integration' | 'e2e';
  coverageTarget?: number;
  edgeCases?: boolean;
  mockData?: boolean;
}

export interface TestGenerationResult {
  testCode: string;
  framework: string;
  testCount: number;
  coverageEstimate: number;
  mocksRequired: {
    name: string;
    reason: string;
    implementation: string;
  }[];
  edgeCases: {
    description: string;
    testCase: string;
    expectedBehavior: string;
  }[];
  plainEnglishExplanation: string;
  dependencies: string[];
}

export interface TestFailureExplanation {
  testName: string;
  errorMessage: string;
  rootCause: string;
  fixSuggestion: string;
  explanation: string; // Plain English
}

export class TestIntelligenceService {
  private systemPrompt = `You are a Senior QA Engineer and Test Architect with expertise in:
- Unit testing, integration testing, and E2E testing
- Test-driven development (TDD) practices
- Mocking and stubbing strategies
- Edge case identification
- Writing readable, maintainable tests

Always explain tests in plain English that developers can understand.`;

  async generateTests(request: TestGenerationRequest): Promise<TestGenerationResult> {
    const prompt = this.buildTestPrompt(request);
    
    const response = await aiAggregator.completeJSON<TestGenerationResult>(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.3,
      maxTokens: 5000,
      systemPrompt: this.systemPrompt,
    });

    return response;
  }

  private buildTestPrompt(request: TestGenerationRequest): string {
    const frameworkInstructions = {
      jest: 'Use Jest syntax with describe(), it(), and expect(). Include beforeAll, beforeEach, afterAll, afterEach as needed.',
      vitest: 'Use Vitest syntax which is similar to Jest. Use describe(), it(), and expect().',
      pytest: 'Use pytest with fixtures, parametrize, and pytest.mark decorators.',
      junit: 'Generate JUnit 5 test class with @Test annotations and assertions.',
      mocha: 'Use Mocha with describe(), it(), before(), after(), and Chai assertions.',
    };

    const prompt = `Generate ${request.testType} tests for the following ${request.language} code:

\`\`\`${request.language}
${request.sourceCode}
\`\`\`

Requirements:
- Test Framework: ${request.testFramework}
- Test Type: ${request.testType}
${request.coverageTarget ? `- Target Coverage: ${request.coverageTarget}%` : ''}
${request.edgeCases ? '- Include edge case testing' : ''}
${request.mockData ? '- Include mock data generation' : ''}

${frameworkInstructions[request.testFramework]}

Provide the response as JSON:

{
  "testCode": "Complete test file content",
  "framework": "${request.testFramework}",
  "testCount": 5,
  "coverageEstimate": 85,
  "mocksRequired": [
    {
      "name": "mockApiClient",
      "reason": "To isolate the unit from external API calls",
      "implementation": "jest.mock('./apiClient', () => ({ get: jest.fn() }))"
    }
  ],
  "edgeCases": [
    {
      "description": "Testing with null input",
      "testCase": "it('should handle null input gracefully', () => { ... })",
      "expectedBehavior": "Should return default value or throw appropriate error"
    }
  ],
  "plainEnglishExplanation": "This test suite covers the main functionality plus edge cases. The tests verify that the function correctly handles normal inputs, null values, and error conditions. Each test has a clear description of what is being verified.",
  "dependencies": ["jest", "@testing-library/react"] (if needed)
}

IMPORTANT: Ensure tests are production-ready with proper setup, teardown, and assertions.`;

    return prompt;
  }

  async generateUnitTests(
    sourceCode: string,
    language: string,
    framework: string = 'jest'
  ): Promise<TestGenerationResult> {
    return this.generateTests({
      sourceCode,
      language,
      testFramework: framework as any,
      testType: 'unit',
      edgeCases: true,
      mockData: true,
    });
  }

  async generateIntegrationTests(
    sourceCode: string,
    language: string,
    framework: string = 'jest'
  ): Promise<TestGenerationResult> {
    return this.generateTests({
      sourceCode,
      language,
      testFramework: framework as any,
      testType: 'integration',
      coverageTarget: 80,
    });
  }

  async detectEdgeCases(sourceCode: string, language: string): Promise<TestGenerationResult['edgeCases']> {
    const prompt = `Analyze the following ${language} code and identify all potential edge cases:

\`\`\`${language}
${sourceCode}
\`\`\`

For each edge case, provide:
1. A description of the edge case
2. The test case to verify it
3. The expected behavior

Return as JSON array:
[
  {
    "description": "Description of the edge case",
    "testCase": "it('should...', () => { ... })",
    "expectedBehavior": "What should happen"
  }
]

Focus on:
- Null/undefined inputs
- Empty values
- Boundary values
- Error conditions
- Race conditions
- Concurrency issues
- Large inputs
- Special characters
- Time-related edge cases`;

    return await aiAggregator.completeJSON(prompt, {
      provider: 'anthropic',
      model: 'smart',
      maxTokens: 3000,
    });
  }

  async generateMockData(
    dataType: string,
    format: 'json' | 'typescript' | 'factory' = 'json',
    count: number = 5
  ): Promise<string> {
    const prompt = `Generate ${count} mock ${dataType} data samples in ${format} format.

${format === 'json' ? 'JSON array:' : format === 'typescript' ? 'TypeScript interfaces:' : 'Factory function:'}

Make the data realistic and varied to cover different scenarios.`;

    const response = await aiAggregator.complete(prompt, {
      provider: 'openai',
      model: 'fast',
      maxTokens: 2000,
    });

    return response.content;
  }

  async explainTestFailure(
    testCode: string,
    errorMessage: string
  ): Promise<TestFailureExplanation> {
    const prompt = `A test failed with the following error:

**Test Code**:
\`\`\`
${testCode}
\`\`\`

**Error Message**:
\`\`\`
${errorMessage}
\`\`\`

Please provide:

1. rootCause: What caused the test to fail
2. fixSuggestion: Code snippet to fix the issue
3. explanation: Plain English explanation of what went wrong and how to fix it

Return as JSON:
{
  "testName": "Name of the failing test",
  "errorMessage": "${errorMessage}",
  "rootCause": "The actual cause of the failure",
  "fixSuggestion": "Code to fix the issue",
  "explanation": "Plain English explanation"
}`;

    return await aiAggregator.completeJSON(prompt, {
      provider: 'anthropic',
      model: 'smart',
      maxTokens: 1500,
    });
  }

  async suggestTestImprovements(
    existingTests: string,
    coverage: number
  ): Promise<string[]> {
    const prompt = `Review these tests with ${coverage}% coverage and suggest improvements:

\`\`\`
${existingTests}
\`\`\`

Suggest 5 specific, actionable improvements to increase coverage and test quality.`;

    const response = await aiAggregator.complete(prompt, {
      provider: 'anthropic',
      model: 'smart',
      maxTokens: 1500,
    });

    return response.content
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
  }
}

export const testIntelligence = new TestIntelligenceService();
export default TestIntelligenceService;
