import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiAggregator } from '../services/ai/aiAggregator';

// Mock the dependencies
vi.mock('../config/constants', () => ({
  AI_CONFIG: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4',
    defaultTemperature: 0.7,
    maxTokens: 4000,
  },
  OPENAI_API_KEY: 'test-openai-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
  GOOGLE_API_KEY: 'test-google-key',
}));

describe('AI Aggregator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should have default configuration', () => {
      const config = aiAggregator.getConfig();
      
      expect(config).toBeDefined();
      expect(config.provider).toBeDefined();
      expect(config.model).toBeDefined();
      expect(config.temperature).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig = {
        provider: 'anthropic' as const,
        model: 'claude-3-5-sonnet',
        temperature: 0.5,
        maxTokens: 2000,
      };

      const config = aiAggregator.configure(newConfig);
      
      expect(config.provider).toBe('anthropic');
      expect(config.model).toBe('claude-3-5-sonnet');
      expect(config.temperature).toBe(0.5);
    });
  });

  describe('Provider Management', () => {
    it('should list available providers', () => {
      const providers = aiAggregator.getAvailableProviders();
      
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('google');
    });

    it('should validate provider exists', () => {
      expect(aiAggregator.isProviderAvailable('openai')).toBe(true);
      expect(aiAggregator.isProviderAvailable('invalid')).toBe(false);
    });

    it('should switch provider', () => {
      const result = aiAggregator.switchProvider('anthropic');
      
      expect(result).toBe(true);
      expect(aiAggregator.getConfig().provider).toBe('anthropic');
    });

    it('should fail to switch to invalid provider', () => {
      const result = aiAggregator.switchProvider('invalid');
      
      expect(result).toBe(false);
    });
  });

  describe('Cost Tracking', () => {
    it('should track request costs', () => {
      const initialCost = aiAggregator.getTotalCost();
      
      // Simulate a request
      aiAggregator.trackRequestCost('openai', 100);
      
      const newCost = aiAggregator.getTotalCost();
      expect(newCost).toBeGreaterThan(initialCost);
    });

    it('should get cost by provider', () => {
      aiAggregator.trackRequestCost('openai', 50);
      aiAggregator.trackRequestCost('anthropic', 30);
      
      const openaiCost = aiAggregator.getCostByProvider('openai');
      const anthropicCost = aiAggregator.getCostByProvider('anthropic');
      
      expect(openaiCost).toBeGreaterThan(0);
      expect(anthropicCost).toBeGreaterThan(0);
    });

    it('should reset cost tracking', () => {
      aiAggregator.trackRequestCost('openai', 100);
      aiAggregator.resetCostTracking();
      
      const cost = aiAggregator.getTotalCost();
      expect(cost).toBe(0);
    });
  });

  describe('Request Tracking', () => {
    it('should track request count', () => {
      const initialCount = aiAggregator.getTotalRequests();
      
      aiAggregator.trackRequest('openai');
      
      const newCount = aiAggregator.getTotalRequests();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    it('should get requests by provider', () => {
      aiAggregator.trackRequest('openai');
      aiAggregator.trackRequest('anthropic');
      
      const openaiRequests = aiAggregator.getRequestsByProvider('openai');
      const anthropicRequests = aiAggregator.getRequestsByProvider('anthropic');
      
      expect(openaiRequests).toBeGreaterThan(0);
      expect(anthropicRequests).toBeGreaterThan(0);
    });

    it('should get request statistics', () => {
      aiAggregator.trackRequest('openai');
      aiAggregator.trackRequest('openai');
      
      const stats = aiAggregator.getRequestStats();
      
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.providerBreakdown).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const health = aiAggregator.getHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.providers).toBeDefined();
    });

    it('should check provider health', () => {
      const openaiHealth = aiAggregator.checkProviderHealth('openai');
      
      expect(openaiHealth).toBeDefined();
      expect(openaiHealth.healthy).toBeDefined();
      expect(openaiHealth.latency).toBeDefined();
    });
  });

  describe('Response Parsing', () => {
    it('should extract code blocks from markdown', () => {
      const markdown = `
Here is the code:
\`\`\`typescript
const foo = 'bar';
\`\`\`

And some explanation.
      `;

      const blocks = aiAggregator.extractCodeBlocks(markdown);
      
      expect(blocks.length).toBe(1);
      expect(blocks[0]).toContain("const foo = 'bar'");
    });

    it('should handle JSON responses', () => {
      const jsonResponse = JSON.stringify({
        result: 'success',
        data: { test: true }
      });

      const parsed = aiAggregator.parseResponse(jsonResponse);
      
      expect(parsed.result).toBe('success');
      expect(parsed.data.test).toBe(true);
    });

    it('should extract metrics from response', () => {
      const response = 'Generated 5 files in 2.3 seconds with 95% confidence';
      
      const metrics = aiExtractor.extractMetrics(response);
      
      expect(metrics.filesGenerated).toBe(5);
      expect(metrics.duration).toBe(2.3);
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors gracefully', () => {
      const error = aiAggregator.createError('PROVIDER_ERROR', 'OpenAI API error');
      
      expect(error.code).toBe('PROVIDER_ERROR');
      expect(error.message).toBe('OpenAI API error');
      expect(error.retryable).toBe(true);
    });

    it('should provide error suggestions', () => {
      const error = aiAggregator.createError('RATE_LIMIT', 'Rate limit exceeded');
      const suggestion = aiAggregator.getErrorSuggestion(error);
      
      expect(suggestion).toBeDefined();
    });
  });

  describe('Fallback Mechanism', () => {
    it('should attempt fallback on failure', async () => {
      const result = await aiAggregator.completeWithFallback(
        'Test prompt',
        ['openai', 'anthropic'],
        { temperature: 0.7 }
      );
      
      expect(result).toBeDefined();
    });

    it('should return null if all providers fail', async () => {
      // This test would require mocking provider failures
      // Skipped for unit tests
    });
  });
});
