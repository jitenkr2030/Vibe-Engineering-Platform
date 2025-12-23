import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { promptTemplateService } from '../services/ai/promptTemplateService';
import { projectMemoryService } from '../services/ai/projectMemoryService';
import { aiAggregator } from '../services/ai/aiAggregator';

const router = Router();

// =====================================================
// TEMPLATE MANAGEMENT ENDPOINTS
// =====================================================

/**
 * GET /api/prompt-studio/templates
 * List all templates with optional filtering
 */
router.get(
  '/templates',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { role, search, limit = 20, offset = 0 } = req.query;

    const result = await promptTemplateService.search({
      role: role as string,
      search: search as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: result.templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        role: t.role,
        variables: t.variables.map(v => ({
          name: v.name,
          label: v.label,
          type: v.type,
          required: v.required,
        })),
        isSystem: t.isSystem,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      meta: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * GET /api/prompt-studio/templates/:id
 * Get a specific template by ID
 */
router.get(
  '/templates/:id',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { id } = req.params;

    // Search in system templates first
    const systemTemplates = promptTemplateService.getSystemTemplates();
    const template = systemTemplates.find(t => t.id === id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  })
);

/**
 * POST /api/prompt-studio/templates
 * Create a new template
 */
router.post(
  '/templates',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { name, description, role, content, variables, projectId } = req.body;

    if (!name || !role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, role, content',
      });
    }

    const template = await promptTemplateService.create({
      name,
      description,
      role,
      content,
      variables: variables || [],
      userId: (req as any).user.id,
      projectId,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  })
);

/**
 * PUT /api/prompt-studio/templates/:id
 * Update an existing template
 */
router.put(
  '/templates/:id',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const template = await promptTemplateService.update(id, updates);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  })
);

/**
 * DELETE /api/prompt-studio/templates/:id
 * Delete a template
 */
router.delete(
  '/templates/:id',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { id } = req.params;

    // Check if it's a system template
    const systemTemplates = promptTemplateService.getSystemTemplates();
    if (systemTemplates.find(t => t.id === id)) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete system templates',
      });
    }

    const deleted = await promptTemplateService.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  })
);

/**
 * POST /api/prompt-studio/templates/:id/clone
 * Clone an existing template
 */
router.post(
  '/templates/:id/clone',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { id } = req.params;

    const template = await promptTemplateService.clone(id, (req as any).user.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.status(201).json({
      success: true,
      data: template,
    });
  })
);

// =====================================================
// MEMORY MANAGEMENT ENDPOINTS
// =====================================================

/**
 * GET /api/prompt-studio/memory/:projectId
 * Get memory for a project
 */
router.get(
  '/memory/:projectId',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId } = req.params;

    const memory = await projectMemoryService.get(projectId);
    
    if (!memory) {
      return res.json({
        success: true,
        data: {
          conversationHistory: [],
          contextSummary: '',
          messageCount: 0,
        },
      });
    }

    res.json({
      success: true,
      data: {
        conversationHistory: memory.conversationHistory,
        contextSummary: memory.contextSummary,
        systemPrompt: memory.systemPrompt,
        messageCount: memory.conversationHistory.length,
        lastUpdated: memory.lastUpdated,
      },
    });
  })
);

/**
 * POST /api/prompt-studio/memory/:projectId/message
 * Add a message to conversation history
 */
router.post(
  '/memory/:projectId/message',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId } = req.params;
    const { role, content, metadata } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: role, content',
      });
    }

    const message = await projectMemoryService.addMessage(
      projectId,
      role,
      content,
      metadata
    );

    res.json({
      success: true,
      data: message,
    });
  })
);

/**
 * DELETE /api/prompt-studio/memory/:projectId
 * Clear project memory
 */
router.delete(
  '/memory/:projectId',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId } = req.params;

    const cleared = await projectMemoryService.clear(projectId);

    res.json({
      success: true,
      message: cleared ? 'Memory cleared successfully' : 'No memory found to clear',
    });
  })
);

/**
 * GET /api/prompt-studio/memory/:projectId/stats
 * Get memory statistics
 */
router.get(
  '/memory/:projectId/stats',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId } = req.params;

    const stats = await projectMemoryService.getStats(projectId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * POST /api/prompt-studio/memory/:projectId/summarize
 * Manually trigger memory summarization
 */
router.post(
  '/memory/:projectId/summarize',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId } = const summary = await projectMemoryService.auto req.params;

   Summarize(projectId);

    res.json({
      success: true,
      data: {
        summary,
        message: summary ? 'Memory summarized successfully' : 'Not enough messages to summarize',
      },
    });
  })
);

// =====================================================
// AI GENERATION ENDPOINTS
// =====================================================

/**
 * POST /api/prompt-studio/generate
 * Generate response using template and memory
 */
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { 
      projectId, 
      templateId, 
      role, 
      variables, 
      message,
      useMemory = true,
      model,
      temperature,
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: message',
      });
    }

    const startTime = Date.now();

    // Get template if specified
    let templateContent = '';
    let templateVariables: any[] = [];
    
    if (templateId) {
      const templates = promptTemplateService.getSystemTemplates();
      const template = templates.find(t => t.id === templateId);
      if (template) {
        templateContent = promptTemplateService.interpolateContent(template.content, variables || {});
        templateVariables = template.variables;
      }
    }

    // Build context
    let fullPrompt = '';
    
    if (useMemory && projectId) {
      const context = await projectMemoryService.buildContext(
        projectId, 
        projectMemoryService.getDefaultSystemPrompt(role)
      );
      fullPrompt = `${context.fullContext}\n\n## Current Request\n${templateContent}\n\n## User Message\n${message}`;
    } else {
      const systemPrompt = projectMemoryService.getDefaultSystemPrompt(role);
      fullPrompt = `${systemPrompt}\n\n${templateContent}\n\n## User Message\n${message}`;
    }

    // Get AI response
    const response = await aiAggregator.complete({
      prompt: fullPrompt,
      context: 'prompt-studio',
      temperature: temperature || 0.7,
      model: model || 'gpt-4',
    });

    // Update memory with conversation if projectId provided
    if (projectId && useMemory) {
      await projectMemoryService.addMessage(projectId, 'user', message, {
        templateUsed: templateId,
        model: model,
      });
      await projectMemoryService.addMessage(projectId, 'assistant', response, {
        model: model || 'gpt-4',
      });
    }

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        response,
        templateUsed: templateId,
        role,
        tokenUsage: {
          estimated: Math.ceil(fullPrompt.length / 4) + Math.ceil(response.length / 4),
          responseLength: response.length,
        },
        executionTimeMs: executionTime,
      },
    });
  })
);

/**
 * POST /api/prompt-studio/chat
 * Multi-turn chat with memory
 */
router.post(
  '/chat',
  authenticate,
  asyncHandler(async (req, res: Response) => {
    const { projectId, message, role, useMemory = true } = req.body;

    if (!projectId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, message',
      });
    }

    const startTime = Date.now();

    // Build context from memory
    const context = await projectMemoryService.buildContext(
      projectId,
      projectMemoryService.getDefaultSystemPrompt(role)
    );

    const fullPrompt = `${context.fullContext}\n\n## Human\n${message}\n\n## Assistant`;

    // Get AI response
    const response = await aiAggregator.complete({
      prompt: fullPrompt,
      context: 'prompt-studio-chat',
      temperature: 0.7,
    });

    // Update memory
    await projectMemoryService.addMessage(projectId, 'user', message);
    await projectMemoryService.addMessage(projectId, 'assistant', response);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        response,
        messageId: crypto.randomUUID(),
        executionTimeMs: executionTime,
        contextUsed: {
          messagesUsed: context.messagesUsed,
          wasTruncated: context.wasTruncated,
        },
      },
    });
  })
);

/**
 * GET /api/prompt-studio/roles
 * Get available roles
 */
router.get(
  '/roles',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    res.json({
      success: true,
      data: [
        {
          id: 'Architect',
          name: 'Architect',
          description: 'System design and architecture specialist',
          icon: 'Building2',
          color: '#8B5CF6', // Purple
        },
        {
          id: 'Developer',
          name: 'Developer',
          description: 'Code implementation and best practices',
          icon: 'Code2',
          color: '#3B82F6', // Blue
        },
        {
          id: 'Tester',
          name: 'Tester',
          description: 'Testing and quality assurance specialist',
          icon: 'CheckCircle',
          color: '#10B981', // Green
        },
        {
          id: 'Security',
          name: 'Security',
          description: 'Security audit and vulnerability assessment',
          icon: 'Shield',
          color: '#EF4444', // Red
        },
      ],
    });
  })
);

/**
 * GET /api/prompt-studio/models
 * Get available AI models
 */
router.get(
  '/models',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const models = {
      openai: [
        { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model', recommendedFor: ['Architect', 'Security'] },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster and cheaper', recommendedFor: ['Developer', 'Tester'] },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Balanced performance', recommendedFor: ['General'] },
      ],
      anthropic: [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Best for coding', recommendedFor: ['Developer', 'Architect'] },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and efficient', recommendedFor: ['Tester'] },
      ],
    };

    res.json({
      success: true,
      data: models,
    });
  })
);

export { router as promptStudioRoutes };
export default promptStudioRoutes;
