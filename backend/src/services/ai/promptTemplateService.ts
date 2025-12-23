import { logger } from '../utils/logger';
import { aiAggregator } from './aiAggregator';

export interface PromptVariable {
  name: string;
  label: string;
  type: 'text' | 'code' | 'select' | 'textarea';
  required: boolean;
  default?: string;
  options?: string[];
  placeholder?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  role: 'Architect' | 'Developer' | 'Tester' | 'Security' | 'Custom';
  content: string;
  variables: PromptVariable[];
  isSystem: boolean;
  userId?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  role: 'Architect' | 'Developer' | 'Tester' | 'Security' | 'Custom';
  content: string;
  variables: PromptVariable[];
  userId?: string;
  projectId?: string;
}

export interface TemplateSearchInput {
  role?: string;
  search?: string;
  userId?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

interface DatabaseTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  content: string;
  variables: string;
  is_system: boolean;
  user_id: string;
  project_id: string;
  created_at: Date;
  updated_at: Date;
}

export class PromptTemplateService {
  private variableRegex = /\{\{([^}]+)\}\}/g;

  /**
   * Parse variables from template content
   * Extracts {{variable_name}} patterns and converts to variable objects
   */
  parseVariablesFromContent(content: string): PromptVariable[] {
    const variables: PromptVariable[] = [];
    let match;

    while ((match = this.variableRegex.exec(content)) !== null) {
      const name = match[1].trim();
      
      // Check if already added
      if (variables.find(v => v.name === name)) continue;

      // Auto-detect variable type based on context
      const type = this.detectVariableType(name, content);
      
      variables.push({
        name,
        label: this.formatLabel(name),
        type,
        required: true,
        placeholder: `Enter ${this.formatLabel(name).toLowerCase()}`,
      });
    }

    return variables;
  }

  /**
   * Detect variable type based on naming conventions
   */
  private detectVariableType(name: string, context: string): PromptVariable['type'] {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('code') || lowerName.includes('snippet') || lowerName.includes('implementation')) {
      return 'code';
    }
    if (lowerName.includes('description') || lowerName.includes('context') || lowerName.includes('requirements')) {
      return 'textarea';
    }
    if (lowerName.includes('language') || lowerName.includes('framework') || lowerName.includes('type')) {
      return 'select';
    }
    
    return 'text';
  }

  /**
   * Format variable name as readable label
   */
  private formatLabel(name: string): string {
    return name
      .replace(/[-_]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Interpolate variables into template content
   */
  interpolateContent(content: string, variables: Record<string, string>): string {
    return content.replace(this.variableRegex, (match, varName) => {
      const key = varName.trim();
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Create a new prompt template
   */
  async create(input: CreateTemplateInput): Promise<PromptTemplate> {
    const variables = this.parseVariablesFromContent(input.content);

    logger.info('Creating new prompt template', { name: input.name, role: input.role });

    // In a real implementation, this would insert into the database
    const template: PromptTemplate = {
      id: crypto.randomUUID(),
      ...input,
      variables,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return template;
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<PromptTemplate | null> {
    logger.debug('Fetching template by ID', { id });

    // Mock implementation - would query database
    return null;
  }

  /**
   * Search and list templates
   */
  async search(input: TemplateSearchInput): Promise<{ templates: PromptTemplate[]; total: number }> {
    const { role, search, limit = 20, offset = 0 } = input;

    logger.debug('Searching templates', { role, search, limit, offset });

    // Mock implementation - would query database with filters
    // Return system templates by default
    const systemTemplates = this.getSystemTemplates();
    
    let filtered = systemTemplates;
    
    if (role) {
      filtered = filtered.filter(t => t.role === role);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }

    return {
      templates: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  /**
   * Get system templates (pre-defined templates)
   */
  getSystemTemplates(): PromptTemplate[] {
    return [
      // Architect Templates
      {
        id: 'arch-001',
        name: 'System Architecture Design',
        description: 'Generate a comprehensive system architecture for a project',
        role: 'Architect',
        content: `# System Architecture Design for {{project_name}}

## Project Overview
{{project_description}}

## Requirements
{{requirements}}

## Constraints
{{constraints}}

Please provide:
1. Architecture Overview
2. Tech Stack Recommendations
3. Folder Structure
4. API Design
5. Data Model
6. Scalability Considerations
7. Security Architecture
8. Deployment Strategy`,
        variables: [
          { name: 'project_name', label: 'Project Name', type: 'text', required: true },
          { name: 'project_description', label: 'Project Description', type: 'textarea', required: true },
          { name: 'requirements', label: 'Requirements', type: 'textarea', required: true },
          { name: 'constraints', label: 'Constraints', type: 'textarea', required: false },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'arch-002',
        name: 'API Design Review',
        description: 'Review and improve API design',
        role: 'Architect',
        content: `# API Design Review

## Current API Specification
{{api_specification}}

## Context
{{api_context}}

Please review for RESTful compliance, URL structure, response consistency, and best practices.`,
        variables: [
          { name: 'api_specification', label: 'API Specification', type: 'code', required: true },
          { name: 'api_context', label: 'API Context', type: 'textarea', required: true },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Developer Templates
      {
        id: 'dev-001',
        name: 'Code Generation',
        description: 'Generate production-ready code from specifications',
        role: 'Developer',
        content: `# Code Generation Request

## Task Description
{{task_description}}

## Technical Context
- Language: {{language}}
- Framework: {{framework}}
- Project Type: {{project_type}}

## Requirements
{{requirements}}

Please generate clean, production-ready code with proper error handling, type safety, and documentation.`,
        variables: [
          { name: 'task_description', label: 'Task Description', type: 'textarea', required: true },
          { name: 'language', label: 'Language', type: 'select', required: true, options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C#'] },
          { name: 'framework', label: 'Framework', type: 'text', required: true },
          { name: 'project_type', label: 'Project Type', type: 'select', required: true, options: ['API', 'CLI', 'Library', 'Web App', 'Mobile App'] },
          { name: 'requirements', label: 'Requirements', type: 'textarea', required: true },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'dev-002',
        name: 'Code Refactoring',
        description: 'Refactor existing code for better maintainability',
        role: 'Developer',
        content: `# Code Refactoring Request

## Target Code
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

## Current Issues
{{issues_description}}

## Refactoring Goals
{{refactoring_goals}}

Please analyze and refactor for improved readability, reduced complexity, and better maintainability.`,
        variables: [
          { name: 'language', label: 'Language', type: 'select', required: true, options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C#'] },
          { name: 'code_snippet', label: 'Code Snippet', type: 'code', required: true },
          { name: 'issues_description', label: 'Issues Description', type: 'textarea', required: true },
          { name: 'refactoring_goals', label: 'Refactoring Goals', type: 'textarea', required: true },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Tester Templates
      {
        id: 'test-001',
        name: 'Unit Test Generation',
        description: 'Generate comprehensive unit tests',
        role: 'Tester',
        content: `# Unit Test Generation

## Target Code
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

## Test Scope
{{test_scope}}

## Requirements
- Framework: {{test_framework}}
- Cover happy path, edge cases, and error handling
- Use realistic test data

Please generate complete unit tests.`,
        variables: [
          { name: 'language', label: 'Language', type: 'select', required: true, options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C#'] },
          { name: 'code_snippet', label: 'Code Snippet', type: 'code', required: true },
          { name: 'test_scope', label: 'Test Scope', type: 'textarea', required: true },
          { name: 'test_framework', label: 'Test Framework', type: 'text', required: true },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'test-002',
        name: 'Integration Test Design',
        description: 'Design integration tests for API endpoints',
        role: 'Tester',
        content: `# Integration Test Design

## API Endpoint Under Test
{{endpoint_specification}}

## Test Scenarios
1. Success cases with valid input
2. Authentication/authorization failures
3. Input validation errors
4. Business logic edge cases
5. Error handling

Please provide complete integration test code.`,
        variables: [
          { name: 'endpoint_specification', label: 'Endpoint Specification', type: 'code', required: true },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Security Templates
      {
        id: 'sec-001',
        name: 'Security Audit',
        description: 'Comprehensive security review of code',
        role: 'Security',
        content: `# Security Audit

## Code Under Review
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

## Audit Scope
{{audit_scope}}

## Security Checklist
1. Injection attacks (SQL, Command, LDAP)
2. Authentication & authorization
3. Data exposure & encryption
4. Access control (IDOR, path traversal)
5. Security misconfiguration

Please provide a detailed security assessment with risk ratings.`,
        variables: [
          { name: 'language', label: 'Language', type: 'select', required: true, options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C#'] },
          { name: 'code_snippet', label: 'Code Snippet', type: 'code', required: true },
          { name: 'audit_scope', label: 'Audit Scope', type: 'textarea', required: true },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'sec-002',
        name: 'OWASP Top 10 Verification',
        description: 'Verify code against OWASP Top 10 vulnerabilities',
        role: 'Security',
        content: `# OWASP Top 10 Security Verification

## Code Review Target
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

## Application Context
{{application_context}}

Verify against:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Identification & Authentication
- A08: Software & Data Integrity
- A09: Security Logging
- A10: Server-Side Request Forgery

Provide pass/fail status and remediation items.`,
        variables: [
          { name: 'language', label: 'Language', type: 'select', required: true, options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C#'] },
          { name: 'code_snippet', label: 'Code Snippet', type: 'code', required: true },
          { name: 'application_context', label: 'Application Context', type: 'textarea', required: true },
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Get templates by role
   */
  getTemplatesByRole(role: string): PromptTemplate[] {
    const templates = this.getSystemTemplates();
    return templates.filter(t => t.role === role);
  }

  /**
   * Update template
   */
  async update(id: string, updates: Partial<CreateTemplateInput>): Promise<PromptTemplate | null> {
    logger.info('Updating template', { id });

    // Mock implementation - would update in database
    const template = this.getSystemTemplates().find(t => t.id === id);
    if (!template) return null;

    return {
      ...template,
      ...updates,
      variables: updates.content ? this.parseVariablesFromContent(updates.content) : template.variables,
      updatedAt: new Date(),
    };
  }

  /**
   * Delete template
   */
  async delete(id: string): Promise<boolean> {
    logger.info('Deleting template', { id });

    // Mock implementation - would delete from database
    return true;
  }

  /**
   * Clone an existing template
   */
  async clone(id: string, userId: string): Promise<PromptTemplate | null> {
    const original = this.getSystemTemplates().find(t => t.id === id);
    if (!original) return null;

    return {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      isSystem: false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export const promptTemplateService = new PromptTemplateService();
export default PromptTemplateService;
