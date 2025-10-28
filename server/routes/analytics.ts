import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, AuthenticatedRequest } from '../auth-middleware';
import { logger } from '../logger';
import { ValidationError, DatabaseError } from '../errors';

const router = Router();

/**
 * SESSION NOTES ROUTES
 */

/**
 * GET /api/session-notes
 * Get session notes, optionally filtered by client
 */
router.get('/session-notes', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;

    logger.debug('Fetching session notes', { userId, clientId });

    const notes = await storage.getSessionNotes(userId, clientId);

    res.json(notes);
  } catch (error) {
    logger.error('Failed to fetch session notes', { error });
    throw new DatabaseError('Failed to fetch session notes');
  }
});

/**
 * POST /api/session-notes
 * Create a new session note
 */
router.post('/session-notes', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const noteData = req.body;

    // Validation
    if (!noteData.clientId) {
      throw new ValidationError('Client ID is required');
    }

    logger.debug('Creating session note', {
      userId,
      clientId: noteData.clientId,
    });

    const note = await storage.createSessionNote({
      ...noteData,
      userId,
    });

    logger.info('Session note created successfully', {
      userId,
      noteId: note.id,
    });

    res.status(201).json(note);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to create session note', { error });
    throw new DatabaseError('Failed to create session note');
  }
});

/**
 * REVENUE TRACKING ROUTES
 */

/**
 * GET /api/revenue/analytics
 * Get revenue analytics and statistics
 */
router.get('/revenue/analytics', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;

    logger.debug('Fetching revenue analytics', { userId });

    // TODO: Implement actual analytics calculation
    // This would aggregate revenue data by time period, client, etc.

    res.json({
      totalRevenue: 0,
      thisMonth: 0,
      lastMonth: 0,
      byClient: [],
      byPeriod: [],
    });
  } catch (error) {
    logger.error('Failed to fetch revenue analytics', { error });
    throw new DatabaseError('Failed to fetch revenue analytics');
  }
});

/**
 * GET /api/revenue
 * Get revenue records
 */
router.get('/revenue', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;

    logger.debug('Fetching revenue records', { userId });

    // TODO: Implement revenue records retrieval
    res.json([]);
  } catch (error) {
    logger.error('Failed to fetch revenue records', { error });
    throw new DatabaseError('Failed to fetch revenue records');
  }
});

/**
 * APPOINTMENT TEMPLATE ROUTES
 */

/**
 * GET /api/templates
 * Get all appointment templates for user
 */
router.get('/templates', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;

    logger.debug('Fetching appointment templates', { userId });

    // TODO: Implement template retrieval
    res.json([]);
  } catch (error) {
    logger.error('Failed to fetch templates', { error });
    throw new DatabaseError('Failed to fetch templates');
  }
});

/**
 * POST /api/templates
 * Create a new appointment template
 */
router.post('/templates', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const templateData = req.body;

    // Validation
    if (!templateData.name) {
      throw new ValidationError('Template name is required');
    }

    logger.debug('Creating appointment template', {
      userId,
      name: templateData.name,
    });

    // TODO: Implement template creation
    res.status(201).json({
      id: 1,
      ...templateData,
      userId,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to create template', { error });
    throw new DatabaseError('Failed to create template');
  }
});

/**
 * SCHEDULE CONFLICT ROUTES
 */

/**
 * POST /api/conflicts/detect
 * Detect schedule conflicts for a potential appointment
 */
router.post('/conflicts/detect', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const { startTime, endTime, eventId } = req.body;

    if (!startTime || !endTime) {
      throw new ValidationError('Start time and end time are required');
    }

    logger.debug('Detecting schedule conflicts', {
      userId,
      startTime,
      endTime,
    });

    const conflicts = await storage.detectScheduleConflicts(
      userId,
      new Date(startTime),
      new Date(endTime),
      eventId ? parseInt(eventId) : undefined
    );

    res.json(conflicts);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to detect conflicts', { error });
    throw new DatabaseError('Failed to detect conflicts');
  }
});

/**
 * GET /api/conflicts
 * Get all schedule conflicts for user
 */
router.get('/conflicts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const resolved = req.query.resolved === 'true';

    logger.debug('Fetching schedule conflicts', { userId, resolved });

    const conflicts = await storage.getScheduleConflicts(userId, resolved);

    res.json(conflicts);
  } catch (error) {
    logger.error('Failed to fetch conflicts', { error });
    throw new DatabaseError('Failed to fetch conflicts');
  }
});

/**
 * PUT /api/conflicts/:id/resolve
 * Mark a conflict as resolved
 */
router.put('/conflicts/:id/resolve', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const conflictId = parseInt(req.params.id);

    if (isNaN(conflictId)) {
      throw new ValidationError('Invalid conflict ID');
    }

    logger.debug('Resolving conflict', { conflictId });

    await storage.resolveConflict(conflictId);

    logger.info('Conflict resolved successfully', { conflictId });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to resolve conflict', { error });
    throw new DatabaseError('Failed to resolve conflict');
  }
});

export default router;
