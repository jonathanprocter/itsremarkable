import { Express } from 'express';
import { createServer } from 'http';
import eventsRouter from './events';
import healthRouter from './health';
import clientsRouter from './clients';
import calendarRouter from './calendar';
import analyticsRouter from './analytics';
import exportsRouter from './exports';
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
  app.use('/api/clients', clientsRouter);
  app.use('/api/calendar', calendarRouter);
  app.use('/api', analyticsRouter); // Includes session-notes, revenue, templates, conflicts
  app.use('/api', exportsRouter); // Export and download endpoints
  app.use('/api/health', healthRouter);
  app.use('/api', clientRoutes); // Legacy client routes (clientRoutes.ts)

  logger.info('All routes registered successfully');
  logger.debug('Route modules loaded', {
    modules: ['events', 'clients', 'calendar', 'analytics', 'exports', 'health'],
  });

  return server;
}
