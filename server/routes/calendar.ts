import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth-middleware';
import { logger, logIntegration } from '../logger';
import { AuthenticationError, ExternalServiceError } from '../errors';
import { env } from '../config';
import { oauthManager } from '../GoogleOAuthManager';

const router = Router();

/**
 * GET /api/calendar/sync
 * Sync events with Google Calendar
 */
router.get('/sync', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;

    logIntegration('google-calendar', 'Calendar sync requested', { userId });

    // Check authentication status using GoogleOAuthManager
    const authStatus = await oauthManager.checkAuthStatus(userId.toString());

    if (!authStatus.hasValidTokens) {
      throw new AuthenticationError('Google Calendar access token not found or invalid', {
        needsAuth: true,
        authUrl: '/api/auth/google',
      });
    }

    // Sync calendar events using the authenticated oauth client
    try {
      const events = await oauthManager.syncCalendarEvents(userId.toString(), 'primary');

      logIntegration('google-calendar', 'Calendar sync successful', {
        userId,
        eventCount: events.length,
      });

      res.json({
        success: true,
        hasToken: true,
        message: 'Google Calendar access verified',
        events,
      });
    } catch (error) {
      if (error.message.includes('AUTHENTICATION_REQUIRED') || 
          error.message.includes('REAUTHENTICATION_REQUIRED')) {
        throw new AuthenticationError('Google Calendar authentication expired', {
          needsAuth: true,
          authUrl: '/api/auth/google',
        });
      }

      logger.error('Google Calendar API error', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ExternalServiceError(
        'Google Calendar',
        'Failed to access Google Calendar API',
        {
          needsAuth: true,
          authUrl: '/api/auth/google',
        }
      );
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ExternalServiceError) {
      throw error;
    }
    logger.error('Calendar sync error', { error });
    throw new ExternalServiceError('Google Calendar', 'Calendar sync failed');
  }
});

/**
 * POST /api/calendar/import
 * Import events from Google Calendar
 */
router.post('/import', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const { startDate, endDate } = req.body;

    logIntegration('google-calendar', 'Calendar import requested', {
      userId,
      startDate,
      endDate,
    });

    // TODO: Implement Google Calendar import logic
    // This would:
    // 1. Fetch events from Google Calendar API
    // 2. Transform to app format
    // 3. Save to database with source: 'google'
    // 4. Return imported events

    res.json({
      success: true,
      message: 'Calendar import feature coming soon',
      imported: 0,
    });
  } catch (error) {
    logger.error('Calendar import error', { error });
    throw new ExternalServiceError('Google Calendar', 'Calendar import failed');
  }
});

/**
 * POST /api/calendar/export
 * Export events to Google Calendar
 */
router.post('/export', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const { eventIds } = req.body;

    logIntegration('google-calendar', 'Calendar export requested', {
      userId,
      eventCount: eventIds?.length || 0,
    });

    // TODO: Implement Google Calendar export logic
    // This would:
    // 1. Fetch events from database
    // 2. Transform to Google Calendar format
    // 3. Create events in Google Calendar
    // 4. Update database with calendarId and sourceId

    res.json({
      success: true,
      message: 'Calendar export feature coming soon',
      exported: 0,
    });
  } catch (error) {
    logger.error('Calendar export error', { error });
    throw new ExternalServiceError('Google Calendar', 'Calendar export failed');
  }
});

export default router;
