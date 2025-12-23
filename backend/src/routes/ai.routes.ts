import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { aiAggregator } from '../services/ai/aiAggregator';
import { aiReviewer } from '../services/ai/aiReviewer';
import { cicdGenerator } from '../services/ai/cicdGenerator';
import { architectureGenerator } from '../services/ai/architectureGenerator';
import { testIntelligence } from '../services/ai/testIntelligence';

const router = Router();

// AI Status endpoint
router.get(
  '/status',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const status = {
      aggregator: {
        available: true,
        providers: ['openai', 'anthropic', 'google'],
        defaultProvider: 'openai',
      },
      services: {
        reviewer: true,
        cicdGenerator: true,
        architectureGenerator: true,
        testIntelligence: true,
      },
      features: {
        codeReview: true,
        cicdGeneration: true,
        architectureGeneration: true,
        testGeneration: true,
        promptStudio: true,
      },
    };

    res.json({
      success: true,
      data: status,
      meta: { timestamp: new Date() },
    });
  })
);

// AI Model Configuration
router.post(
  '/configure',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { provider, model, temperature, maxTokens } = req.body;

    const config = aiAggregator.configure({
      provider,
      model,
      temperature,
      maxTokens,
    });

    res.json({
      success: true,
      data: {
        message: 'AI configuration updated',
        config: {
          provider: config.provider,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        },
      },
      meta: { timestamp: new Date() },
    });
  })
);

// Get available models
router.get(
  '/models',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const models = {
      openai: [
        { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster and cheaper' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Balanced performance' },
      ],
      anthropic: [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Best for coding' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and efficient' },
      ],
      google: [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Multimodal capabilities' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast responses' },
      ],
    };

    res.json({
      success: true,
      data: { models },
      meta: { timestamp: new Date() },
    });
  })
);

export { router as aiRoutes };
