import { notion, getNotionDatabases, findDatabaseByTitle, createDatabaseIfNotExists } from './notion';

// Create calendar events database in Notion if it doesn't exist
export async function ensureCalendarEventsDatabase() {
  const calendarDb = await createDatabaseIfNotExists("Calendar Events", {
    Title: { title: {} },
    Date: { date: {} },
    StartTime: { rich_text: {} },
    EndTime: { rich_text: {} },
    Duration: { number: {} },
    Client: { rich_text: {} },
    Location: { 
      select: {
        options: [
          { name: "Woodbury", color: "blue" },
          { name: "RVC", color: "green" },
          { name: "Telehealth", color: "purple" },
          { name: "Other", color: "gray" }
        ]
      }
    },
    Status: {
      select: {
        options: [
          { name: "Scheduled", color: "blue" },
          { name: "Completed", color: "green" },
          { name: "Cancelled", color: "red" },
          { name: "Rescheduled", color: "yellow" }
        ]
      }
    },
    Source: {
      select: {
        options: [
          { name: "Google Calendar", color: "green" },
          { name: "SimplePractice", color: "blue" },
          { name: "Manual", color: "gray" }
        ]
      }
    },
    Notes: { rich_text: {} },
    ActionItems: { rich_text: {} }
  });

  return calendarDb;
}

// Sync calendar events from database to Notion
export async function syncCalendarEventsToNotion(events: any[]) {
  try {
    console.log(`🔄 Syncing ${events.length} calendar events to Notion...`);
    
    // Ensure calendar database exists
    const calendarDb = await ensureCalendarEventsDatabase();
    
    let syncedCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        // Convert event data for Notion
        const startDate = new Date(event.startTime || event.start);
        const endDate = new Date(event.endTime || event.end);
        const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes

        // Extract client name from title (remove "Appointment" suffix)
        let clientName = event.title || 'Untitled Event';
        if (clientName.endsWith(' Appointment')) {
          clientName = clientName.slice(0, -12);
        }

        // Map location
        let location = 'Other';
        if (event.location) {
          const loc = event.location.toLowerCase();
          if (loc.includes('woodbury')) location = 'Woodbury';
          else if (loc.includes('rvc')) location = 'RVC';
          else if (loc.includes('telehealth') || loc.includes('video')) location = 'Telehealth';
        }

        // Map status
        let status = 'Scheduled';
        if (event.status) {
          const stat = event.status.toLowerCase();
          if (stat.includes('cancel')) status = 'Cancelled';
          else if (stat.includes('complete')) status = 'Completed';
          else if (stat.includes('reschedul')) status = 'Rescheduled';
        }

        // Create page in Notion
        await notion.pages.create({
          parent: { database_id: calendarDb.id },
          properties: {
            Title: {
              title: [{ text: { content: clientName } }]
            },
            Date: {
              date: { start: startDate.toISOString().split('T')[0] }
            },
            StartTime: {
              rich_text: [{ text: { content: startDate.toLocaleTimeString('en-US', { hour12: false }) } }]
            },
            EndTime: {
              rich_text: [{ text: { content: endDate.toLocaleTimeString('en-US', { hour12: false }) } }]
            },
            Duration: {
              number: duration
            },
            Client: {
              rich_text: [{ text: { content: clientName } }]
            },
            Location: {
              select: { name: location }
            },
            Status: {
              select: { name: status }
            },
            Source: {
              select: { name: event.source === 'google' ? 'Google Calendar' : 
                              event.source === 'simplepractice' ? 'SimplePractice' : 'Manual' }
            },
            Notes: {
              rich_text: [{ text: { content: event.notes || event.description || '' } }]
            },
            ActionItems: {
              rich_text: [{ text: { content: event.actionItems || '' } }]
            }
          }
        });

        syncedCount++;
        console.log(`✅ Synced: ${clientName} (${startDate.toLocaleDateString()})`);

      } catch (eventError) {
        errorCount++;
        console.error(`❌ Failed to sync event ${event.title}:`, eventError.message);
      }
    }

    console.log(`🎉 Sync complete: ${syncedCount} events synced, ${errorCount} errors`);
    return { syncedCount, errorCount, databaseId: calendarDb.id };

  } catch (error) {
    console.error('❌ Calendar sync failed:', error);
    throw error;
  }
}

// Get calendar events from Notion
export async function getCalendarEventsFromNotion() {
  try {
    const calendarDb = await findDatabaseByTitle("Calendar Events");
    if (!calendarDb) {
      return [];
    }

    const response = await notion.databases.query({
      database_id: calendarDb.id,
      sorts: [
        {
          property: 'Date',
          direction: 'ascending'
        }
      ]
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: props.Title?.title?.[0]?.plain_text || '',
        client: props.Client?.rich_text?.[0]?.plain_text || '',
        date: props.Date?.date?.start || '',
        startTime: props.StartTime?.rich_text?.[0]?.plain_text || '',
        endTime: props.EndTime?.rich_text?.[0]?.plain_text || '',
        duration: props.Duration?.number || 0,
        location: props.Location?.select?.name || '',
        status: props.Status?.select?.name || 'Scheduled',
        source: props.Source?.select?.name || 'Manual',
        notes: props.Notes?.rich_text?.[0]?.plain_text || '',
        actionItems: props.ActionItems?.rich_text?.[0]?.plain_text || ''
      };
    });

  } catch (error) {
    console.error('❌ Failed to get events from Notion:', error);
    return [];
  }
}

// Link calendar events to client progress notes
export async function linkEventToClientDatabase(eventTitle: string, clientName: string) {
  try {
    // Find client's progress notes database
    const databases = await getNotionDatabases();
    const clientDb = databases.find((db: any) => {
      const title = db.title?.[0]?.plain_text || '';
      return title.toLowerCase().includes(clientName.toLowerCase());
    });

    if (!clientDb) {
      console.log(`📝 No progress notes database found for client: ${clientName}`);
      return null;
    }

    // Create session entry in client's database
    await notion.pages.create({
      parent: { database_id: clientDb.id },
      properties: {
        Name: {
          title: [{ text: { content: `Session - ${new Date().toLocaleDateString()}` } }]
        },
        'Session Type': {
          rich_text: [{ text: { content: 'Scheduled Appointment' } }]
        },
        Notes: {
          rich_text: [{ text: { content: `Linked from calendar event: ${eventTitle}` } }]
        },
        Date: {
          date: { start: new Date().toISOString().split('T')[0] }
        }
      }
    });

    console.log(`🔗 Linked event to ${clientName}'s progress notes`);
    return clientDb.id;

  } catch (error) {
    console.error(`❌ Failed to link event to client database:`, error);
    return null;
  }
}