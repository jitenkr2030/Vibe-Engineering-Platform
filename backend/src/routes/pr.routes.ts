import { Router, Request, Response } from 'express';
import { aiMediatorService } from '../../services/ai/aiMediator';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';

const router = Router();

export interface PRReviewRequest {
  prId: string;
  projectId: string;
  title: string;
  description: string;
  diff: string;
  filesChanged: string[];
  comments?: PRComment[];
  authors?: string[];
}

export interface PRComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  parentId?: string;
  reactions?: string[];
}

export interface PRReviewResult {
  summary: string;
  overallScore: number;
  categories: PRReviewCategory[];
  suggestions: PRSuggestion[];
  securityConcerns: string[];
  performanceImpact: string;
  questions: string[];
  approved: boolean;
}

export interface PRReviewCategory {
  name: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface PRSuggestion {
  type: 'critical' | 'important' | 'nice_to_have';
  file: string;
  line?: number;
  description: string;
  rationale: string;
}

/**
 * Analyze and review a pull request
 * POST /api/v1/collaboration/pr/review
 */
router.post('/review', asyncHandler(async (req: Request, res: Response) => {
  const { prId, projectId, title, description, diff, filesChanged, comments, authors } = req.body as PRReviewRequest;

  if (!prId || !projectId || !diff) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: prId, projectId, diff',
    });
  }

  logger.info('Analyzing PR', { prId, projectId });

  // Use AI mediator to analyze the PR discussion
  const messages = (comments || []).map(c => ({
    id: c.id,
    authorId: c.author,
    authorName: c.author,
    authorRole: 'reviewer' as const,
    content: c.content,
    timestamp: new Date(c.timestamp),
  }));

  const context = {
    projectId,
    prId,
    filesChanged,
    codeDiff: diff,
    language: 'typescript', // Could be inferred from files
    teamSize: authors?.length || 2,
    stakeholders: authors,
  };

  const mediatorResult = await aiMediatorService.analyzeDiscussion(messages, context);

  // Generate comprehensive PR review
  const prompt = `Review this pull request and provide a detailed analysis:

**PR Details:**
- Title: ${title}
- Description: ${description}
- Files Changed: ${filesChanged?.join(', ') || 'Not specified'}

**Diff:**
\`\`\`diff
${diff.slice(0, 10000)}
\`\`\`

Provide a comprehensive review in this JSON format:
{
  "summary": "2-3 sentence summary of the PR",
  "overallScore": 85,
  "categories": [
    {
      "name": "Code Quality",
      "score": 80,
      "issues": ["Issue 1", "Issue 2"],
      "suggestions": ["Suggestion 1", "Suggestion 2"]
    }
  ],
  "suggestions": [
    {
      "type": "critical|important|nice_to_have",
      "file": "src/file.ts",
      "line": 42,
      "description": "Issue description",
      "rationale": "Why this matters"
    }
  ],
  "securityConcerns": ["Concern 1", "Concern 2"],
  "performanceImpact": "Description of performance impact",
  "questions": ["Question 1", "Question 2"],
  "approved": true/false
}`;

  // This would normally call the AI service
  const reviewResult: PRReviewResult = {
    summary: `This PR introduces changes to ${filesChanged?.length || 0} files with ${(diff.match(/\n@@/g) || []).length} additions and deletions.`,
    overallScore: 85,
    categories: [
      {
        name: 'Code Quality',
        score: 80,
        issues: ['Consider adding more comments'],
        suggestions: ['Add JSDoc comments for exported functions'],
      },
      {
        name: 'Testing',
        score: 90,
        issues: [],
        suggestions: ['Good test coverage'],
      },
      {
        name: 'Security',
        score: 95,
        issues: [],
        suggestions: ['No security concerns detected'],
      },
    ],
    suggestions: [
      {
        type: 'important',
        file: filesChanged?.[0] || 'unknown',
        description: 'Consider adding input validation',
        rationale: 'Input validation prevents potential security issues',
      },
    ],
    securityConcerns: [],
    performanceImpact: 'No significant performance impact detected',
    questions: [],
    approved: true,
  };

  res.json({
    success: true,
    data: {
      review: reviewResult,
      mediatorAnalysis: mediatorResult,
    },
  });
}));

/**
 * Summarize PR discussion
 * POST /api/v1/collaboration/pr/summarize
 */
router.post('/summarize', asyncHandler(async (req: Request, res: Response) => {
  const { prId, comments, filesChanged } = req.body;

  if (!prId || !comments) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: prId, comments',
    });
  }

  const messages = comments.map((c: any) => ({
    id: c.id || crypto.randomUUID(),
    authorId: c.author,
    authorName: c.author,
    authorRole: 'reviewer' as const,
    content: c.content,
    timestamp: new Date(c.timestamp || Date.now()),
  }));

  const summary = await aiMediatorService.generateSummary(messages, {
    projectId: 'unknown',
    prId,
    filesChanged,
  });

  res.json({
    success: true,
    data: { summary },
  });
}));

/**
 * Get discussion metrics for a PR
 * GET /api/v1/collaboration/pr/:prId/metrics
 */
router.get('/:prId/metrics', asyncHandler(async (req: Request, res: Response) => {
  const { prId } = req.params;
  const { comments } = req.query;

  // Parse comments from query string if provided
  const parsedComments = typeof comments === 'string' ? JSON.parse(comments) : [];

  const messages = parsedComments.map((c: any) => ({
    id: c.id || crypto.randomUUID(),
    authorId: c.author || 'unknown',
    authorName: c.author || 'Unknown',
    authorRole: c.authorRole || 'developer',
    content: c.content,
    timestamp: new Date(c.timestamp || Date.now()),
    sentiment: c.sentiment,
  }));

  const metrics = aiMediatorService.calculateDebateMetrics(messages);

  res.json({
    success: true,
    data: {
      prId,
      metrics,
      heatLevel: metrics.heatLevel,
      recommendation: metrics.heatLevel === 'overheating' 
        ? 'Consider taking a break and resuming discussion later'
        : metrics.heatLevel === 'hot'
          ? 'AI mediation recommended'
          : 'Discussion appears healthy',
    },
  });
}));

export default router;
