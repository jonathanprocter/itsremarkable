import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";
import http from "http";
import { configureGoogleStrategy, configurePassportSerialization } from "./oauth-fix";

const app = express();

// Trust proxy for proper session handling in production
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure PostgreSQL session store with proper connection pooling
const PgSession = ConnectPgSimple(session);

// Session configuration with PostgreSQL store
const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL!,
  tableName: 'session',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  ttl: 24 * 60 * 60, // 24 hours session TTL
  schemaName: 'public' // Explicitly set schema name
});

// Handle session store errors gracefully
sessionStore.on('error', (err) => {
  console.error('Session store error:', err);
  // Don't crash the server on session store errors
});

// Add connection error handling
sessionStore.on('connect', () => {
  console.log('✅ Session store connected to PostgreSQL');
});

sessionStore.on('disconnect', () => {
  console.warn('⚠️ Session store disconnected from PostgreSQL');
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'remarkable-planner-secret-key-2025',
  resave: false, // Don't save session if unmodified
  saveUninitialized: true, // Allow session creation for OAuth flow
  rolling: false, // Don't reset expiration on each request to maintain stable sessions
  name: 'remarkable.sid', // Use unique session name
  cookie: {
    secure: false, // Must be false for HTTP in development
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for persistent login
    httpOnly: false, // Allow client-side access for debugging
    sameSite: 'lax', // Use lax for better compatibility
    path: '/', // Ensure cookie is sent for all paths
    domain: undefined // Let browser set domain automatically
  }
}));

// Configure Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Google OAuth strategy
configureGoogleStrategy();
configurePassportSerialization();

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('Starting server setup...');
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Server error:', err);
    
    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process, just log the error
  });

  // CRITICAL: Ensure API routes are fully registered before Vite setup
  // to prevent frontend from intercepting OAuth callbacks
  console.log('✅ All API routes registered, now setting up frontend...');
  
  if (app.get("env") === "development") {
    console.log('Setting up Vite (after API routes)...');
    await setupVite(app, server);
    console.log('Vite setup complete');
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Add error handling before listen
  server.on('error', (err: any) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      console.log('Please use the Clean Start workflow to kill existing processes');
      process.exit(1);
    }
  });
  
  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed');
      pool.end(() => {
        console.log('Database pool closed');
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
        log(`serving on port ${port}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
  
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
})();
