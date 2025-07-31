import { Express } from 'express';

// Authentication helper function
function getAuthenticatedUserId(req: any): number | null {
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
        return parsed;
      }
    }
  }

  if (req.session?.isAuthenticated && process.env.NODE_ENV === 'development') {
    return 2;
  }

  return null;
}

export function addIntegrationRoutes(app: Express) {
  // Notion Integration API Endpoints
  app.get('/api/notion/databases', async (req, res) => {
    try {
      const { getNotionDatabases } = await import('./notion');
      const databases = await getNotionDatabases();
      res.json({ databases, connected: true });
    } catch (error) {
      console.error('Notion databases error:', error);
      res.status(500).json({ error: 'Failed to fetch Notion databases', connected: false });
    }
  });

  app.post('/api/notion/sync', async (req, res) => {
    try {
      const { syncCalendarEventsToNotion } = await import('./notionCalendarSync');
      const { storage } = await import('./storage');
      
      // Get user ID
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get all events from local database
      const events = await storage.getEventsByUserId(userId);
      
      // Sync to Notion
      const result = await syncCalendarEventsToNotion(events);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Notion sync error:', error);
      res.status(500).json({ error: 'Failed to sync to Notion' });
    }
  });

  app.get('/api/notion/events/:databaseId', async (req, res) => {
    try {
      const { getNotionEvents } = await import('./notion');
      const events = await getNotionEvents(req.params.databaseId);
      res.json({ events });
    } catch (error) {
      console.error('Notion events error:', error);
      res.status(500).json({ error: 'Failed to fetch Notion events' });
    }
  });

  // Google Drive Integration API Endpoints
  app.get('/api/drive/folders', async (req, res) => {
    try {
      const { initializeDriveAPI, getOrCreateCalendarFolder, listCalendarFiles } = await import('./googleDrive');
      const { drive } = await initializeDriveAPI(req);
      const folderId = await getOrCreateCalendarFolder(drive);
      const files = await listCalendarFiles(drive, folderId);
      res.json({ folderId, files, connected: true });
    } catch (error) {
      console.error('Google Drive folders error:', error);
      res.status(500).json({ error: 'Failed to access Google Drive', connected: false });
    }
  });

  app.post('/api/drive/upload', async (req, res) => {
    try {
      const { initializeDriveAPI, getOrCreateCalendarFolder, uploadPDFToGoogleDrive } = await import('./googleDrive');
      const { drive } = await initializeDriveAPI(req);
      const folderId = await getOrCreateCalendarFolder(drive);
      
      const { filename, pdfData } = req.body;
      const pdfBuffer = Buffer.from(pdfData, 'base64');
      
      const result = await uploadPDFToGoogleDrive(drive, folderId, filename, pdfBuffer);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Google Drive upload error:', error);
      res.status(500).json({ error: 'Failed to upload to Google Drive' });
    }
  });

  app.get('/api/drive/storage', async (req, res) => {
    try {
      const { initializeDriveAPI, getDriveStorageInfo } = await import('./googleDrive');
      const { drive } = await initializeDriveAPI(req);
      const storageInfo = await getDriveStorageInfo(drive);
      res.json(storageInfo);
    } catch (error) {
      console.error('Google Drive storage error:', error);
      res.status(500).json({ error: 'Failed to get storage info' });
    }
  });

  // Real-time Sync API Endpoints
  app.post('/api/sync/google-calendar', async (req, res) => {
    try {
      const { syncGoogleCalendarEvents } = await import('./realTimeSync');
      const { startDate, endDate } = req.body;
      const result = await syncGoogleCalendarEvents(req, startDate, endDate);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      res.status(500).json({ error: 'Failed to sync Google Calendar' });
    }
  });

  app.post('/api/sync/notion-bidirectional', async (req, res) => {
    try {
      const { getCalendarEventsFromNotion, linkEventToClientDatabase } = await import('./notionCalendarSync');
      const { storage } = await import('./storage');
      
      // Get user ID
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get events from Notion and sync back to local database
      const notionEvents = await getCalendarEventsFromNotion();
      
      let syncedCount = 0;
      for (const event of notionEvents) {
        try {
          // Check if event already exists in local database
          const existingEvents = await storage.getEventsByUserId(userId);
          const exists = existingEvents.some(e => 
            e.title === event.title && 
            new Date(e.startTime).toDateString() === new Date(event.date).toDateString()
          );
          
          if (!exists) {
            // Create event in local database
            await storage.createEvent({
              title: event.title,
              startTime: new Date(`${event.date}T${event.startTime}`),
              endTime: new Date(`${event.date}T${event.endTime}`),
              description: event.notes,
              location: event.location,
              source: 'notion',
              status: event.status.toLowerCase(),
              userId: userId,
              actionItems: event.actionItems,
              notes: event.notes
            });
            syncedCount++;
          }
        } catch (eventError) {
          console.error('Failed to sync event from Notion:', eventError);
        }
      }
      
      res.json({ success: true, syncedFromNotion: syncedCount, totalNotionEvents: notionEvents.length });
    } catch (error) {
      console.error('Notion bidirectional sync error:', error);
      res.status(500).json({ error: 'Failed to sync from Notion' });
    }
  });

  app.post('/api/sync/complete', async (req, res) => {
    try {
      const { performCompleteSync } = await import('./realTimeSync');
      const result = await performCompleteSync(req);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Complete sync error:', error);
      res.status(500).json({ error: 'Failed to perform complete sync' });
    }
  });

  app.get('/api/integrations/status', async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check Notion connection
      let notionConnected = false;
      try {
        const { getNotionDatabases } = await import('./notion');
        await getNotionDatabases();
        notionConnected = true;
      } catch (error) {
        console.log('Notion not connected:', error.message);
      }

      // Check Google Drive connection
      let driveConnected = false;
      try {
        const { initializeDriveAPI } = await import('./googleDrive');
        await initializeDriveAPI(req);
        driveConnected = true;
      } catch (error) {
        console.log('Google Drive not connected:', error.message);
      }

      // Check Google Calendar connection
      let calendarConnected = false;
      try {
        const { storage } = await import('./storage');
        const user = await storage.getUserById(userId);
        if (user?.accessToken) {
          calendarConnected = true;
        }
      } catch (error) {
        console.log('Google Calendar not connected:', error.message);
      }

      res.json({
        notion: { connected: notionConnected },
        googleDrive: { connected: driveConnected },
        googleCalendar: { connected: calendarConnected },
        totalConnections: [notionConnected, driveConnected, calendarConnected].filter(Boolean).length
      });
    } catch (error) {
      console.error('Integration status error:', error);
      res.status(500).json({ error: 'Failed to check integration status' });
    }
  });

  console.log('✅ Integration routes registered successfully');
}