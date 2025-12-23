import { logger } from '../utils/logger';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokenCount?: number;
    model?: string;
    templateUsed?: string;
  };
}

export interface ProjectMemory {
  id: string;
  projectId: string;
  conversationHistory: ConversationMessage[];
  contextSummary: string;
  systemPrompt: string;
  lastUpdated: Date;
  createdAt: Date;
}

export interface MemorySearchInput {
  projectId: string;
  limit?: number;
  includeSystem?: boolean;
}

export interface UpdateMemoryInput {
  projectId: string;
  messages?: ConversationMessage[];
  contextSummary?: string;
  systemPrompt?: string;
}

export interface ContextBuildResult {
  fullContext: string;
  tokenCount: number;
  messagesUsed: number;
  wasTruncated: boolean;
  summary?: string;
}

export const MAX_CONTEXT_TOKENS = 60000;
export const MAX_HISTORY_MESSAGES = 50;
export const AUTO_SUMMARY_THRESHOLD = 40000;

export class ProjectMemoryService {
  private memoryStore: Map<string, ProjectMemory> = new Map();

  /**
   * Get or create memory for a project
   */
  async getOrCreate(projectId: string): Promise<ProjectMemory> {
    let memory = this.memoryStore.get(projectId);
    
    if (!memory) {
      memory = {
        id: crypto.randomUUID(),
        projectId,
        conversationHistory: [],
        contextSummary: '',
        systemPrompt: this.getDefaultSystemPrompt(),
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
      this.memoryStore.set(projectId, memory);
      logger.debug('Created new project memory', { projectId });
    }

    return memory;
  }

  /**
   * Get memory for a project
   */
  async get(projectId: string): Promise<ProjectMemory | null> {
    const memory = this.memoryStore.get(projectId);
    return memory || null;
  }

  /**
   * Update project memory with new messages
   */
  async update(input: UpdateMemoryInput): Promise<ProjectMemory> {
    let memory = await this.getOrCreate(input.projectId);

    if (input.messages && input.messages.length > 0) {
      // Add new messages to history
      memory.conversationHistory = [
        ...memory.conversationHistory,
        ...input.messages.map(m => ({
          ...m,
          timestamp: m.timestamp || new Date(),
        })),
      ];

      // Trim history if it exceeds maximum
      if (memory.conversationHistory.length > MAX_HISTORY_MESSAGES) {
        memory.conversationHistory = memory.conversationHistory.slice(-MAX_HISTORY_MESSAGES);
      }
    }

    if (input.contextSummary !== undefined) {
      memory.contextSummary = input.contextSummary;
    }

    if (input.systemPrompt !== undefined) {
      memory.systemPrompt = input.systemPrompt;
    }

    memory.lastUpdated = new Date();
    this.memoryStore.set(input.projectId, memory);

    logger.debug('Updated project memory', { 
      projectId: input.projectId, 
      messageCount: memory.conversationHistory.length 
    });

    return memory;
  }

  /**
   * Add a single message to conversation history
   */
  async addMessage(
    projectId: string, 
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: ConversationMessage['metadata']
  ): Promise<ConversationMessage> {
    const memory = await this.getOrCreate(projectId);

    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date(),
      metadata,
    };

    memory.conversationHistory.push(message);
    memory.lastUpdated = new Date();

    // Check if we should auto-summarize
    if (this.estimateTokenCount(memory.conversationHistory) > AUTO_SUMMARY_THRESHOLD) {
      await this.autoSummarize(projectId);
    }

    this.memoryStore.set(projectId, memory);
    
    logger.debug('Added message to project memory', { projectId, role });
    
    return message;
  }

  /**
   * Build context for AI request
   */
  async buildContext(projectId: string, systemPrompt?: string): Promise<ContextBuildResult> {
    const memory = await this.getOrCreate(projectId);
    const effectiveSystemPrompt = systemPrompt || memory.systemPrompt;
    
    let context = `## System Context\n${effectiveSystemPrompt}\n\n`;
    
    // Add context summary if available
    if (memory.contextSummary) {
      context += `## Project Context Summary\n${memory.contextSummary}\n\n`;
    }

    // Add conversation history
    context += `## Conversation History\n`;
    const recentMessages = memory.conversationHistory.slice(-20); // Last 20 messages
    
    for (const msg of recentMessages) {
      const roleLabel = msg.role === 'user' ? 'Human' : 'Assistant';
      context += `\n### ${roleLabel} (${msg.timestamp.toISOString()})\n${msg.content}`;
    }

    const tokenCount = this.estimateTokenCount(context);
    const wasTruncated = tokenCount > MAX_CONTEXT_TOKENS;

    // If context is too long, truncate from the middle
    if (wasTruncated) {
      context = this.truncateContext(context, MAX_CONTEXT_TOKENS);
    }

    return {
      fullContext: context,
      tokenCount: this.estimateTokenCount(context),
      messagesUsed: recentMessages.length,
      wasTruncated,
    };
  }

  /**
   * Clear project memory
   */
  async clear(projectId: string): Promise<boolean> {
    const memory = await this.get(projectId);
    
    if (!memory) {
      return false;
    }

    memory.conversationHistory = [];
    memory.contextSummary = '';
    memory.lastUpdated = new Date();
    
    this.memoryStore.set(projectId, memory);
    
    logger.info('Cleared project memory', { projectId });
    return true;
  }

  /**
   * Delete project memory entirely
   */
  async delete(projectId: string): Promise<boolean> {
    const deleted = this.memoryStore.delete(projectId);
    
    if (deleted) {
      logger.info('Deleted project memory', { projectId });
    }
    
    return deleted;
  }

  /**
   * Summarize older messages to save tokens
   */
  async autoSummarize(projectId: string): Promise<string | null> {
    const memory = await this.get(projectId);
    
    if (!memory || memory.conversationHistory.length < 10) {
      return null;
    }

    // Get older messages (all except last 5)
    const olderMessages = memory.conversationHistory.slice(0, -5);
    const recentMessages = memory.conversationHistory.slice(-5);

    // Create a summary of what was discussed
    const summary = this.generateSummary(olderMessages);

    // Update memory with summary and recent messages
    memory.conversationHistory = [
      {
        role: 'system',
        content: `## Conversation Summary\nEarlier, we discussed:\n${summary}\n\n(Previous context has been summarized to save tokens)`,
        timestamp: olderMessages[0].timestamp,
      },
      ...recentMessages,
    ];

    memory.lastUpdated = new Date();
    this.memoryStore.set(projectId, memory);

    logger.info('Auto-summarized project memory', { projectId });
    
    return summary;
  }

  /**
   * Get statistics for a project's memory
   */
  async getStats(projectId: string): Promise<{
    messageCount: number;
    tokenCount: number;
    lastUpdated: Date | null;
    oldestMessage: Date | null;
    roleDistribution: Record<string, number>;
  } | null> {
    const memory = await this.get(projectId);
    
    if (!memory) {
      return null;
    }

    const roleDistribution: Record<string, number> = {};
    for (const msg of memory.conversationHistory) {
      roleDistribution[msg.role] = (roleDistribution[msg.role] || 0) + 1;
    }

    return {
      messageCount: memory.conversationHistory.length,
      tokenCount: this.estimateTokenCount(memory.conversationHistory),
      lastUpdated: memory.lastUpdated,
      oldestMessage: memory.conversationHistory[0]?.timestamp || null,
      roleDistribution,
    };
  }

  /**
   * Search through conversation history
   */
  async search(projectId: string, query: string, limit: number = 5): Promise<ConversationMessage[]> {
    const memory = await this.get(projectId);
    
    if (!memory) {
      return [];
    }

    const queryLower = query.toLowerCase();
    
    // Simple text search (would use full-text search in production)
    const matches = memory.conversationHistory.filter(msg => 
      msg.content.toLowerCase().includes(queryLower)
    );

    return matches.slice(-limit);
  }

  /**
   * Get default system prompt based on role
   */
  getDefaultSystemPrompt(role?: string): string {
    const rolePrompts: Record<string, string> = {
      Architect: `You are a Principal Software Architect with 20+ years of experience designing scalable systems.
Your expertise spans microservices, monoliths, event-driven architectures, and serverless designs.
You always consider business requirements, scalability, security, and cost optimization.
Provide thoughtful recommendations with clear trade-off explanations.`,

      Developer: `You are an expert software engineer specializing in production-quality code.
You write clean, maintainable, well-documented code following best practices.
You focus on type safety, error handling, performance, and security.
Your code includes comprehensive comments and is production-ready.`,

      Tester: `You are a Senior QA Engineer and Test Architect.
You specialize in comprehensive test coverage including unit, integration, and E2E tests.
You focus on edge cases, error conditions, and realistic test data.
Your tests follow the Arrange-Act-Assert pattern and are maintainable.`,

      Security: `You are a Security Architect specializing in application security.
You identify vulnerabilities following OWASP guidelines and security best practices.
You provide actionable remediation recommendations with code examples.
You prioritize issues by severity and provide risk assessments.`,

      Default: `You are Vibe Mentor, an AI assistant helping with software engineering.
Be helpful, educational, and encouraging. Explain concepts clearly and help developers learn.`,
    };

    return rolePrompts[role || 'Default'] || rolePrompts.Default;
  }

  /**
   * Estimate token count for text
   * Rough approximation: 4 characters per token on average
   */
  private estimateTokenCount(text: string | ConversationMessage[]): number {
    if (Array.isArray(text)) {
      const totalContent = text.map(m => m.content).join('\n');
      return Math.ceil(totalContent.length / 4);
    }
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate context to fit within token limit
   */
  private truncateContext(context: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    
    if (context.length <= maxChars) {
      return context;
    }

    // Truncate from the middle, keeping start and end
    const startLength = Math.floor(maxChars * 0.4);
    const endLength = Math.floor(maxChars * 0.4);
    
    const start = context.slice(0, startLength);
    const end = context.slice(-endLength);
    
    return `${start}\n\n[... context truncated for length ...]\n\n${end}`;
  }

  /**
   * Generate a summary of conversation messages
   */
  private generateSummary(messages: ConversationMessage[]): string {
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content);
    
    if (userMessages.length === 0) {
      return 'No user messages recorded.';
    }

    // Take first and last few messages for summary
    const firstFew = userMessages.slice(0, 3);
    const lastFew = userMessages.slice(-3);

    return `Discussed ${userMessages.length} messages covering topics like: ${
      firstFew.map(m => m.slice(0, 50)).join(', ')
    }... (most recent: ${lastFew.map(m => m.slice(0, 50)).join(', ')}...)`;
  }
}

export const projectMemoryService = new ProjectMemoryService();
export default ProjectMemoryService;
