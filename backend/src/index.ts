import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { API_PREFIX, NODE_ENV, PORT, RATE_LIMITS } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestId } from './middleware/requestId';
import { healthCheck } from './controllers/health';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { projectRoutes } from './routes/project';
import { fileRoutes } from './routes/file';
import { generationRoutes } from './routes/generation';
import { qualityRoutes } from './routes/quality';
import { deploymentRoutes } from './routes/deployment';
import { templateRoutes } from './routes/template';
import { memoryRoutes } from './routes/memory';
import { testsRoutes } from './routes/tests.routes';
import { securityRoutes } from './routes/security.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { templatesRoutes } from './routes/templates.routes';
import { fileStorageRoutes } from './routes/fileStorage.routes';
import { deploymentsRoutes } from './routes/deployments.routes';
import { aiRoutes } from './routes/ai.routes';
import { aiReviewerRoutes } from './routes/aiReviewer.routes';
import { cicdGeneratorRoutes } from './routes/cicdGenerator.routes';
import { architectureGeneratorRoutes } from './routes/architectureGenerator.routes';
import { testIntelligenceRoutes } from './routes/testIntelligence.routes';
import { billingRoutes } from './routes/billing.routes';
import { websocketHandler } from './services/websocket';
import { logger } from './utils/logger';

const app: Express = appFactory();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.openai.com', 'https://api.anthropic.com'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID
app.use(requestId);

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
  app.use(requestLogger);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.maxRequests,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/health', healthCheck);

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/files`, fileRoutes);
app.use(`${API_PREFIX}/generation`, generationRoutes);
app.use(`${API_PREFIX}/quality`, qualityRoutes);
app.use(`${API_PREFIX}/deployments`, deploymentRoutes);
app.use(`${API_PREFIX}/templates`, templateRoutes);
app.use(`${API_PREFIX}/memory`, memoryRoutes);
app.use(`${API_PREFIX}/tests`, testsRoutes);
app.use(`${API_PREFIX}/security`, securityRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/templates`, templatesRoutes);
app.use(`${API_PREFIX}/storage`, fileStorageRoutes);
app.use(`${API_PREFIX}/deploy`, deploymentsRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/ai/reviewer`, aiReviewerRoutes);
app.use(`${API_PREFIX}/ai/cicd`, cicdGeneratorRoutes);
app.use(`${API_PREFIX}/ai/architecture`, architectureGeneratorRoutes);
app.use(`${API_PREFIX}/ai/tests`, testIntelligenceRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
    meta: { timestamp: new Date() },
  });
});

// Error handling
app.use(errorHandler);

// Server startup
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  logger.info(`📝 API documentation: ${process.env.FRONTEND_URL}/docs`);
});

// WebSocket setup
websocketHandler.initialize(server);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`📴 ${signal} received. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }

    logger.info('💤 Server closed. Goodbye!');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('🛑 Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Factory function for creating app instances (useful for testing)
export function appFactory(): Express {
  const app = express();
  return app;
}

export default app;
