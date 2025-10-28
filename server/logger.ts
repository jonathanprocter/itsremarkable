import winston from 'winston';
import { env } from './config';

/**
 * Centralized logging configuration
 * Replaces all console.log/error/warn statements
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format for development (readable)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return msg;
  })
);

// Custom format for production (JSON for log aggregation)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine log level based on environment
const level = () => {
  const isDevelopment = env.NODE_ENV === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Create transports based on environment
const transports = [];

// Always log to console
transports.push(
  new winston.transports.Console({
    format: env.NODE_ENV === 'development' ? devFormat : prodFormat,
  })
);

// In production, also log to files
if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on error
  exitOnError: false,
});

/**
 * Helper functions for common logging patterns
 */

// Log authentication events
export const logAuth = (message: string, meta?: Record<string, any>) => {
  logger.info(message, { ...meta, category: 'auth' });
};

// Log database operations
export const logDatabase = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, { ...meta, category: 'database' });
};

// Log API requests
export const logRequest = (method: string, path: string, statusCode: number, duration: number) => {
  logger.http(`${method} ${path} ${statusCode} in ${duration}ms`);
};

// Log OAuth operations
export const logOAuth = (message: string, meta?: Record<string, any>) => {
  // Never log tokens or sensitive OAuth data
  const safeMeta = meta ? { ...meta } : {};
  delete safeMeta.accessToken;
  delete safeMeta.refreshToken;
  delete safeMeta.token;

  logger.info(message, { ...safeMeta, category: 'oauth' });
};

// Log session events
export const logSession = (message: string, sessionId?: string) => {
  // Only log first 8 characters of session ID for security
  const safeSessionId = sessionId ? sessionId.substring(0, 8) + '...' : undefined;
  logger.debug(message, { sessionId: safeSessionId, category: 'session' });
};

// Log integration events (Google Calendar, Notion, etc.)
export const logIntegration = (service: string, message: string, meta?: Record<string, any>) => {
  logger.info(message, { ...meta, service, category: 'integration' });
};

// Log export operations
export const logExport = (exportType: string, message: string, meta?: Record<string, any>) => {
  logger.info(message, { ...meta, exportType, category: 'export' });
};

// Express middleware for request logging
export const requestLoggerMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req.method, req.path, res.statusCode, duration);
  });

  next();
};

// Log startup information
export const logStartup = () => {
  logger.info('🚀 Server starting...', {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    nodeVersion: process.version,
  });
};

// Log shutdown
export const logShutdown = () => {
  logger.info('👋 Server shutting down gracefully');
};

// Default export for convenience
export default logger;
