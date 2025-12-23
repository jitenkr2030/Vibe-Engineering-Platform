import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, ModelTier, AIResponse } from '../types';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAggregatorOptions {
  provider?: AIProvider;
  model?: ModelTier;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class AIAggregatorService {
  private provider: AIProvider;
  private model: ModelTier;
  private temperature: number;
  private maxTokens: number;

  constructor(options: AIAggregatorOptions = {}) {
    this.provider = options.provider || 'anthropic';
    this.model = options.model || 'smart';
    this.temperature = options.temperature ?? 0.3;
    this.maxTokens = options.maxTokens ?? 4000;
  }

  private getModelName(): string {
    const models = {
      openai: {
        fast: 'gpt-3.5-turbo',
        smart: 'gpt-4o',
      },
      anthropic: {
        fast: 'claude-sonnet-4-20250514',
        smart: 'claude-opus-4-20250514',
      },
    };
    return models[this.provider][this.model];
  }

  async complete(prompt: string, options: AIAggregatorOptions = {}): Promise<AIResponse> {
    const provider = options.provider || this.provider;
    const model = options.model || this.model;
    const temperature = options.temperature ?? this.temperature;
    const maxTokens = options.maxTokens ?? this.maxTokens;
    const systemPrompt = options.systemPrompt;

    try {
      if (provider === 'openai') {
        return await this.openAIComplete(prompt, model as any, temperature, maxTokens, systemPrompt);
      } else {
        return await this.anthropicComplete(prompt, model as any, temperature, maxTokens, systemPrompt);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async openAIComplete(
    prompt: string,
    model: 'fast' | 'smart',
    temperature: number,
    maxTokens: number,
    systemPrompt?: string
  ): Promise<AIResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await openai.chat.completions.create({
      model: model === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4o',
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'text' },
    });

    return {
      content: response.choices[0]?.message?.content || '',
      provider: 'openai',
      model: model === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4o',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      latency: Date.now(),
    };
  }

  private async anthropicComplete(
    prompt: string,
    model: 'fast' | 'smart',
    temperature: number,
    maxTokens: number,
    systemPrompt?: string
  ): Promise<AIResponse> {
    const messages: Anthropic.MessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: 'user', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await anthropic.messages.create({
      model: model === 'fast' ? 'claude-sonnet-4-20250514' : 'claude-opus-4-20250514',
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    return {
      content: response.content[0]?.type === 'text' ? response.content[0].text || '' : '',
      provider: 'anthropic',
      model: model === 'fast' ? 'claude-sonnet-4-20250514' : 'claude-opus-4-20250514',
      usage: {
        promptTokens: response.usage.input_tokens || 0,
        completionTokens: response.usage.output_tokens || 0,
        totalTokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0),
      },
      latency: Date.now(),
    };
  }

  async completeJSON<T>(prompt: string, options: AIAggregatorOptions = {}): Promise<T> {
    const response = await this.complete(prompt, {
      ...options,
      systemPrompt: (options.systemPrompt || '') + '\n\nIMPORTANT: You must respond with valid JSON only. No markdown formatting, no explanations.',
    });

    try {
      // Try to parse the response as JSON
      const cleanedContent = response.content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanedContent) as T;
    } catch (error) {
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  async streamComplete(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: AIAggregatorOptions = {}
  ): Promise<void> {
    const provider = options.provider || this.provider;
    const model = options.model || this.model;
    const temperature = options.temperature ?? this.temperature;
    const systemPrompt = options.systemPrompt;

    if (provider === 'openai') {
      const stream = await openai.chat.completions.create({
        model: model === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4o',
        messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] : [{ role: 'user', content: prompt }],
        temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      }
    } else {
      // Anthropic streaming
      const stream = await anthropic.messages.create({
        model: model === 'fast' ? 'claude-sonnet-4-20250514' : 'claude-opus-4-20250514',
        messages: systemPrompt ? [{ role: 'user', content: systemPrompt }, { role: 'user', content: prompt }] : [{ role: 'user', content: prompt }],
        temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          onChunk(chunk.delta.text || '');
        }
      }
    }
  }
}

export const aiAggregator = new AIAggregatorService();
export default AIAggregatorService;
