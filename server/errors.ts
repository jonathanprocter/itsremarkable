/**
 * Custom error classes for structured error handling
 * Replaces generic Error with specific, actionable error types
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden', details?: unknown) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, identifier });
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR', { retryAfter });
  }
}

/**
 * External service errors (502/503)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', {
      service,
      ...details,
    });
  }
}

/**
 * Database errors (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * Token errors (401)
 */
export class TokenError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 401, 'TOKEN_ERROR', details);
  }
}

/**
 * OAuth-specific errors (401/502)
 */
export class OAuthError extends AppError {
  constructor(provider: string, message: string, statusCode = 502, details?: unknown) {
    super(`OAuth error with ${provider}: ${message}`, statusCode, 'OAUTH_ERROR', {
      provider,
      ...details,
    });
  }
}
