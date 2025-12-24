import { PrismaClient, MemoryType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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

export interface MemoryEntry {
  id: string;
  projectId: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  confidence: number;
  createdAt: Date;
}

export interface SemanticSearchResult {
  id: string;
  content: string;
  type: MemoryType;
  score: number;
  metadata: Record<string, unknown>;
}

export interface ContextBuildResult {
  fullContext: string;
  tokenCount: number;
  messagesUsed: number;
  wasTruncated: boolean;
  summary?: string;
}

export interface UpdateMemoryInput {
  projectId: string;
  messages?: ConversationMessage[];
  contextSummary?: string;
  systemPrompt?: string;
}

export const MAX_CONTEXT_TOKENS = 60000;
export const MAX_HISTORY_MESSAGES = 50;
export const AUTO_SUMMARY_THRESHOLD = 40000;

export class ProjectMemoryService {
  private inMemoryStore: Map<string, ProjectMemory> = new Map();

  constructor() {
    logger.info('ProjectMemoryService initialized with database persistence');
  }

  /**
   * Get or create memory for a project
   */
  async getOrCreate(projectId: string): Promise<ProjectMemory> {
    let memory = this.inMemoryStore.get(projectId);
    
    if (!memory) {
      // Try to load from database
      const dbMemory = await prisma.projectMemory.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      if (dbMemory) {
        memory = {
          id: dbMemory.id,
          projectId,
          conversationHistory: [],
          contextSummary: (dbMemory.data as any)?.contextSummary || '',
          systemPrompt: this.getDefaultSystemPrompt(),
          lastUpdated: dbMemory.updatedAt,
          createdAt: dbMemory.createdAt,
        };
        this.inMemoryStore.set(projectId, memory);
        logger.debug('Loaded project memory from database', { projectId });
      } else {
        memory = {
          id: crypto.randomUUID(),
          projectId,
          conversationHistory: [],
          contextSummary: '',
          systemPrompt: this.getDefaultSystemPrompt(),
          lastUpdated: new Date(),
          createdAt: new Date(),
        };
        this.inMemoryStore.set(projectId, memory);
        logger.debug('Created new project memory', { projectId });
      }
    }

    return memory;
  }

  /**
   * Get memory for a project
   */
  async get(projectId: string): Promise<ProjectMemory | null> {
    const memory = this.inMemoryStore.get(projectId);
    
    if (!memory) {
      const dbMemory = await prisma.projectMemory.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      if (dbMemory) {
        return {
          id: dbMemory.id,
          projectId,
          conversationHistory: [],
          contextSummary: (dbMemory.data as any)?.contextSummary || '',
          systemPrompt: this.getDefaultSystemPrompt(),
          lastUpdated: dbMemory.updatedAt,
          createdAt: dbMemory.createdAt,
        };
      }
      return null;
    }

    return memory;
  }

  /**
   * Update project memory with new messages and persist to database
   */
  async update(input: UpdateMemoryInput): Promise<ProjectMemory> {
    let memory = await this.getOrCreate(input.projectId);

    if (input.messages && input.messages.length > 0) {
      memory.conversationHistory = [
        ...memory.conversationHistory,
        ...input.messages.map(m => ({
          ...m,
          timestamp: m.timestamp || new Date(),
        })),
      ];

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
    this.inMemoryStore.set(input.projectId, memory);

    // Persist to database
    await this.persistToDatabase(input.projectId, memory);

    logger.debug('Updated project memory', { 
      projectId: input.projectId, 
      messageCount: memory.conversationHistory.length 
    });

    return memory;
  }

  /**
   * Persist memory to database
   */
  private async persistToDatabase(projectId: string, memory: ProjectMemory): Promise<void> {
    try {
      await prisma.projectMemory.upsert({
        where: { id: memory.id },
        create: {
          id: memory.id,
          projectId,
          userId: null,
          type: 'CONTEXT' as MemoryType,
          data: {
            conversationHistory: memory.conversationHistory,
            contextSummary: memory.contextSummary,
            systemPrompt: memory.systemPrompt,
          },
          confidence: 1.0,
        },
        update: {
          data: {
            conversationHistory: memory.conversationHistory,
            contextSummary: memory.contextSummary,
            systemPrompt: memory.systemPrompt,
          },
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to persist memory to database', { projectId, error });
    }
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

    if (this.estimateTokenCount(memory.conversationHistory) > AUTO_SUMMARY_THRESHOLD) {
      await this.autoSummarize(projectId);
    }

    this.inMemoryStore.set(projectId, memory);
    await this.persistToDatabase(projectId, memory);
    
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
    
    if (memory.contextSummary) {
      context += `## Project Context Summary\n${memory.contextSummary}\n\n`;
    }

    // Add learned patterns and preferences
    const learnedPatterns = await this.getLearnedPatterns(projectId);
    if (learnedPatterns.length > 0) {
      context += `## Learned Patterns & Preferences\n`;
      for (const pattern of learnedPatterns.slice(0, 5)) {
        context += `- ${pattern}\n`;
      }
      context += '\n';
    }

    context += `## Conversation History\n`;
    const recentMessages = memory.conversationHistory.slice(-20);
    
    for (const msg of recentMessages) {
      const roleLabel = msg.role === 'user' ? 'Human' : 'Assistant';
      context += `\n### ${roleLabel} (${msg.timestamp.toISOString()})\n${msg.content}`;
    }

    const tokenCount = this.estimateTokenCount(context);
    const wasTruncated = tokenCount > MAX_CONTEXT_TOKENS;

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
   * Get learned patterns and preferences from database
   */
  async getLearnedPatterns(projectId: string): Promise<string[]> {
    try {
      const memories = await prisma.projectMemory.findMany({
        where: { 
          projectId,
          type: { in: ['PREFERENCE', 'PATTERN', 'MISTAKE'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return memories.map(m => {
        const data = m.data as any;
        return data?.pattern || data?.preference || data?.content || '';
      }).filter(Boolean);
    } catch (error) {
      logger.error('Failed to get learned patterns', { projectId, error });
      return [];
    }
  }

  /**
   * Learn from interaction - store important patterns
   */
  async learnFromInteraction(
    projectId: string,
    type: MemoryType,
    content: string,
    metadata: Record<string, unknown> = {}
  ): Promise<MemoryEntry> {
    try {
      const entry = await prisma.projectMemory.create({
        data: {
          projectId,
          userId: null,
          type,
          data: {
            content,
            ...metadata,
          },
          confidence: 1.0,
        },
      });

      logger.info('Learned new pattern', { projectId, type, content: content.slice(100) });
      
      return {
        id: entry.id,
        projectId: entry.projectId,
        type: entry.type,
        content,
        metadata: entry.data as any,
        confidence: entry.confidence,
        createdAt: entry.createdAt,
      };
    } catch (error) {
      logger.error('Failed to learn from interaction', { projectId, error });
      throw error;
    }
  }

  /**
   * Store a mistake to avoid repeating it
   */
  async rememberMistake(
    projectId: string,
    mistake: string,
    correction: string,
    context: string
  ): Promise<void> {
    await this.learnFromInteraction(projectId, 'MISTAKE', 
      `Mistake: ${mistake}\nCorrection: ${correction}\nContext: ${context}`,
      { category: 'error_prevention' }
    );
  }

  /**
   * Store a preference for future consistency
   */
  async rememberPreference(
    projectId: string,
    preference: string,
    reason: string
  ): Promise<void> {
    await this.learnFromInteraction(projectId, 'PREFERENCE', 
      `${preference}\nReason: ${reason}`,
      { category: 'coding_style' }
    );
  }

  /**
   * Store an architectural decision
   */
  async rememberDecision(
    projectId: string,
    decision: string,
    alternatives: string[],
    consequences: string[]
  ): Promise<void> {
    await this.learnFromInteraction(projectId, 'DECISION', 
      `Decision: ${decision}\nAlternatives: ${alternatives.join(', ')}\nConsequences: ${consequences.join(', ')}`,
      { category: 'architecture' }
    );
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
    
    this.inMemoryStore.set(projectId, memory);
    await this.persistToDatabase(projectId, memory);
    
    logger.info('Cleared project memory', { projectId });
    return true;
  }

  /**
   * Delete project memory entirely
   */
  async delete(projectId: string): Promise<boolean> {
    this.inMemoryStore.delete(projectId);
    
    try {
      await prisma.projectMemory.deleteMany({
        where: { projectId },
      });
      logger.info('Deleted project memory', { projectId });
      return true;
    } catch (error) {
      logger.error('Failed to delete project memory', { projectId, error });
      return false;
    }
  }

  /**
   * Auto-summarize older messages to save tokens
   */
  async autoSummarize(projectId: string): Promise<string | null> {
    const memory = await this.get(projectId);
    
    if (!memory || memory.conversationHistory.length < 10) {
      return null;
    }

    const olderMessages = memory.conversationHistory.slice(0, -5);
    const recentMessages = memory.conversationHistory.slice(-5);
    const summary = this.generateSummary(olderMessages);

    memory.conversationHistory = [
      {
        role: 'system',
        content: `## Conversation Summary\nEarlier, we discussed:\n${summary}\n\n(Previous context has been summarized to save tokens)`,
        timestamp: olderMessages[0].timestamp,
      },
      ...recentMessages,
    ];

    memory.lastUpdated = new Date();
    this.inMemoryStore.set(projectId, memory);
    await this.persistToDatabase(projectId, memory);

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
    learnedEntries: number;
  } | null> {
    const memory = await this.get(projectId);
    
    if (!memory) {
      return null;
    }

    const roleDistribution: Record<string, number> = {};
    for (const msg of memory.conversationHistory) {
      roleDistribution[msg.role] = (roleDistribution[msg.role] || 0) + 1;
    }

    // Get learned entries count
    const learnedCount = await prisma.projectMemory.count({
      where: { 
        projectId,
        type: { in: ['PREFERENCE', 'PATTERN', 'MISTAKE', 'DECISION'] },
      },
    });

    return {
      messageCount: memory.conversationHistory.length,
      tokenCount: this.estimateTokenCount(memory.conversationHistory),
      lastUpdated: memory.lastUpdated,
      oldestMessage: memory.conversationHistory[0]?.timestamp || null,
      roleDistribution,
      learnedEntries: learnedCount,
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
    const matches = memory.conversationHistory.filter(msg => 
      msg.content.toLowerCase().includes(queryLower)
    );

    return matches.slice(-limit);
  }

  /**
   * Search learned patterns semantically (basic implementation)
   */
  async searchLearnedPatterns(
    projectId: string, 
    query: string, 
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    try {
      const memories = await prisma.projectMemory.findMany({
        where: { 
          projectId,
          type: { in: ['PREFERENCE', 'PATTERN', 'MISTAKE', 'DECISION'] },
          data: {
            path: ['content'],
            string_contains: query,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return memories.map(m => ({
        id: m.id,
        content: (m.data as any)?.content || '',
        type: m.type,
        score: 1.0,
        metadata: m.data as any,
      }));
    } catch (error) {
      logger.error('Failed to search learned patterns', { projectId, error });
      return [];
    }
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

    const firstFew = userMessages.slice(0, 3);
    const lastFew = userMessages.slice(-3);

    return `Discussed ${userMessages.length} messages covering topics like: ${
      firstFew.map(m => m.slice(0, 50)).join(', ')
    }... (most recent: ${lastFew.map(m => m.slice(0, 50)).join(', ')}...)`;
  }
}

export const projectMemoryService = new ProjectMemoryService();
export default ProjectMemoryService;
