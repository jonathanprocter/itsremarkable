import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }

    throw Error("Failed to extract page ID");
}

export const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL!);

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: string}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
    // Array to store the child databases
    const childDatabases = [];

    try {
        // Query all child blocks in the specified page
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            // Process the results
            for (const block of response.results) {
                // Check if the block is a child database
                if (block.type === "child_database") {
                    const databaseId = block.id;

                    // Retrieve the database title
                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        // Add the database to our list
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            // Check if there are more results to fetch
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find get a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
    const databases = await getNotionDatabases();

    for (const db of databases) {
        if (db.title && Array.isArray(db.title) && db.title.length > 0) {
            const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title: string, properties: any) {
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

// Create Calendar Events database for real-time sync
export async function createCalendarEventsDatabase() {
    return await createDatabaseIfNotExists("Calendar Events", {
        Title: {
            title: {}
        },
        Description: {
            rich_text: {}
        },
        StartTime: {
            date: {}
        },
        EndTime: {
            date: {}
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
        Status: {
            select: {
                options: [
                    { name: "Scheduled", color: "blue" },
                    { name: "Confirmed", color: "green" },
                    { name: "Cancelled", color: "red" },
                    { name: "Completed", color: "gray" }
                ]
            }
        },
        Location: {
            rich_text: {}
        },
        CalendarId: {
            rich_text: {}
        },
        EventId: {
            rich_text: {}
        }
    });
}

// Sync calendar event to Notion
export async function syncEventToNotion(event: any, databaseId: string) {
    try {
        const properties = {
            Title: {
                title: [
                    {
                        text: {
                            content: event.title || "Untitled Event"
                        }
                    }
                ]
            },
            Description: {
                rich_text: [
                    {
                        text: {
                            content: event.description || ""
                        }
                    }
                ]
            },
            StartTime: {
                date: {
                    start: event.startTime || event.start
                }
            },
            EndTime: {
                date: {
                    start: event.endTime || event.end
                }
            },
            Source: {
                select: {
                    name: event.source === 'google' ? 'Google Calendar' : 
                          event.source === 'simplepractice' ? 'SimplePractice' : 'Manual'
                }
            },
            Status: {
                select: {
                    name: event.status === 'scheduled' ? 'Scheduled' :
                          event.status === 'confirmed' ? 'Confirmed' :
                          event.status === 'cancelled' ? 'Cancelled' : 'Scheduled'
                }
            },
            Location: {
                rich_text: [
                    {
                        text: {
                            content: event.location || ""
                        }
                    }
                ]
            },
            CalendarId: {
                rich_text: [
                    {
                        text: {
                            content: event.calendarId || ""
                        }
                    }
                ]
            },
            EventId: {
                rich_text: [
                    {
                        text: {
                            content: event.id || ""
                        }
                    }
                ]
            }
        };

        const response = await notion.pages.create({
            parent: {
                database_id: databaseId
            },
            properties
        });

        return response;
    } catch (error) {
        console.error("Error syncing event to Notion:", error);
        throw error;
    }
}

// Get all events from Notion database
export async function getNotionEvents(databaseId: string) {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
        });

        return response.results.map((page: any) => {
            const properties = page.properties;

            return {
                notionId: page.id,
                title: properties.Title?.title?.[0]?.plain_text || "Untitled Event",
                description: properties.Description?.rich_text?.[0]?.plain_text || "",
                startTime: properties.StartTime?.date?.start || null,
                endTime: properties.EndTime?.date?.start || null,
                source: properties.Source?.select?.name || "Manual",
                status: properties.Status?.select?.name || "Scheduled",
                location: properties.Location?.rich_text?.[0]?.plain_text || "",
                calendarId: properties.CalendarId?.rich_text?.[0]?.plain_text || "",
                eventId: properties.EventId?.rich_text?.[0]?.plain_text || "",
            };
        });
    } catch (error) {
        console.error("Error fetching events from Notion:", error);
        throw error;
    }
}