import { Request, Response, NextFunction } from 'express';
import { env } from './config';
import { logger, logAuth } from './logger';
import { AuthenticationError } from './errors';

/**
 * Extended Request type with authenticated user ID
 */
export interface AuthenticatedRequest extends Request {
  authenticatedUserId?: number;
}

/**
 * Get authenticated user ID from multiple sources
 * Tries req.user, session, and passport in order
 */
export function getAuthenticatedUserId(req: Request): number | null {
  const sources = [
    req.user?.id,
    req.session?.user?.id,
    req.session?.userId,
    req.session?.passport?.user,
  ];

  logger.debug('Checking authentication sources', {
    hasUser: !!req.user,
    hasSession: !!req.session,
    sessionId: req.sessionID?.substring(0, 8),
  });

  for (const source of sources) {
    if (source) {
      const parsed = parseInt(String(source));
      if (!isNaN(parsed) && parsed > 0) {
        logger.debug('Found valid user ID', { userId: parsed });
        return parsed;
      }
    }
  }

  logger.debug('No valid user ID found');
  return null;
}

/**
 * Middleware to ensure user is authenticated
 * Throws AuthenticationError if not authenticated
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    logAuth('Authentication required but no valid user ID found');
    throw new AuthenticationError('Authentication required', {
      needsAuth: true,
      authUrl: '/api/auth/google',
    });
  }

  req.authenticatedUserId = userId;
  next();
}

/**
 * Optional auth middleware - doesn't throw if not authenticated
 * Just sets authenticatedUserId if available
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const userId = getAuthenticatedUserId(req);
  if (userId) {
    req.authenticatedUserId = userId;
  }
  next();
}
