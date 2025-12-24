import { AI_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ProjectFile } from '@vibe/shared';

export interface TDDRequest {
  requirement: string;
  language: string;
  framework?: string;
  existingCode?: string;
  testFramework?: string;
  coverageTarget?: number;
  additionalRequirements?: string[];
}

export interface TDDResult {
  testFileName: string;
  testContent: string;
  implementationHints: string[];
  edgeCases: string[];
  mockSuggestions: string[];
  coverage: {
    estimated: number;
    lines: number;
    branches: number;
    functions: number;
  };
  qualityScore: number;
}

export interface TDDStep {
  step: 'specification' | 'test_generation' | 'implementation' | 'refactoring';
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  output?: string;
}

export interface TDDProcess {
  id: string;
  projectId: string;
  requirement: string;
  steps: TDDStep[];
  currentStep: number;
  status: 'active' | 'completed' | 'failed';
  testContent?: string;
  implementationContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TDDGeneratorService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private activeProcesses: Map<string, TDDProcess> = new Map();

  constructor() {
    if (AI_CONFIG.primary.apiKey) {
      this.openai = new OpenAI({ apiKey: AI_CONFIG.primary.apiKey });
    }
    if (AI_CONFIG.alternative.apiKey) {
      this.anthropic = new Anthropic({ apiKey: AI_CONFIG.alternative.apiKey });
    }
    logger.info('TDDGeneratorService initialized');
  }

  /**
   * Start a TDD process - generate tests first, then implementation
   */
  async startTDDProcess(
    projectId: string,
    request: TDDRequest
  ): Promise<TDDProcess> {
    const processId = crypto.randomUUID();
    
    const process: TDDProcess = {
      id: processId,
      projectId,
      requirement: request.requirement,
      steps: [
        {
          step: 'specification',
          description: 'Analyze requirement and create specifications',
          status: 'in_progress',
        },
        {
          step: 'test_generation',
          description: 'Generate test cases based on specifications',
          status: 'pending',
        },
        {
          step: 'implementation',
          description: 'Implement code to pass the tests',
          status: 'pending',
        },
        {
          step: 'refactoring',
          description: 'Refactor for best practices and performance',
          status: 'pending',
        },
      ],
      currentStep: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeProcesses.set(processId, process);

    // Execute specification step
    try {
      await this.executeSpecificationStep(processId, request);
      await this.executeTestGenerationStep(processId, request);
      
      process.steps[0].status = 'completed';
      process.steps[1].status = 'completed';
      process.currentStep = 2;
      process.status = 'completed';
      process.updatedAt = new Date();

      logger.info('TDD process completed', { processId });
    } catch (error) {
      process.status = 'failed';
      process.updatedAt = new Date();
      logger.error('TDD process failed', { processId, error });
    }

    return process;
  }

  /**
   * Step 1: Analyze requirement and create specifications
   */
  private async executeSpecificationStep(
    processId: string,
    request: TDDRequest
  ): Promise<string> {
    const prompt = `Analyze the following requirement and create a detailed specification:

**Requirement**: ${request.requirement}
**Language**: ${request.language}
**Framework**: ${request.framework || 'Not specified'}
**Existing Code**: ${request.existingCode || 'No existing code'}

Provide a specification document with:
1. Function/method signatures
2. Input parameters and types
3. Return values and types
4. Edge cases to handle
5. Error conditions
6. Expected behavior

Format as a clear, structured specification.`;

    const specification = await this.generateWithAI(prompt, 'Analyze requirement and create detailed specifications for TDD process', 0.3);
    
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.steps[0].output = specification;
      process.steps[0].status = 'completed';
    }

    return specification;
  }

  /**
   * Step 2: Generate test cases based on specifications
   */
  private async executeTestGenerationStep(
    processId: string,
    request: TDDRequest
  ): Promise<TDDResult> {
    const testFramework = this.getTestFramework(request.language, request.testFramework);
    
    const prompt = `Generate comprehensive TDD-style tests for the following requirement:

**Requirement**: ${request.requirement}
**Language**: ${request.language}
**Framework**: ${request.framework || 'Not specified'}
**Test Framework**: ${testFramework.name}
${request.additionalRequirements ? `**Additional Requirements**: ${request.additionalRequirements.join(', ')}` : ''}

Generate tests following TDD principles:
1. Write failing tests FIRST
2. Cover happy path
3. Cover edge cases
4. Cover error conditions
5. Use descriptive test names
6. Follow AAA pattern (Arrange, Act, Assert)

Include:
- Unit tests for each function
- Integration tests if applicable
- Edge case tests
- Error handling tests

**Output Format** (JSON):
{
  "testFileName": "filename.test.ts",
  "testContent": "full test file content",
  "implementationHints": ["hint 1", "hint 2"],
  "edgeCases": ["edge case 1", "edge case 2"],
  "mockSuggestions": ["mock suggestion 1", "mock suggestion 2"],
  "coverage": {
    "estimated": 85,
    "lines": 50,
    "branches": 40,
    "functions": 10
  },
  "qualityScore": 90
}`;

    const result = await this.generateJSONWithAI<TDDResult>(prompt, 'Generate TDD tests', 0.4);
    
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.steps[1].output = JSON.stringify(result);
      process.testContent = result.testContent;
    }

    return result;
  }

  /**
   * Step 3: Implement code to pass the tests
   */
  async implementForTests(
    processId: string,
    testContent: string,
    language: string,
    framework?: string
  ): Promise<string> {
    const prompt = `Implement code that will pass the following tests:

**Tests**:
${testContent}

**Language**: ${language}
**Framework**: ${framework || 'Not specified'}

Requirements:
1. Implement ONLY what is needed to pass the tests
2. Write clean, production-ready code
3. Include proper error handling
4. Add JSDoc/TSDoc comments
5. Use meaningful variable names

Return the complete implementation file.`;

    const implementation = await this.generateWithAI(prompt, 'Implement code to pass tests', 0.3);
    
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.steps[2].status = 'completed';
      process.implementationContent = implementation;
    }

    return implementation;
  }

  /**
   * Step 4: Refactor for best practices
   */
  async refactorCode(
    code: string,
    language: string,
    focusArea: 'performance' | 'readability' | 'maintainability' = 'maintainability'
  ): Promise<string> {
    const focusPrompts = {
      performance: 'Focus on performance optimizations, reduce complexity, and improve efficiency.',
      readability: 'Focus on code readability, clear naming, and documentation.',
      maintainability: 'Focus on maintainability, loose coupling, and SOLID principles.',
    };

    const prompt = `Refactor the following code:

**Code**:
\`\`\`${language}
${code}
\`\`\`

**Focus**: ${focusArea}
${focusPrompts[focusArea]}

Provide the refactored code with improvements applied.`;

    return await this.generateWithAI(prompt, 'Refactor code', 0.4);
  }

  /**
   * Generate tests for existing code (Test-after approach)
   */
  async generateTestsForCode(
    code: string,
    language: string,
    framework?: string,
    coverageTarget: number = 80
  ): Promise<TDDResult> {
    const testFramework = this.getTestFramework(language, framework);

    const prompt = `Generate comprehensive tests for the following code:

\`\`\`${language}
${code}
\`\`\`

**Language**: ${language}
**Framework**: ${framework || 'Not specified'}
**Test Framework**: ${testFramework.name}
**Coverage Target**: ${coverageTarget}%

Generate tests following best practices:
1. Cover all public functions and methods
2. Test edge cases and boundary conditions
3. Mock external dependencies
4. Use AAA pattern (Arrange, Act, Assert)
5. Provide meaningful test descriptions

**Output Format** (JSON):
{
  "testFileName": "filename.test.ts",
  "testContent": "full test file content",
  "implementationHints": ["hint 1", "hint 2"],
  "edgeCases": ["edge case 1", "edge case 2"],
  "mockSuggestions": ["mock suggestion 1", "mock suggestion 2"],
  "coverage": {
    "estimated": 85,
    "lines": 50,
    "branches": 40,
    "functions": 10
  },
  "qualityScore": 90
}`;

    return await this.generateJSONWithAI<TDDResult>(prompt, 'Generate tests for code', 0.4);
  }

  /**
   * Analyze test coverage gap
   */
  async analyzeCoverageGap(
    code: string,
    tests: string,
    language: string
  ): Promise<{
    coverage: number;
    uncoveredLines: number[];
    uncoveredBranches: number[];
    suggestions: string[];
  }> {
    const prompt = `Analyze test coverage for the following code and tests:

**Code**:
\`\`\`${language}
${code}
\`\`\`

**Tests**:
\`\`\`${language}
${tests}
\`\`\`

Analyze:
1. Overall coverage estimate
2. Lines not covered by tests
3. Branch conditions not tested
4. Suggestions for improving coverage

**Output Format** (JSON):
{
  "coverage": 75,
  "uncoveredLines": [10, 15, 20],
  "uncoveredBranches": ["if (x > 0)"],
  "suggestions": ["Add test for x > 0 case", "Test null input"]
}`;

    return await this.generateJSONWithAI(prompt, 'Analyze test coverage', 0.3);
  }

  /**
   * Get test framework configuration
   */
  private getTestFramework(
    language: string,
    preferredFramework?: string
  ): { name: string; extensions: string[]; setupPattern: string } {
    const frameworks: Record<string, { name: string; extensions: string[]; setupPattern: string }> = {
      typescript: {
        name: 'Jest',
        extensions: ['.test.ts', '.spec.ts'],
        setupPattern: 'describe(),
  it(),
  expect()',
      },
      javascript: {
        name: 'Jest',
        extensions: ['.test.js', '.spec.js'],
        setupPattern: 'describe(),
  it(),
  expect()',
      },
      python: {
        name: 'pytest',
        extensions: ['.test.py', '_test.py'],
        setupPattern: 'def test_(),
  assert',
      },
      java: {
        name: 'JUnit 5',
        extensions: ['.Test.java', 'Test.java'],
        setupPattern: '@Test,
  assertEquals(),
  assertTrue()',
      },
      go: {
        name: 'testing',
        extensions: ['_test.go'],
        setupPattern: 'func TestX(t *testing.T)',
      },
    };

    const lang = language.toLowerCase();
    return frameworks[lang] || frameworks.typescript;
  }

  /**
   * Generate text using AI
   */
  private async generateWithAI(
    prompt: string,
    taskDescription: string,
    temperature: number = 0.7
  ): Promise<string> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: AI_CONFIG.primary.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert software engineer and TDD practitioner.
Your expertise includes:
- Writing comprehensive test cases
- Test-driven development methodology
- Multiple programming languages and frameworks
- Code coverage analysis
- Best practices for testing

Always follow TDD principles: Red, Green, Refactor.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: 8192,
        });
        return response.choices[0]?.message?.content || '';
      } else if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: AI_CONFIG.alternative.model || 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: 'You are an expert software engineer specializing in TDD and testing.',
          messages: [{ role: 'user', content: prompt }],
        });
        return response.content[0]?.type === 'text'
          ? response.content[0].text
          : '';
      }
    } catch (error) {
      logger.error(`AI generation failed for ${taskDescription}`, { error });
    }

    return `[AI generation unavailable - ${taskDescription}]`;
  }

  /**
   * Generate JSON response using AI
   */
  private async generateJSONWithAI<T>(
    prompt: string,
    taskDescription: string,
    temperature: number = 0.4
  ): Promise<T> {
    const response = await this.generateWithAI(
      `${prompt}\n\nRespond with valid JSON only.`,
      taskDescription,
      temperature
    );

    try {
      // Try to parse the response as JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error(`Failed to parse JSON for ${taskDescription}`, { error });
    }

    // Return default structure
    return {
      testFileName: 'test.spec.ts',
      testContent: '// Tests could not be generated',
      implementationHints: ['Check AI configuration'],
      edgeCases: [],
      mockSuggestions: [],
      coverage: { estimated: 0, lines: 0, branches: 0, functions: 0 },
      qualityScore: 0,
    } as unknown as T;
  }

  /**
   * Get active TDD process
   */
  getProcess(processId: string): TDDProcess | null {
    return this.activeProcesses.get(processId) || null;
  }

  /**
   * List all active processes
   */
  listProcesses(projectId?: string): TDDProcess[] {
    const processes = Array.from(this.activeProcesses.values());
    if (projectId) {
      return processes.filter(p => p.projectId === projectId);
    }
    return processes;
  }

  /**
   * Clean up old processes
   */
  cleanupOldProcesses(maxAgeMs: number = 3600000): number {
    const cutoff = new Date(Date.now() - maxAgeMs);
    let cleaned = 0;

    for (const [id, process] of this.activeProcesses) {
      if (process.createdAt < cutoff) {
        this.activeProcesses.delete(id);
        cleaned++;
      }
    }

    logger.info('Cleaned up old TDD processes', { count: cleaned });
    return cleaned;
  }
}

export const tddGeneratorService = new TDDGeneratorService();
export default TDDGeneratorService;
