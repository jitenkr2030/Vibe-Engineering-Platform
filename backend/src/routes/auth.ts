import { Router } from 'express';
import { body } from 'express-validator';
import { AuthenticatedRequest, authenticate, generateToken, generateRefreshToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validationMiddleware } from '../middleware/validation';
import { prisma } from '../config/database';
import { ApiError, HTTP_STATUS, ERROR_CODES } from '@vibe/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { JWT_CONFIG, RATE_LIMITS } from '../config/constants';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

// Rate limiter for auth routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many authentication attempts, please try again later' },
});

// Register new user
router.post(
  '/register',
  authRateLimiter,
  registerValidation,
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'USER',
        subscription: 'FREE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscription: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateToken(user as any);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info('New user registered', { userId: user.id, email: user.email });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Login
router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateToken(user as any);
    const refreshToken = generateRefreshToken(user.id);

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info('User logged in', { userId: user.id });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription,
        },
        accessToken,
        refreshToken,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Refresh token
router.post(
  '/refresh',
  refreshValidation,
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { refreshToken } = req.body;

    // Verify token
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.secret) as any;

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Generate new tokens
    const newAccessToken = generateToken(user as any);
    const newRefreshToken = generateRefreshToken(user.id);

    // Invalidate old session and create new one
    await prisma.session.delete({
      where: { id: session.id },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Logout
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Invalidate session
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    logger.info('User logged out', { userId: req.userId });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

// Get current user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscription: true,
        preferences: true,
        tokenUsage: true,
        tokenLimit: true,
        projectLimit: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      meta: {
        timestamp: new Date(),
      },
    });
  })
);

// Change password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  ],
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || !user.passwordHash) {
      throw ApiError.notFound('User');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate all other sessions
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        token: { not: req.headers.authorization?.split(' ')[1] },
      },
    });

    logger.info('Password changed', { userId: user.id });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

export { router as authRoutes };
