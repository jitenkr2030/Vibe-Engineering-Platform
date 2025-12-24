import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG } from '../../config/constants';

const prisma = new PrismaClient();

export interface DiscussionMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'developer' | 'ai_mediator' | 'lead' | 'reviewer';
  content: string;
  timestamp: Date;
  sentiment?: number;
  parentId?: string;
  children?: DiscussionMessage[];
}

export interface DiscussionContext {
  projectId: string;
  prId?: string;
  filesChanged?: string[];
  codeDiff?: string;
  language?: string;
  teamSize?: number;
  stakeholders?: string[];
}

export interface MediationResult {
  interventionRequired: boolean;
  interventionType?: 'summary' | 'suggestion' | 'consensus' | 'timeout';
  summary?: string;
  suggestion?: MediationSuggestion;
  consensus?: ConsensusResult;
  nextSteps?: string[];
}

export interface MediationSuggestion {
  summary: string;
  options: Array<{
    title: string;
    description: string;
    pros: string[];
    cons: string[];
    recommended: boolean;
  }>;
  recommendedOption: number;
  rationale: string;
}

export interface ConsensusResult {
  reached: boolean;
  winningOption?: number;
  votes?: Record<string, number>;
  summary?: string;
}

export interface DebateMetrics {
  messageCount: number;
  participantCount: number;
  duration: number;
  sentimentProgression: number[];
  topicDrift: number;
  heatLevel: 'cold' | 'warm' | 'hot' | 'overheating';
  resolvedTopics: number;
  openTopics: number;
}

export class AIMediatorService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  // Debate heat thresholds
  private readonly HEAT_THRESHOLDS = {
    cold: 0.2,
    warm: 0.4,
    hot: 0.7,
    overheating: 0.9,
  };

  constructor() {
    if (AI_CONFIG.primary.apiKey) {
      this.openai = new OpenAI({ apiKey: AI_CONFIG.primary.apiKey });
    }
    if (AI_CONFIG.alternative.apiKey) {
      this.anthropic = new Anthropic({ apiKey: AI_CONFIG.alternative.apiKey });
    }
    logger.info('AIMediatorService initialized');
  }

  /**
   * Analyze a discussion and determine if intervention is needed
   */
  async analyzeDiscussion(
    messages: DiscussionMessage[],
    context: DiscussionContext
  ): Promise<MediationResult> {
    logger.info('Analyzing discussion for mediation', {
      projectId: context.projectId,
      messageCount: messages.length,
    });

    // Calculate debate metrics
    const metrics = this.calculateDebateMetrics(messages);

    // Analyze sentiment progression
    const sentimentAnalysis = this.analyzeSentimentProgression(messages);

    // Detect topic drift
    const topicDrift = this.detectTopicDrift(messages);

    // Determine if intervention is needed
    const interventionRequired = this.shouldIntervene(metrics, sentimentAnalysis, topicDrift);

    if (!interventionRequired) {
      return {
        interventionRequired: false,
      };
    }

    // Generate appropriate intervention
    const intervention = await this.generateIntervention(
      messages,
      context,
      metrics,
      sentimentAnalysis,
      topicDrift
    );

    // Store the intervention in the database
    await this.storeIntervention(messages, intervention, context);

    return intervention;
  }

  /**
   * Generate a summary of the current discussion
   */
  async generateSummary(
    messages: DiscussionMessage[],
    context: DiscussionContext
  ): Promise<string> {
    const messageTexts = messages
      .filter(m => m.authorRole !== 'ai_mediator')
      .map(m => `[${m.authorName}]: ${m.content}`)
      .join('\n');

    const prompt = `Summarize the following code review discussion:

**Context**:
- Files changed: ${context.filesChanged?.join(', ') || 'Not specified'}
- PR: ${context.prId || 'Not specified'}
- Language: ${context.language || 'Not specified'}

**Discussion**:
${messageTexts}

Provide a neutral, concise summary (2-3 paragraphs) covering:
1. Main points of agreement
2. Main points of disagreement
3. Technical decisions made
4. Open questions remaining

Format as a professional summary.`;

    return await this.generateWithAI(prompt, 'Summarize discussion', 0.4);
  }

  /**
   * Generate options for resolving a disagreement
   */
  async generateResolutionOptions(
    disagreement: string,
    context: DiscussionContext,
    preferences?: Record<string, string>
  ): Promise<MediationSuggestion> {
    const prompt = `Generate options for resolving this technical disagreement:

**Disagreement**: ${disagreement}

**Context**:
- Files: ${context.filesChanged?.join(', ') || 'Not specified'}
- Language: ${context.language || 'Not specified'}
${preferences ? `**Team Preferences**:\n${JSON.stringify(preferences, null, 2)}` : ''}

Generate 3-4 balanced options for resolving this. Each option should:
1. Be technically sound
2. Consider team preferences
3. Have clear trade-offs
4. Be actionable

**Output Format** (JSON):
{
  "summary": "Brief summary of the disagreement",
  "options": [
    {
      "title": "Option title",
      "description": "Detailed description",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "recommended": true/false
    }
  ],
  "recommendedOption": 0,
  "rationale": "Why this option is recommended"
}`;

    const result = await this.generateJSONWithAI<MediationSuggestion>(prompt, 'Generate resolution options', 0.5);
    
    // Store the suggestion
    await this.storeSuggestion(result, context);
    
    return result;
  }

  /**
   * Facilitate consensus building
   */
  async facilitateConsensus(
    messages: DiscussionMessage[],
    options: Array<{ id: number; title: string }>
  ): Promise<ConsensusResult> {
    // Count votes from messages
    const votes: Record<string, number> = {};
    for (const option of options) {
      votes[option.title] = 0;
    }

    // Analyze messages for votes
    for (const message of messages) {
      for (const option of options) {
        if (message.content.toLowerCase().includes(option.title.toLowerCase())) {
          votes[option.title]++;
        }
      }
    }

    // Find winning option
    let winningOption = 0;
    let maxVotes = 0;
    let totalVotes = 0;

    for (let i = 0; i < options.length; i++) {
      const optionVotes = votes[options[i].title] || 0;
      totalVotes += optionVotes;
      if (optionVotes > maxVotes) {
        maxVotes = optionVotes;
        winningOption = i;
      }
    }

    const reached = totalVotes > 0 && maxVotes > totalVotes * 0.5;

    return {
      reached,
      winningOption: reached ? winningOption : undefined,
      votes,
      summary: reached
        ? `Consensus reached on "${options[winningOption].title}" with ${maxVotes} votes`
        : 'No clear consensus. Further discussion needed.',
    };
  }

  /**
   * Calculate debate metrics
   */
  calculateDebateMetrics(messages: DiscussionMessage[]): DebateMetrics {
    if (messages.length === 0) {
      return {
        messageCount: 0,
        participantCount: 0,
        duration: 0,
        sentimentProgression: [],
        topicDrift: 0,
        heatLevel: 'cold',
        resolvedTopics: 0,
        openTopics: 0,
      };
    }

    const uniqueParticipants = new Set(messages.map(m => m.authorId)).size;
    
    const firstMessage = messages[0].timestamp;
    const lastMessage = messages[messages.length - 1].timestamp;
    const duration = lastMessage.getTime() - firstMessage.getTime();

    const sentimentProgression = messages.map(m => m.sentiment || 0.5);
    const avgSentiment = sentimentProgression.reduce((a, b) => a + b, 0) / sentimentProgression.length;

    const topicDrift = this.detectTopicDrift(messages);

    const heatLevel = this.categorizeHeat(avgSentiment, messages.length, topicDrift);

    // Count resolved vs open topics (simplified)
    const resolvedTopics = messages.filter(m => 
      m.content.toLowerCase().includes('resolved') || 
      m.content.toLowerCase().includes('agreed')
    ).length;
    const openTopics = Math.max(0, Math.ceil(messages.length / 10) - resolvedTopics);

    return {
      messageCount: messages.length,
      participantCount: uniqueParticipants,
      duration,
      sentimentProgression,
      topicDrift,
      heatLevel,
      resolvedTopics,
      openTopics,
    };
  }

  /**
   * Analyze sentiment progression over time
   */
  private analyzeSentimentProgression(messages: DiscussionMessage[]): {
    trend: 'improving' | 'stable' | 'declining';
    volatility: number;
    averageSentiment: number;
    negativeBursts: number;
  } {
    if (messages.length < 2) {
      return { trend: 'stable', volatility: 0, averageSentiment: 0.5, negativeBursts: 0 };
    }

    const sentiments = messages.map(m => m.sentiment || 0.5);
    const averageSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    // Calculate volatility (variance)
    const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - averageSentiment, 2), 0) / sentiments.length;
    const volatility = Math.sqrt(variance);

    // Detect negative bursts
    const negativeBursts = this.detectNegativeBursts(sentiments);

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining';
    if (sentiments.length >= 3) {
      const firstHalf = sentiments.slice(0, Math.floor(sentiments.length / 2));
      const secondHalf = sentiments.slice(Math.floor(sentiments.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (secondAvg - firstAvg > 0.1) trend = 'improving';
      else if (firstAvg - secondAvg > 0.1) trend = 'declining';
      else trend = 'stable';
    } else {
      trend = 'stable';
    }

    return { trend, volatility, averageSentiment, negativeBursts };
  }

  /**
   * Detect topic drift in the discussion
   */
  private detectTopicDrift(messages: DiscussionMessage[]): number {
    if (messages.length < 2) return 0;

    // Extract key terms from each message
    const keyTermsPerMessage = messages.map(m => this.extractKeyTerms(m.content));

    // Calculate similarity between consecutive messages
    let totalDrift = 0;
    let comparisons = 0;

    for (let i = 1; i < keyTermsPerMessage.length; i++) {
      const similarity = this.calculateSimilarity(
        keyTermsPerMessage[i - 1],
        keyTermsPerMessage[i]
      );
      totalDrift += (1 - similarity);
      comparisons++;
    }

    return comparisons > 0 ? totalDrift / comparisons : 0;
  }

  /**
   * Determine if intervention is needed
   */
  private shouldIntervene(
    metrics: DebateMetrics,
    sentimentAnalysis: ReturnType<typeof this.analyzeSentimentProgression>,
    topicDrift: number
  ): boolean {
    // Intervene if debate is overheating
    if (metrics.heatLevel === 'overheating' || metrics.heatLevel === 'hot') {
      return true;
    }

    // Intervene if sentiment is declining rapidly
    if (sentimentAnalysis.trend === 'declining' && sentimentAnalysis.volatility > 0.15) {
      return true;
    }

    // Intervene if there are many negative bursts
    if (sentimentAnalysis.negativeBursts >= 2) {
      return true;
    }

    // Intervene if topic drift is high
    if (topicDrift > 0.7) {
      return true;
    }

    // Intervene if discussion has been going on too long
    if (metrics.duration > 3600000 && metrics.messageCount > 20) { // 1 hour, 20 messages
      return true;
    }

    return false;
  }

  /**
   * Generate appropriate intervention
   */
  private async generateIntervention(
    messages: DiscussionMessage[],
    context: DiscussionContext,
    metrics: DebateMetrics,
    sentimentAnalysis: ReturnType<typeof this.analyzeSentimentProgression>,
    topicDrift: number
  ): Promise<MediationResult> {
    // Determine intervention type
    let interventionType: MediationResult['interventionType'];
    if (metrics.heatLevel === 'overheating') {
      interventionType = 'timeout';
    } else if (topicDrift > 0.5) {
      interventionType = 'summary';
    } else if (sentimentAnalysis.trend === 'declining') {
      interventionType = 'suggestion';
    } else {
      interventionType = 'consensus';
    }

    const messageTexts = messages.slice(-10).map(m => `[${m.authorName}]: ${m.content}`).join('\n');

    const prompt = `Generate a ${interventionType} intervention for this code review discussion:

**Discussion Summary**:
- Messages: ${metrics.messageCount}
- Participants: ${metrics.participantCount}
- Heat Level: ${metrics.heatLevel}
- Sentiment Trend: ${sentimentAnalysis.trend}
- Topic Drift: ${topicDrift.toFixed(2)}

**Recent Messages**:
${messageTexts}

**Context**:
- Files: ${context.filesChanged?.join(', ') || 'Not specified'}
- PR: ${context.prId || 'Not specified'}

Generate a ${interventionType} that:
${this.getInterventionInstructions(interventionType)}

Be neutral, helpful, and focused on moving the discussion forward constructively.`;

    const result = await this.generateWithAI(prompt, `Generate ${interventionType} intervention`, 0.5);

    // Generate next steps
    const nextStepsPrompt = `Based on this discussion summary, suggest 3-5 concrete next steps:

${result}

Provide actionable next steps for the team.`;

    const nextSteps = await this.generateWithAI(nextStepsPrompt, 'Generate next steps', 0.4)
      .then(text => text.split('\n').filter(s => s.trim().length > 0 && s.includes('.')))
      .catch(() => [
        'Review the generated suggestions',
        'Vote on preferred approach',
        'Document decision',
      ]);

    return {
      interventionRequired: true,
      interventionType,
      summary: result,
      nextSteps: nextSteps.slice(0, 5),
    };
  }

  /**
   * Get intervention instructions based on type
   */
  private getInterventionInstructions(type: string): string {
    const instructions: Record<string, string> = {
      summary: '- Summarize the key points\n- Highlight agreements and disagreements\n- Clarify technical points',
      suggestion: '- Acknowledge concerns\n- Propose a solution\n- Explain reasoning',
      consensus: '- Present options\n- Facilitate voting\n- Help team reach agreement',
      timeout: '- Suggest taking a break\n- Propose continuing later\n- Summarize current state',
    };
    return instructions[type] || instructions.summary;
  }

  // Helper methods
  private async generateWithAI(prompt: string, taskDescription: string, temperature: number = 0.7): Promise<string> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: AI_CONFIG.primary.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert software engineering mediator and team facilitator.',
            },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: 4096,
        });
        return response.choices[0]?.message?.content || '';
      } else if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: AI_CONFIG.alternative.model || 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: 'You are an expert software engineering mediator and team facilitator.',
          messages: [{ role: 'user', content: prompt }],
        });
        return response.content[0]?.type === 'text' ? response.content[0].text : '';
      }
    } catch (error) {
      logger.error(`AI generation failed for ${taskDescription}`, { error });
    }
    return `[AI unavailable - ${taskDescription}]`;
  }

  private async generateJSONWithAI<T>(prompt: string, taskDescription: string, temperature: number): Promise<T> {
    const response = await this.generateWithAI(`${prompt}\n\nRespond with valid JSON only.`, taskDescription, temperature);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error(`Failed to parse JSON for ${taskDescription}`, { error });
    }
    return {} as T;
  }

  private extractKeyTerms(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of', 'for', 'with', 'by']);
    return [...new Set(words.filter(w => w.length > 3 && !stopWords.has(w)))];
  }

  private calculateSimilarity(set1: string[], set2: string[]): number {
    if (set1.length === 0 && set2.length === 0) return 1;
    const intersection = set1.filter(x => set2.includes(x));
    const union = new Set([...set1, ...set2]);
    return intersection.length / union.size;
  }

  private detectNegativeBursts(sentiments: number[]): number {
    let bursts = 0;
    for (let i = 1; i < sentiments.length; i++) {
      if (sentiments[i] < 0.3 && sentiments[i - 1] > 0.5) {
        bursts++;
      }
    }
    return bursts;
  }

  private categorizeHeat(
    avgSentiment: number,
    messageCount: number,
    topicDrift: number
  ): 'cold' | 'warm' | 'hot' | 'overheating' {
    const heatScore = (1 - avgSentiment) * 0.5 + Math.min(messageCount / 50, 1) * 0.3 + topicDrift * 0.2;
    
    if (heatScore >= this.HEAT_THRESHOLDS.overheating) return 'overheating';
    if (heatScore >= this.HEAT_THRESHOLDS.hot) return 'hot';
    if (heatScore >= this.HEAT_THRESHOLDS.warm) return 'warm';
    return 'cold';
  }

  private async storeIntervention(
    messages: DiscussionMessage[],
    intervention: MediationResult,
    context: DiscussionContext
  ): Promise<void> {
    try {
      await prisma.devDiscussion.create({
        data: {
          projectId: context.projectId,
          prId: context.prId,
          status: intervention.interventionRequired ? 'active' : 'resolved',
          summary: intervention.summary,
        },
      });
    } catch (error) {
      logger.error('Failed to store intervention', { error });
    }
  }

  private async storeSuggestion(suggestion: MediationSuggestion, context: DiscussionContext): Promise<void> {
    try {
      await prisma.devDiscussion.create({
        data: {
          projectId: context.projectId,
          prId: context.prId,
          status: 'active',
          summary: suggestion.summary,
        },
      });
    } catch (error) {
      logger.error('Failed to store suggestion', { error });
    }
  }
}

export const aiMediatorService = new AIMediatorService();
export default AIMediatorService;
