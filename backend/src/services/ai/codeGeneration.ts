import { AI_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as Diff from 'diff';

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
  diffApplied?: boolean;
}

interface DiffGenerationOptions extends GenerationOptions {
  existingFiles?: Map<string, string>;
}

interface DiffResult {
  success: boolean;
  patch: string;
  filesChanged: number;
  hunks: Diff.Hunk[];
  appliedFiles: Array<{ path: string; status: 'added' | 'modified' | 'unchanged' }>;
  error?: string;
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

    const context = this.buildContext(options);
    const systemPrompt = this.createSystemPrompt(options);

    try {
      if (this.openai) {
        return await this.generateWithOpenAI(prompt, systemPrompt, context, startTime, model);
      } else if (this.anthropic) {
        return await this.generateWithAnthropic(prompt, systemPrompt, context, startTime, model);
      } else {
        return this.mockGeneration(prompt, startTime);
      }
    } catch (error) {
      logger.error('Code generation failed', { error, prompt: prompt.slice(0, 100) });
      throw error;
    }
  }

  /**
   * Generate diff-based changes for existing files
   */
  async generateWithDiff(
    prompt: string,
    existingFiles: Map<string, string>,
    options: GenerationOptions
  ): Promise<DiffResult> {
    const startTime = Date.now();
    logger.info('Starting diff-based code generation', { 
      fileCount: existingFiles.size,
      prompt: prompt.slice(0, 100),
    });

    // Build context with existing file contents
    const context = this.buildDiffContext(existingFiles, options);
    const systemPrompt = this.createDiffSystemPrompt(options);

    try {
      let response: string;
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: AI_CONFIG.primary.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${prompt}\n\n${context}` },
          ],
          temperature: 0.3,
          max_tokens: 8192,
        });
        response = completion.choices[0]?.message?.content || '';
      } else if (this.anthropic) {
        const completion = await this.anthropic.messages.create({
          model: AI_CONFIG.alternative.model || 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: `${prompt}\n\n${context}` }],
        });
        response = completion.content[0]?.type === 'text'
          ? completion.content[0].text
          : '';
      } else {
        response = this.mockDiffResponse(existingFiles, prompt);
      }

      // Parse the response and apply diff
      return this.applyDiff(response, existingFiles, startTime);
    } catch (error) {
      logger.error('Diff-based generation failed', { error });
      return {
        success: false,
        patch: '',
        filesChanged: 0,
        hunks: [],
        appliedFiles: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build context for diff-based generation
   */
  private buildDiffContext(existingFiles: Map<string, string>, options: GenerationOptions): string {
    let context = '## Existing Files Context\n\n';

    for (const [path, content] of existingFiles) {
      context += `--- ${path} ---\n${content.slice(0, 3000)}\n\n`;
    }

    if (options.techStack) {
      context += `\nTech Stack: ${JSON.stringify(options.techStack)}`;
    }

    if (options.architecture) {
      context += `\nArchitecture: ${JSON.stringify(options.architecture)}`;
    }

    context += '\n\n## Output Format\n';
    context += 'When modifying existing files, provide your changes using Unified Diff format:\n';
    context += '```diff\n';
    context += '--- a/path/to/file.ts\n';
    context += '+++ b/path/to/file.ts\n';
    context += '@@ -1,5 +1,7 @@\n';
    context += ' // Context before\n';
    context += '+New line added\n';
    context += ' // Context after\n';
    context += '-Line removed\n';
    context += '```\n\n';
    context += 'For new files, provide the complete file content in a code block.\n';

    return context;
  }

  /**
   * Create system prompt for diff-based generation
   */
  private createDiffSystemPrompt(options: GenerationOptions): string {
    let prompt = `You are an expert software engineer specializing in precise, surgical code modifications.

Your guidelines for DIFF-BASED changes:
1. MINIMIZE changes - only modify what is necessary
2. PRESERVE comments, formatting, and structure of existing code
3. PRESERVE imports and dependencies - never remove them
4. ADD new imports at the top of the file
5. FOLLOW the existing code style and patterns
6. KEEP functions small and focused
7. ADD meaningful variable names
8. INCLUDE comments for complex logic

For modifications:
- Use Unified Diff format (--- a/..., +++ b/..., @@ old @@, +, -)
- Preserve surrounding context
- Make minimal, targeted changes
- Never rewrite entire files unless explicitly requested

For new files:
- Return full file content in a markdown code block with the file path`;

    if (options.language) {
      prompt += `\n\nFocus on ${options.language}`;
      if (options.framework) {
        prompt += ` with ${options.framework}`;
      }
    }

    return prompt;
  }

  /**
   * Apply diff to existing files
   */
  private applyDiff(
    response: string,
    existingFiles: Map<string, string>,
    startTime: number
  ): DiffResult {
    const appliedFiles: Array<{ path: string; status: 'added' | 'modified' | 'unchanged' }> = [];
    const hunks: Diff.Hunk[] = [];

    // Extract diff blocks from response
    const diffBlockRegex = /```diff\s*\n([\s\S]*?)\n```/g;
    const fileBlockRegex = /```(\w+)\s+([^\n]+)\n([\s\S]*?)```/g;

    let patch = '';
    let match;

    // Collect all diff patches
    while ((match = diffBlockRegex.exec(response)) !== null) {
      patch += match[1] + '\n';
    }

    // Parse and apply patches
    if (patch) {
      try {
        const patches = Diff.parsePatch(patch);
        
        for (const filePatch of patches) {
          const originalContent = existingFiles.get(filePatch.oldFileName || filePatch.newFileName || '') || '';
          const result = Diff.applyPatch(originalContent, filePatch);
          
          if (result !== false) {
            const path = filePatch.newFileName || filePatch.oldFileName || '';
            existingFiles.set(path, result);
            
            appliedFiles.push({
              path,
              status: originalContent ? 'modified' : 'added',
            });
            
            if (filePatch.hunks) {
              hunks.push(...filePatch.hunks);
            }
          }
        }
      } catch (error) {
        logger.error('Failed to apply diff patch', { error });
      }
    }

    // Handle new files (not in diff format)
    while ((match = fileBlockRegex.exec(response)) !== null) {
      const language = match[1];
      const path = match[2].trim();
      const content = match[3].trim();

      // Skip if this file was already handled as a diff
      if (appliedFiles.find(f => f.path === path)) continue;
      if (language === 'diff') continue;

      // This is a new file
      if (!existingFiles.has(path)) {
        existingFiles.set(path, content);
        appliedFiles.push({ path, status: 'added' });
      }
    }

    logger.info('Diff application completed', {
      filesChanged: appliedFiles.length,
      hunksCount: hunks.length,
      latency: Date.now() - startTime,
    });

    return {
      success: appliedFiles.length > 0,
      patch,
      filesChanged: appliedFiles.length,
      hunks,
      appliedFiles,
    };
  }

  /**
   * Generate a patch for a specific file modification
   */
  async generateFilePatch(
    filePath: string,
    currentContent: string,
    instructions: string,
    language: string
  ): Promise<{ patch: string; modifiedContent: string } | null> {
    const prompt = `Modify the file at "${filePath}" according to these instructions:

${instructions}

## Current file content:
\`\`\`${language}
${currentContent}
\`\`\`

## Output format:
Provide your changes in Unified Diff format showing exactly what will change.`;

    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: AI_CONFIG.primary.model,
          messages: [
            { 
              role: 'system', 
              content: `You are an expert software engineer. 
Your task is to generate precise, minimal diffs for file modifications.
Follow the existing code style and patterns.
Preserve all existing functionality and comments.` 
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 4096,
        });

        const content = response.choices[0]?.message?.content || '';
        const patchMatch = content.match(/```diff\n([\s\S]*?)\n```/);

        if (patchMatch) {
          const patch = patchMatch[1];
          const result = Diff.applyPatch(currentContent, patch);
          
          if (result !== false) {
            return { patch, modifiedContent: result };
          }
        }
      }
    } catch (error) {
      logger.error('Failed to generate file patch', { error, filePath });
    }

    return null;
  }

  /**
   * Validate that a generated patch is safe to apply
   */
  validatePatch(patch: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const patches = Diff.parsePatch(patch);

    for (const filePatch of patches) {
      // Check for destructive operations
      const deletions = patch.split('-').length - 1;
      const additions = patch.split('+').length - 1;
      
      // Flag if more than 50% of a file is being deleted
      if (filePatch.hunks) {
        for (const hunk of filePatch.hunks) {
          if (hunk.oldLines > 100 && deletions > additions * 2) {
            issues.push(`Large deletion detected in ${filePatch.oldFileName} - verify this is intentional`);
          }
        }
      }

      // Check for risky operations
      if (patch.includes('rm -rf') || patch.includes('deltree')) {
        issues.push('Potentially destructive delete operation detected');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
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
      diffApplied: false,
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
      diffApplied: false,
    };
  }

  private parseResponse(content: string): Partial<GenerationResult> {
    const fileRegex = /```(\w+)\s+([^\n]+)\n([\s\S]*?)```/g;
    const files: Array<{ path: string; content: string; type: string }> = [];
    let match;
    let explanation = '';

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

      if (content.includes('/**') || content.includes('///') || content.includes('#')) {
        categories.documentation += 1;
      }

      if (content.includes('try') && content.includes('catch')) {
        categories.errorHandling += 1;
      }

      if (file.type === 'test') {
        categories.testing += 1;
      }

      if (content.includes('sanitize') || content.includes('escape') || !content.includes('eval(')) {
        categories.security += 1;
      }
    }

    const scores = Object.values(categories);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    categories.codeStyle = Math.min(10, files.length);

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

  private mockDiffResponse(existingFiles: Map<string, string>, prompt: string): string {
    // Mock response for development
    return `I can help with that modification. Here's the diff:

\`\`\`diff
--- a/src/example.ts
+++ b/src/example.ts
@@ -1,3 +1,5 @@
+// Added by Vibe AI
 export function example(): string {
-  return 'old';
+  return 'new';
 }
\`\`\``;
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

    return {
      content: "I'm here to help! What would you like to learn about?",
      tokens: 20,
      model: 'fallback',
    };
  }

  private mockGeneration(prompt: string, startTime: number): GenerationResult {
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
      diffApplied: false,
    };
  }
}

export const codeGenerationService = new CodeGenerationService();
export default CodeGenerationService;
