/**
 * Script to add sample Event Notes and Action Items to existing events
 * This demonstrates the enhanced PDF export functionality
 */

async function addSampleNotesAndActionItems() {
  console.log('🎯 Adding sample Event Notes and Action Items to your real upcoming week events...');
  
  // Get upcoming week date range
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Next Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Next Sunday
  
  console.log(`📅 Targeting events for week: ${startOfWeek.toDateString()} to ${endOfWeek.toDateString()}`);
  
  // Sample data for events with notes and action items - will be applied to matching events
  const sampleEnhancements = [
    {
      keywords: ["Dan", "Supervision", "supervision"],
      notes: [
        "Review quarterly performance metrics",
        "Discuss team development goals",
        "Address any outstanding issues"
      ],
      actionItems: [
        "Schedule follow-up meeting for next week",
        "Prepare performance review documents",
        "Send meeting summary to team"
      ]
    },
    {
      keywords: ["Sherrifa", "Hoosein"],
      notes: [
        "Previous session focused on anxiety management",
        "Client showed improvement in coping strategies"
      ],
      actionItems: [
        "Assign homework exercises",
        "Schedule next appointment",
        "Follow up on medication compliance"
      ]
    },
    {
      keywords: ["Coffee", "Nora"],
      notes: [
        "Fully's Revenue update and LMHC discussion",
        "Market analysis for Q3 expansion"
      ],
      actionItems: [
        "See if she's interested in the Commack Office?",
        "Send location details and lease terms"
      ]
    },
    {
      keywords: ["Blake", "Call"],
      notes: [
        "Received the receipt for the Pfizer transaction",
        "Discussed budget allocations for next quarter"
      ],
      actionItems: [
        "Client follow-up required",
        "Process insurance claim",
        "Update billing records"
      ]
    },
    {
      keywords: ["Vivian", "Meador"],
      notes: [
        "Review notes prior to our session",
        "Patient showing progress with treatment plan"
      ],
      actionItems: [
        "Send the Vivian email to let him know about the passing of her brother",
        "Adjust treatment plan as needed",
        "Schedule grief counseling resources"
      ]
    },
    {
      keywords: ["Appointment", "Patient", "Client"],
      notes: [
        "Standard appointment preparation completed",
        "Client file reviewed prior to session"
      ],
      actionItems: [
        "Follow up on previous session goals",
        "Update treatment notes",
        "Schedule next appointment if needed"
      ]
    }
  ];

  try {
    // First, get current events from the API
    const response = await fetch('/api/events');
    const events = await response.json();
    
    console.log(`📊 Found ${events.length} existing events in database`);
    
    // Filter events for the upcoming week
    const upcomingWeekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
    
    console.log(`📊 Found ${upcomingWeekEvents.length} events in upcoming week (${startOfWeek.toDateString()} to ${endOfWeek.toDateString()})`);
    
    if (upcomingWeekEvents.length === 0) {
      console.log('⚠️ No events found for upcoming week. Showing all events to select from:');
      events.slice(0, 10).forEach(event => {
        console.log(`- ${event.title} (${new Date(event.startTime).toDateString()})`);
      });
      return { success: false, message: 'No events found for upcoming week' };
    }
    
    let updatedCount = 0;
    
    // Update events with sample notes and action items
    for (const enhancement of sampleEnhancements) {
      // Find matching events by keywords (case-insensitive partial match)
      const matchingEvents = upcomingWeekEvents.filter(event => {
        if (!event.title) return false;
        return enhancement.keywords.some(keyword => 
          event.title.toLowerCase().includes(keyword.toLowerCase())
        );
      });
      
      for (const matchingEvent of matchingEvents) {
        console.log(`📝 Updating event: ${matchingEvent.title} (${new Date(matchingEvent.startTime).toDateString()})`);
        
        // Update the event with notes and action items
        const updateResponse = await fetch(`/api/events/${matchingEvent.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: enhancement.notes,
            actionItems: enhancement.actionItems
          })
        });
        
        if (updateResponse.ok) {
          console.log(`✅ Successfully updated: ${matchingEvent.title}`);
          updatedCount++;
        } else {
          console.error(`❌ Failed to update: ${matchingEvent.title}`);
        }
      }
    }
    
    // Also add generic notes to any remaining events without enhancements
    const unenhancedEvents = upcomingWeekEvents.filter(event => {
      return !sampleEnhancements.some(enhancement => 
        enhancement.keywords.some(keyword => 
          event.title && event.title.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    });
    
    console.log(`📝 Adding generic notes to ${unenhancedEvents.length} remaining events`);
    
    for (const event of unenhancedEvents.slice(0, 5)) { // Limit to first 5 to avoid overwhelming
      console.log(`📝 Adding generic notes to: ${event.title}`);
      
      const updateResponse = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: [
            "Event preparation completed",
            "Review client file and previous session notes"
          ],
          actionItems: [
            "Follow up on session outcomes",
            "Update treatment plan as needed"
          ]
        })
      });
      
      if (updateResponse.ok) {
        console.log(`✅ Successfully added generic notes to: ${event.title}`);
        updatedCount++;
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} events with sample notes and action items`);
    console.log('📦 Enhanced PDF exports will now show Event Notes and Action Items for these events');
    
    // Provide instructions for testing
    console.log('\n🔍 To test the enhanced exports:');
    console.log('1. Use "Enhanced Weekly with Notes" button');
    console.log('2. Use "Enhanced Daily with Notes" button');
    console.log('3. Use "Enhanced Weekly Package (8 Pages)" button');
    console.log('\nThese exports will include the Event Notes and Action Items in expanded layouts.');
    
    return {
      success: true,
      updatedCount,
      totalEvents: events.length
    };
    
  } catch (error) {
    console.error('❌ Error adding sample notes and action items:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make function available globally for testing
window.addSampleNotesAndActionItems = addSampleNotesAndActionItems;

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  console.log('🎯 Sample notes enhancement script loaded');
  console.log('Run addSampleNotesAndActionItems() to add sample data');
}

export { addSampleNotesAndActionItems };