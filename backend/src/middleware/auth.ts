import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_CONFIG } from '../config/constants';
import { User, ApiError, HTTP_STATUS, ERROR_CODES } from '@vibe/shared';

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

// JWT Token payload interface
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Extract and verify JWT token
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as TokenPayload;

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Check if user is active
    if (user.role === 'ADMIN' && !user.emailVerified) {
      throw ApiError.unauthorized('Please verify your email');
    }

    // Attach user to request
    req.user = user as User;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expired'));
    } else {
      next(error);
    }
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (user) {
      req.user = user as User;
      req.userId = user.id;
    }

    next();
  } catch {
    // Continue without authentication
    next();
  }
};

// Role-based authorization
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('Insufficient permissions'));
      return;
    }

    next();
  };
};

// Check project access
export const checkProjectAccess = (
  requiredPermission: 'read' | 'write' | 'admin'
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId || req.params.id;

      if (!projectId) {
        next(ApiError.badRequest('Project ID required'));
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          collaborators: {
            where: { userId: req.userId },
          },
        },
      });

      if (!project) {
        next(ApiError.notFound('Project'));
        return;
      }

      // Owner has full access
      if (project.ownerId === req.userId) {
        req.body.project = project;
        next();
        return;
      }

      // Check visibility
      if (project.visibility === 'PRIVATE') {
        // Check if user is a collaborator
        const collaborator = project.collaborators[0];

        if (!collaborator) {
          next(ApiError.forbidden('Access denied'));
          return;
        }

        const role = collaborator.role;

        // Check permissions based on required access
        const hasAccess =
          (requiredPermission === 'read' && ['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER'].includes(role)) ||
          (requiredPermission === 'write' && ['OWNER', 'ADMIN', 'DEVELOPER'].includes(role)) ||
          (requiredPermission === 'admin' && ['OWNER', 'ADMIN'].includes(role));

        if (!hasAccess) {
          next(ApiError.forbidden('Insufficient project permissions'));
          return;
        }
      }

      // Public projects have read access
      if (project.visibility === 'PUBLIC' && requiredPermission === 'read') {
        req.body.project = project;
        next();
        return;
      }

      req.body.project = project;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Generate JWT token
export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
  });
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_CONFIG.secret) as TokenPayload & { type: string };

  if (decoded.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid token type');
  }

  return decoded;
};
