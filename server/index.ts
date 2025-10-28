import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import helmet from "helmet";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";
import http from "http";
import { initializeMinimalOAuth } from "./minimal-oauth";
import { env } from "./config";
import { logger, logStartup, logShutdown, logSession, requestLoggerMiddleware } from "./logger";
import { AppError } from "./errors";

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false, // Disable in dev for Vite HMR
  crossOriginEmbedderPolicy: false, // Allow embedding for OAuth flows
}));

// Trust proxy for proper session handling in production
app.set('trust proxy', 1);

// Increase payload limits for large event datasets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Configure PostgreSQL session store with proper connection pooling
const PgSession = ConnectPgSimple(session);

// Session configuration with PostgreSQL store
const sessionStore = new PgSession({
  conString: env.DATABASE_URL,
  tableName: 'session',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  ttl: 24 * 60 * 60, // 24 hours session TTL
  schemaName: 'public' // Explicitly set schema name
});

// Handle session store errors gracefully
sessionStore.on('error', (err) => {
  logger.error('Session store error', { error: err.message, stack: err.stack });
  // Don't crash the server on session store errors
});

// Add connection error handling
sessionStore.on('connect', () => {
  logger.info('Session store connected to PostgreSQL');
});

sessionStore.on('disconnect', () => {
  logger.warn('Session store disconnected from PostgreSQL');
});

app.use(session({
  store: sessionStore,
  secret: env.SESSION_SECRET,
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Only save sessions when data is stored - prevents unnecessary sessions
  rolling: true, // Reset expiration on each request to keep active sessions alive
  name: 'remarkable.sid', // Use unique session name
  cookie: {
    secure: env.NODE_ENV === 'production', // Secure cookies in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for reasonable session length
    httpOnly: true, // Secure cookie - prevents XSS attacks
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax', // More secure sameSite policy
    path: '/', // Ensure cookie is sent for all paths
    domain: undefined // Let browser set domain automatically
  }
}));

// Configure Passport with session middleware
app.use(passport.initialize());
app.use(passport.session());

// Initialize minimal OAuth
initializeMinimalOAuth();

// Use winston request logging middleware
app.use(requestLoggerMiddleware);

// Session debugging and persistence middleware
app.use((req, res, next) => {
  logSession('Session activity', req.sessionID);

  // Ensure session is saved after each request
  const originalSend = res.send;
  res.send = function(data) {
    req.session.save((err) => {
      if (err) logger.error('Session save error', { error: err.message });
      originalSend.call(this, data);
    });
  };

  next();
});

(async () => {
  try {
    logStartup();
    const server = await registerRoutes(app);
    logger.info('Routes registered successfully');

    // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    // Handle AppError instances
    if (err instanceof AppError) {
      logger.error('Application error', {
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
      });

      if (!res.headersSent) {
        res.status(err.statusCode).json(err.toJSON());
      }
      return;
    }

    // Handle unexpected errors
    const status = (err as any).status || (err as any).statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error('Unexpected server error', {
      error: message,
      status,
      stack: err.stack,
    });

    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(status).json({
        error: message,
        code: 'INTERNAL_ERROR',
      });
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
  });

  // CRITICAL: Ensure API routes are fully registered before Vite setup
  // to prevent frontend from intercepting OAuth callbacks
  logger.info('All API routes registered, now setting up frontend');

  if (app.get("env") === "development") {
    logger.info('Setting up Vite (after API routes)');
    await setupVite(app, server);
    logger.info('Vite setup complete');
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = env.PORT;

  // Add error handling before listen
  server.on('error', (err: any) => {
    logger.error('Server error', { error: err.message, code: err.code });
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use`);
      logger.info('Please use the Clean Start workflow to kill existing processes');
      process.exit(1);
    }
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    logShutdown();
    server.close(() => {
      logger.info('HTTP server closed');
      pool.end(() => {
        logger.info('Database pool closed');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Try to start server with retry logic
  const startServer = () => {
    try {
      server.listen(port, "0.0.0.0", () => {
        logger.info(`Server listening on port ${port}`);
        log(`serving on port ${port}`);
      });
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  };

  startServer();

  } catch (error) {
    logger.error('Server startup failed', { error });
    process.exit(1);
  }
})();