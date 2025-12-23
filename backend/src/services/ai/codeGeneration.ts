import { AI_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface GenerationOptions {
  files?: Array<{ path: string; content: string; language?: string }>;
  techStack?: Record<string, unknown>;
  architecture?: Record<string, unknown>;
  language?: string;
  framework?: string;
  style?: Record<string, unknown>;
}

interface GenerationResult {
  content: string;
  files: Array<{ path: string; content: string; type: string }>;
  explanation: string;
  quality: {
    overall: number;
    categories: Record<string, number>;
  };
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
    cost: number;
  };
  model: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatOptions {
  projectName: string;
  techStack: Record<string, unknown>;
  architecture: Record<string, unknown>;
}

export class CodeGenerationService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (AI_CONFIG.primary.apiKey) {
      this.openai = new OpenAI({
        apiKey: AI_CONFIG.primary.apiKey,
      });
    }

    if (AI_CONFIG.alternative.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: AI_CONFIG.alternative.apiKey,
      });
    }
  }

  async generate(prompt: string, options: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = AI_CONFIG.primary.model;

    // Build context from options
    const context = this.buildContext(options);

    // Create system prompt
    const systemPrompt = this.createSystemPrompt(options);

    try {
      if (this.openai) {
        return await this.generateWithOpenAI(prompt, systemPrompt, context, startTime, model);
      } else if (this.anthropic) {
        return await this.generateWithAnthropic(prompt, systemPrompt, context, startTime, model);
      } else {
        // Fallback to mock generation for development
        return this.mockGeneration(prompt, startTime);
      }
    } catch (error) {
      logger.error('Code generation failed', { error, prompt: prompt.slice(0, 100) });
      throw error;
    }
  }

  private buildContext(options: GenerationOptions): string {
    let context = '';

    if (options.files && options.files.length > 0) {
      context += '\n\nExisting Files:\n';
      for (const file of options.files.slice(0, 10)) {
        context += `\n--- ${file.path} ---\n${file.content?.slice(0, 2000) || '(empty)'}`;
      }
    }

    if (options.techStack) {
      context += `\n\nTech Stack: ${JSON.stringify(options.techStack)}`;
    }

    if (options.architecture) {
      context += `\n\nArchitecture: ${JSON.stringify(options.architecture)}`;
    }

    return context;
  }

  private createSystemPrompt(options: GenerationOptions): string {
    let prompt = `You are an expert software engineer and architect. Your role is to help users build high-quality, production-ready software.

Your guidelines:
1. Write clean, maintainable, and well-documented code
2. Follow best practices for the selected language and framework
3. Implement proper error handling and validation
4. Write comprehensive tests
5. Consider security implications
6. Optimize for performance when needed
7. Use appropriate design patterns
8. Keep functions small and focused
9. Use meaningful variable and function names
10. Add comments for complex logic

Output format:
- Return code in markdown code blocks with language specification
- Include file paths in the code block header
- Provide explanations for architectural decisions
- Suggest improvements and alternatives`;

    if (options.language) {
      prompt += `\n\nFocus on ${options.language}`;
      if (options.framework) {
        prompt += ` with ${options.framework}`;
      }
    }

    if (options.style) {
      prompt += `\n\nStyle preferences: ${JSON.stringify(options.style)}`;
    }

    return prompt;
  }

  private async generateWithOpenAI(
    userPrompt: string,
    systemPrompt: string,
    context: string,
    startTime: number,
    model: string
  ): Promise<GenerationResult> {
    const fullPrompt = `${userPrompt}\n\n${context}`;

    const response = await this.openai!.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    });

    const completion = response.choices[0]?.message?.content || '';
    const tokens = response.usage;

    const result = this.parseResponse(completion);

    return {
      ...result,
      tokenUsage: {
        prompt: tokens?.prompt_tokens || 0,
        completion: tokens?.completion_tokens || 0,
        total: tokens?.total_tokens || 0,
        cost: this.calculateCost(model, tokens?.total_tokens || 0),
      },
      model,
      latency: Date.now() - startTime,
    };
  }

  private async generateWithAnthropic(
    userPrompt: string,
    systemPrompt: string,
    context: string,
    startTime: number,
    model: string
  ): Promise<GenerationResult> {
    const fullPrompt = `${userPrompt}\n\n${context}`;

    const response = await this.anthropic!.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: fullPrompt }],
    });

    const completion = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    const result = this.parseResponse(completion);

    return {
      ...result,
      tokenUsage: {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost(model, response.usage.input_tokens + response.usage.output_tokens),
      },
      model,
      latency: Date.now() - startTime,
    };
  }

  private parseResponse(content: string): Partial<GenerationResult> {
    // Parse files from markdown code blocks
    const fileRegex = /```(\w+)\s+([^\n]+)\n([\s\S]*?)```/g;
    const files: Array<{ path: string; content: string; type: string }> = [];
    let match;
    let explanation = '';

    // Extract explanation (text before first code block)
    const explanationMatch = content.split(/```/)[0];
    if (explanationMatch) {
      explanation = explanationMatch.trim();
    }

    while ((match = fileRegex.exec(content)) !== null) {
      const language = match[1];
      const path = match[2].trim();
      const fileContent = match[3].trim();

      const type = this.getFileType(path, language);
      files.push({ path, content: fileContent, type });
    }

    // Calculate quality score (simplified)
    const quality = this.assessQuality(files, explanation);

    return {
      content,
      files,
      explanation,
      quality,
    };
  }

  private getFileType(path: string, language: string): string {
    if (path.includes('.test.') || path.includes('.spec.')) return 'test';
    if (path.includes('.config.') || path.endsWith('config.js')) return 'config';
    if (path.endsWith('.md')) return 'documentation';
    if (['css', 'scss', 'less', 'styles'].some(ext => path.includes(`.${ext}`))) return 'style';
    return 'source';
  }

  private assessQuality(
    files: Array<{ path: string; content: string; type: string }>,
    explanation: string
  ): { overall: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {
      codeStyle: 0,
      documentation: 0,
      errorHandling: 0,
      security: 0,
      testing: 0,
    };

    for (const file of files) {
      const content = file.content;

      // Check for documentation
      if (content.includes('/**') || content.includes('///') || content.includes('#')) {
        categories.documentation += 1;
      }

      // Check for error handling
      if (content.includes('try') && content.includes('catch')) {
        categories.errorHandling += 1;
      }

      // Check for tests
      if (file.type === 'test') {
        categories.testing += 1;
      }

      // Check for security patterns
      if (content.includes('sanitize') || content.includes('escape') || !content.includes('eval(')) {
        categories.security += 1;
      }
    }

    // Calculate overall score
    const scores = Object.values(categories);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    categories.codeStyle = Math.min(10, files.length); // Assume good style if files are generated

    return {
      overall: Math.min(100, Math.round(avgScore * 10)),
      categories,
    };
  }

  private calculateCost(model: string, tokens: number): number {
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 5, output: 15 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'claude-sonnet-4-20250514': { input: 3, output: 15 },
    };

    const cost = costs[model] || costs['gpt-4o'];
    return (tokens / 1000000) * ((cost.input + cost.output) / 2);
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<{
    content: string;
    tokens: number;
    model: string;
  }> {
    const systemPrompt = `You are Vibe Mentor, an AI assistant helping with software engineering.

Project: ${options.projectName}
Tech Stack: ${JSON.stringify(options.techStack)}
Architecture: ${JSON.stringify(options.architecture)}

Be helpful, educational, and encouraging. Explain concepts clearly and help developers learn.`;

    const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: AI_CONFIG.primary.model,
          messages: allMessages as any,
          temperature: 0.7,
          max_tokens: 4096,
        });

        return {
          content: response.choices[0]?.message?.content || '',
          tokens: response.usage?.total_tokens || 0,
          model: AI_CONFIG.primary.model,
        };
      }
    } catch (error) {
      logger.error('Chat failed', { error });
    }

    // Fallback
    return {
      content: "I'm here to help! What would you like to learn about?",
      tokens: 20,
      model: 'fallback',
    };
  }

  private mockGeneration(prompt: string, startTime: number): GenerationResult {
    // Mock response for development without API keys
    return {
      content: `\`\`\`typescript
// Generated based on: ${prompt.slice(0, 50)}...

export function helloWorld(): string {
  return 'Hello, Vibe Engineering!';
}
\`\`\``,
      files: [
        {
          path: 'src/hello.ts',
          content: `export function helloWorld(): string {
  return 'Hello, Vibe Engineering!';
}`,
          type: 'source',
        },
      ],
      explanation: 'This is a mock generation. Add API keys to enable real AI generation.',
      quality: { overall: 70, categories: { codeStyle: 7, documentation: 5, errorHandling: 6, security: 7, testing: 5 } },
      tokenUsage: { prompt: 50, completion: 50, total: 100, cost: 0 },
      model: 'mock',
      latency: Date.now() - startTime,
    };
  }
}
