import { aiAggregator } from './aiAggregator';
import { logger } from '../utils/logger';
import { ProjectFile } from '@vibe/shared';

export interface DocumentationRequest {
  projectName: string;
  description: string;
  techStack: Record<string, string>;
  architecture: Record<string, unknown>;
  files: ProjectFile[];
  language?: string;
}

export interface ReadmeSection {
  title: string;
  content: string;
  order: number;
}

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses?: Array<{
    status: number;
    description: string;
    schema?: string;
  }>;
  tags?: string[];
}

export interface APIDocumentation {
  title: string;
  version: string;
  description: string;
  baseUrl?: string;
  endpoints: APIEndpoint[];
  models?: Record<string, {
    properties: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
    required?: string[];
  }>;
}

export interface DocumentationResult {
  readme: string;
  apiDocs?: APIDocumentation;
  architectureDocs?: string;
  changes: Array<{
    file: string;
    action: 'created' | 'updated';
    section?: string;
  }>;
}

export class DocumentationService {
  private systemPrompt = `You are a Technical Documentation Expert with 15+ years of experience creating clear, comprehensive documentation for software projects.
Your expertise includes:
- Writing READMEs that get developers started quickly
- Creating API documentation (OpenAPI/Swagger compatible)
- Documenting architecture decisions
- Keeping docs in sync with code changes
- Using clear, concise language
- Including practical examples

You always:
- Start with the most important information
- Use consistent formatting
- Include code examples
- Link related concepts
- Provide actionable next steps`;

  /**
   * Generate comprehensive project documentation
   */
  async generateDocumentation(request: DocumentationRequest): Promise<DocumentationResult> {
    logger.info('Starting documentation generation', { projectName: request.projectName });

    const fileContents = this.extractFileContents(request.files);
    const readme = await this.generateReadme(request, fileContents);
    const apiDocs = await this.generateAPIDocs(request.files);
    const architectureDocs = await this.generateArchitectureDocs(request);

    return {
      readme,
      apiDocs,
      architectureDocs,
      changes: [
        { file: 'README.md', action: 'created', section: 'Main documentation' },
        ...(apiDocs ? [{ file: 'API.md', action: 'created', section: 'API Reference' }] : []),
        ...(architectureDocs ? [{ file: 'ARCHITECTURE.md', action: 'created', section: 'Architecture' }] : []),
      ],
    };
  }

  /**
   * Generate README.md content
   */
  async generateReadme(request: DocumentationRequest, fileContents: string): Promise<string> {
    const prompt = `Generate a comprehensive README.md for this project:

**Project Name**: ${request.projectName}
**Description**: ${request.description}
**Tech Stack**:
${Object.entries(request.techStack).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

**File Structure**:
${fileContents.slice(0, 5000)}

Please generate a README with these sections:
1. Project Overview (2-3 sentences)
2. Features (bullet points)
3. Tech Stack with versions
4. Getting Started (installation, setup, running)
5. Project Structure (folder explanation)
6. API Documentation (if applicable)
7. Contributing Guidelines
8. License

Format as clean Markdown. Be concise but comprehensive. Include code snippets where helpful.`;

    const readme = await aiAggregator.completeText(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.3,
      maxTokens: 4000,
      systemPrompt: this.systemPrompt,
    });

    return readme;
  }

  /**
   * Generate API documentation from code
   */
  async generateAPIDocs(files: ProjectFile[]): Promise<APIDocumentation | null> {
    // Extract API-related files
    const apiFiles = files.filter(f => 
      f.path.includes('route') || 
      f.path.includes('controller') ||
      f.path.includes('endpoint') ||
      f.path.includes('api')
    );

    if (apiFiles.length === 0) {
      return null;
    }

    const fileContents = apiFiles.map(f => 
      `--- ${f.path} ---\n${f.content || ''}`
    ).join('\n\n');

    const prompt = `Analyze the following code and extract API endpoints in this JSON format:

{
  "endpoints": [
    {
      "path": "/api/users",
      "method": "GET",
      "description": "Retrieve all users",
      "parameters": [
        {"name": "page", "type": "number", "required": false, "description": "Page number"}
      ],
      "responses": [
        {"status": 200, "description": "Successful response"}
      ],
      "tags": ["Users"]
    }
  ],
  "models": {
    "User": {
      "properties": [
        {"name": "id", "type": "string", "description": "Unique identifier"},
        {"name": "email", "type": "string", "description": "User email"}
      ],
      "required": ["id", "email"]
    }
  }
}

Code to analyze:
${fileContents.slice(0, 8000)}

Respond with valid JSON only. Extract all routes, controllers, and API patterns.`;

    const result = await aiAggregator.completeJSON<{
      endpoints: APIEndpoint[];
      models?: Record<string, any>;
    }>(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.2,
      maxTokens: 3000,
    });

    return {
      title: 'API Reference',
      version: '1.0.0',
      description: 'Auto-generated API documentation',
      endpoints: result.endpoints || [],
      models: result.models,
    };
  }

  /**
   * Generate architecture documentation
   */
  async generateArchitectureDocs(request: DocumentationRequest): Promise<string> {
    const prompt = `Generate architecture documentation for this project:

**Project**: ${request.projectName}
**Description**: ${request.description}
**Tech Stack**: ${JSON.stringify(request.techStack)}
**Architecture**: ${JSON.stringify(request.architecture)}

Provide a markdown document covering:
1. System Overview
2. Architecture Diagram (use mermaid syntax)
3. Component descriptions
4. Data Flow
5. Technology choices and rationale
6. Scalability considerations
7. Security measures

Use clear formatting with headers, lists, and code blocks.`;

    const docs = await aiAggregator.completeText(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.4,
      maxTokens: 3000,
    });

    return docs;
  }

  /**
   * Update documentation when code changes
   */
  async updateDocumentationOnChange(
    projectId: string,
    changedFiles: ProjectFile[],
    currentReadme: string
  ): Promise<{ updatedReadme: string; changes: string[] }> {
    const changes: string[] = [];
    
    const fileContents = changedFiles
      .map(f => `Changed: ${f.path}\n${f.content?.slice(0, 500) || ''}`)
      .join('\n\n');

    // Check if README needs updates based on file changes
    const prompt = `The README for this project may need updates based on recent code changes.

**Current README (first 2000 chars)**:
${currentReadme.slice(0, 2000)}

**Changed Files**:
${fileContents}

Analyze the changes and provide an updated README if needed. Focus on:
1. Updated features list
2. New API endpoints
3. Changed configuration
4. New setup requirements

If no updates are needed, respond with "NO_CHANGES_NEEDED".
Otherwise, provide the full updated README content.`;

    const updatedReadme = await aiAggregator.completeText(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.3,
      maxTokens: 4000,
    });

    if (updatedReadme !== 'NO_CHANGES_NEEDED') {
      changes.push('README.md updated based on code changes');
    }

    return { updatedReadme: updatedReadme === 'NO_CHANGES_NEEDED' ? currentReadme : updatedReadme, changes };
  }

  /**
   * Generate changelog from git-like changes
   */
  async generateChangelog(
    projectName: string,
    changes: Array<{
      type: 'feature' | 'fix' | 'docs' | 'refactor' | 'test';
      description: string;
      files: string[];
    }>
  ): Promise<string> {
    const prompt = `Generate a changelog for ${projectName} based on these changes:

${changes.map(c => `- **${c.type.toUpperCase()}**: ${c.description}`).join('\n')}

Format as:

# Changelog

## [Unreleased]

### Added
- (list of new features)

### Fixed
- (list of bug fixes)

### Changed
- (list of changes)

### Removed
- (list of removed features)

Use semantic versioning conventions. Be concise but informative.`;

    const changelog = await aiAggregator.completeText(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.3,
      maxTokens: 1500,
    });

    return changelog;
  }

  /**
   * Extract code examples from files
   */
  extractCodeExamples(files: ProjectFile[]): Record<string, string[]> {
    const examples: Record<string, string[]> = {};

    for (const file of files) {
      if (!file.content) continue;

      // Look for JSDoc comments that might indicate examples
      const jsdocRegex = /```(?:typescript|javascript|js|ts)\s*([\s\S]*?)```/g;
      const inlineExamples = file.content.match(/@example\s+([^\n]+)/g);

      if (inlineExamples) {
        examples[file.path] = inlineExamples.map(e => e.replace('@example', '').trim());
      }
    }

    return examples;
  }

  /**
   * Generate contribution guide
   */
  async generateContributionGuide(
    projectName: string,
    techStack: Record<string, string>
  ): Promise<string> {
    const prompt = `Generate a contribution guide for ${projectName} using:
- Frontend: ${techStack.frontend || 'Not specified'}
- Backend: ${techStack.backend || 'Not specified'}
- Database: ${techStack.database || 'Not specified'}

Include:
1. Prerequisites
2. Setting up development environment
3. Coding standards
4. Commit message conventions
5. Pull request process
6. Testing requirements
7. Code review checklist

Format as a professional CONTRIBUTING.md guide.`;

    return await aiAggregator.completeText(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.4,
      maxTokens: 2000,
    });
  }

  /**
   * Extract file contents for context
   */
  private extractFileContents(files: ProjectFile[]): string {
    return files
      .filter(f => f.type === 'FILE')
      .slice(0, 20)
      .map(f => {
        const depth = f.path.split('/').length;
        const indent = '  '.repeat(depth - 1);
        return `${indent}📄 ${f.path}`;
      })
      .join('\n');
  }

  /**
   * Generate OpenAPI spec from API documentation
   */
  generateOpenAPISpec(apiDocs: APIDocumentation): Record<string, unknown> {
    return {
      openapi: '3.0.3',
      info: {
        title: apiDocs.title,
        version: apiDocs.version,
        description: apiDocs.description,
      },
      servers: apiDocs.baseUrl ? [{ url: apiDocs.baseUrl }] : [],
      paths: apiDocs.endpoints.reduce((acc, endpoint) => {
        const path = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`;
        acc[path] = acc[path] || {};
        acc[path][endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          tags: endpoint.tags || ['Default'],
          parameters: endpoint.parameters?.map(p => ({
            name: p.name,
            in: 'query',
            required: p.required,
            schema: { type: p.type },
            description: p.description,
          })),
          responses: endpoint.responses?.reduce((respAcc, r) => {
            respAcc[r.status] = { description: r.description };
            return respAcc;
          }, {} as Record<string, unknown>),
        };
        return acc;
      }, {} as Record<string, unknown>),
      components: {
        schemas: apiDocs.models,
      },
    };
  }
}

export const documentationService = new DocumentationService();
export default DocumentationService;
