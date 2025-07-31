import { google } from 'googleapis';

// Helper function to get authenticated user ID
function getAuthenticatedUserId(req: any): number | null {
  console.log('🔍 Checking authentication sources:', {
    'req.user?.id': req.user?.id,
    'req.session?.user?.id': req.session?.user?.id,
    'req.session?.userId': req.session?.userId,
    'req.session?.passport?.user': req.session?.passport?.user,
    'req.session?.isAuthenticated': req.session?.isAuthenticated,
    sessionExists: !!req.session,
    sessionId: req.session?.id
  });

  const sources = [
    req.user?.id,
    req.session?.user?.id,
    req.session?.userId,
    req.session?.passport?.user
  ];

  for (const source of sources) {
    if (source) {
      const parsed = parseInt(source);
      if (!isNaN(parsed) && parsed > 0) {
        console.log('✅ Found valid user ID:', parsed);
        return parsed;
      }
    }
  }

  console.log('❌ No valid user ID found in any source');

  if (req.session?.isAuthenticated && process.env.NODE_ENV === 'development') {
    console.log('🔧 Using development fallback user ID: 2');
    return 2;
  }

  return null;
}

// Import storage function
async function getUserById(userId: number) {
  const { storage } = await import('./storage');
  return await storage.getUserById(userId);
}
import { syncEventToNotion, createCalendarEventsDatabase, getNotionEvents } from './notion';

// Real-time Google Calendar sync
export async function syncGoogleCalendarEvents(req: any, startDate?: string, endDate?: string) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const user = await getUserById(userId);
  if (!user || !user.accessToken) {
    throw new Error('No valid Google access token found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // Get calendar list
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    const syncResults = {
      totalEvents: 0,
      newEvents: 0,
      updatedEvents: 0,
      calendars: calendars.length,
      errors: [] as string[]
    };

    // Default date range (current month)
    const timeMin = startDate || new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Sync events from each calendar
    for (const cal of calendars) {
      try {
        const events = await calendar.events.list({
          calendarId: cal.id,
          timeMin,
          timeMax,
          maxResults: 2500,
          singleEvents: true,
          orderBy: 'startTime'
        });

        const calendarEvents = events.data.items || [];
        syncResults.totalEvents += calendarEvents.length;

        for (const event of calendarEvents) {
          if (!event.start || !event.end) continue;

          const eventData = {
            title: event.summary || 'Untitled Event',
            description: event.description || '',
            startTime: event.start.dateTime || event.start.date,
            endTime: event.end.dateTime || event.end.date,
            source: 'google',
            calendarId: cal.id,
            location: event.location || '',
            status: event.status === 'cancelled' ? 'cancelled' : 'scheduled',
            allDay: !event.start.dateTime,
            userId: userId,
            notes: '',
            actionItems: ''
          };

          try {
            // Check if event already exists
            const existingEvents = await getEventsByDateRange(
              userId,
              new Date(eventData.startTime),
              new Date(eventData.endTime)
            );

            const existingEvent = existingEvents.find(e => 
              e.calendarId === cal.id && 
              e.title === eventData.title &&
              e.startTime?.toISOString() === new Date(eventData.startTime).toISOString()
            );

            if (existingEvent) {
              // Update existing event
              await updateEvent(existingEvent.id, eventData);
              syncResults.updatedEvents++;
            } else {
              // Create new event
              await createEvent(eventData);
              syncResults.newEvents++;
            }
          } catch (error) {
            console.error('Error syncing individual event:', error);
            syncResults.errors.push(`Failed to sync event: ${eventData.title}`);
          }
        }
      } catch (error) {
        console.error(`Error syncing calendar ${cal.id}:`, error);
        syncResults.errors.push(`Failed to sync calendar: ${cal.summary || cal.id}`);
      }
    }

    return syncResults;
  } catch (error) {
    console.error('Error in Google Calendar sync:', error);
    throw error;
  }
}

// Real-time Notion sync
export async function syncCalendarEventsToNotion(req: any) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Create or get Calendar Events database in Notion
    const calendarEventsDB = await createCalendarEventsDatabase();

    // Get recent events from database (last 30 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const events = await getEventsByDateRange(userId, startDate, endDate);

    const syncResults = {
      totalEvents: events.length,
      syncedEvents: 0,
      errors: [] as string[]
    };

    // Get existing Notion events to avoid duplicates
    const existingNotionEvents = await getNotionEvents(calendarEventsDB.id);
    const existingEventIds = new Set(existingNotionEvents.map(e => e.eventId));

    // Sync each event to Notion
    for (const event of events) {
      try {
        // Skip if already synced
        if (existingEventIds.has(event.id)) {
          continue;
        }

        await syncEventToNotion(event, calendarEventsDB.id);
        syncResults.syncedEvents++;
      } catch (error) {
        console.error('Error syncing event to Notion:', error);
        syncResults.errors.push(`Failed to sync event: ${event.title}`);
      }
    }

    return {
      ...syncResults,
      databaseId: calendarEventsDB.id,
      databaseUrl: `https://notion.so/${calendarEventsDB.id.replace(/-/g, '')}`
    };
  } catch (error) {
    console.error('Error syncing to Notion:', error);
    throw error;
  }
}

// Bidirectional sync - sync changes from Notion back to local database
export async function syncNotionChangesToLocal(req: any) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get Calendar Events database
    const calendarEventsDB = await createCalendarEventsDatabase();
    const notionEvents = await getNotionEvents(calendarEventsDB.id);

    const syncResults = {
      totalNotionEvents: notionEvents.length,
      updatedLocalEvents: 0,
      newLocalEvents: 0,
      errors: [] as string[]
    };

    for (const notionEvent of notionEvents) {
      try {
        if (!notionEvent.eventId) continue;

        // Find corresponding local event
        const localEvents = await getEventsByDateRange(
          userId,
          new Date(notionEvent.startTime),
          new Date(notionEvent.startTime)
        );

        const localEvent = localEvents.find(e => e.id === notionEvent.eventId);

        const eventData = {
          title: notionEvent.title,
          description: notionEvent.description,
          startTime: notionEvent.startTime,
          endTime: notionEvent.endTime,
          source: notionEvent.source.toLowerCase().replace(' ', ''),
          location: notionEvent.location,
          status: notionEvent.status.toLowerCase(),
          userId: userId,
          notes: '',
          actionItems: ''
        };

        if (localEvent) {
          // Update existing local event
          await updateEvent(localEvent.id, eventData);
          syncResults.updatedLocalEvents++;
        } else {
          // Create new local event
          await createEvent(eventData);
          syncResults.newLocalEvents++;
        }
      } catch (error) {
        console.error('Error syncing Notion event to local:', error);
        syncResults.errors.push(`Failed to sync Notion event: ${notionEvent.title}`);
      }
    }

    return syncResults;
  } catch (error) {
    console.error('Error syncing Notion changes to local:', error);
    throw error;
  }
}

// Complete real-time sync workflow
export async function performCompleteSync(req: any) {
  try {
    console.log('🔄 Starting complete real-time sync...');

    // Step 1: Sync Google Calendar events
    const googleSyncResults = await syncGoogleCalendarEvents(req);
    console.log('✅ Google Calendar sync completed:', googleSyncResults);

    // Step 2: Sync events to Notion
    const notionSyncResults = await syncCalendarEventsToNotion(req);
    console.log('✅ Notion sync completed:', notionSyncResults);

    // Step 3: Sync Notion changes back to local
    const bidirectionalSyncResults = await syncNotionChangesToLocal(req);
    console.log('✅ Bidirectional sync completed:', bidirectionalSyncResults);

    return {
      googleSync: googleSyncResults,
      notionSync: notionSyncResults,
      bidirectionalSync: bidirectionalSyncResults,
      timestamp: new Date().toISOString(),
      success: true
    };
  } catch (error) {
    console.error('❌ Complete sync failed:', error);
    throw error;
  }
}