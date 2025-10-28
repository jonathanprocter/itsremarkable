import { Express } from 'express';
import { createServer } from 'http';
import eventsRouter from './events';
import healthRouter from './health';
import clientRoutes from '../clientRoutes';
import { addMinimalOAuthRoutes } from '../minimal-oauth';
import { logger } from '../logger';

/**
 * Register all application routes
 * Routes are organized by domain for better maintainability
 */
export async function registerRoutes(app: Express) {
  logger.info('Registering application routes');

  // Create HTTP server first
  const server = createServer(app);

  // OAuth authentication routes
  addMinimalOAuthRoutes(app);
  logger.debug('OAuth routes registered');

  // Domain-specific routes
  app.use('/api/events', eventsRouter);
  app.use('/api/health', healthRouter);
  app.use('/api', clientRoutes);

  logger.info('All routes registered successfully');

  return server;
}
