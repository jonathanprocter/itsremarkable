import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, AuthenticatedRequest } from '../auth-middleware';
import { logger } from '../logger';
import { ValidationError, NotFoundError, DatabaseError } from '../errors';

const router = Router();

/**
 * GET /api/events
 * Get all events for the authenticated user
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    logger.debug('Fetching events for user', { userId });

    const events = await storage.getAllEvents(userId);
    logger.debug('Events fetched successfully', {
      userId,
      count: events.length,
    });

    res.json(events);
  } catch (error) {
    logger.error('Failed to fetch events', { error });
    throw new DatabaseError('Failed to fetch events');
  }
});

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const eventData = req.body;

    // Validation
    if (!eventData.title || !eventData.startTime || !eventData.endTime) {
      throw new ValidationError('Missing required fields: title, startTime, endTime');
    }

    logger.debug('Creating event', { userId, title: eventData.title });

    const event = await storage.createEvent({
      ...eventData,
      userId,
    });

    logger.info('Event created successfully', {
      userId,
      eventId: event.id,
      title: event.title,
    });

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to create event', { error });
    throw new DatabaseError('Failed to create event');
  }
});

/**
 * PUT /api/events/:id
 * Update an existing event
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const eventId = parseInt(req.params.id);
    const updates = req.body;

    if (isNaN(eventId)) {
      throw new ValidationError('Invalid event ID');
    }

    logger.debug('Updating event', { userId, eventId });

    // Check if event exists and belongs to user
    const existingEvent = await storage.getEventById(eventId);
    if (!existingEvent) {
      throw new NotFoundError('Event', eventId);
    }

    if (existingEvent.userId !== userId) {
      throw new ValidationError('Not authorized to update this event');
    }

    const updatedEvent = await storage.updateEvent(eventId, updates);

    logger.info('Event updated successfully', {
      userId,
      eventId,
      title: updatedEvent.title,
    });

    res.json(updatedEvent);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to update event', { error });
    throw new DatabaseError('Failed to update event');
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const eventId = parseInt(req.params.id);

    if (isNaN(eventId)) {
      throw new ValidationError('Invalid event ID');
    }

    logger.debug('Deleting event', { userId, eventId });

    // Check if event exists and belongs to user
    const existingEvent = await storage.getEventById(eventId);
    if (!existingEvent) {
      throw new NotFoundError('Event', eventId);
    }

    if (existingEvent.userId !== userId) {
      throw new ValidationError('Not authorized to delete this event');
    }

    await storage.deleteEvent(eventId);

    logger.info('Event deleted successfully', { userId, eventId });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to delete event', { error });
    throw new DatabaseError('Failed to delete event');
  }
});

export default router;
