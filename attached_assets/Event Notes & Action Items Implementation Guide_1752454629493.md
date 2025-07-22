# Event Notes & Action Items Implementation Guide

This guide specifically covers implementing the Event Notes and Action Items feature for your Weekly Planner PDF export system.

## 🎯 Overview

The enhanced system now supports expanded events that display:
- **Event Notes**: Meeting notes, important details, or context
- **Action Items**: Tasks, follow-ups, or next steps

Events with these details automatically expand in the daily view to show the additional information, exactly matching your application's behavior.

## 📊 Data Structure Changes

### Required Fields

Add these optional fields to your event objects:

```javascript
{
  // Existing fields...
  "id": "evt_001",
  "title": "Coffee with Nora",
  "startTime": "08:00",
  "endTime": "09:00",
  "source": "GOOGLE CALENDAR",
  
  // New fields for enhanced functionality
  "eventNotes": [
    "Fully's Revenue update and LMHC"
  ],
  "actionItems": [
    "See if she's interested in the Commack Office?"
  ]
}
```

### Field Formats

Both `eventNotes` and `actionItems` support:

**Array Format (Recommended):**
```json
"eventNotes": [
  "First note item",
  "Second note item"
],
"actionItems": [
  "First action item",
  "Second action item"
]
```

**String Format:**
```json
"eventNotes": "Single note as string",
"actionItems": "Single action as string"
```

### Alternative Field Names

For compatibility with existing systems:
- `notes` instead of `eventNotes`
- `actions` instead of `actionItems`

## 🔧 Implementation Steps

### Step 1: Update Your Data Export

Modify your application's data export to include event notes:

```javascript
// Example: Extracting data from your calendar system
function exportEventData(calendarEvent) {
  return {
    id: calendarEvent.id,
    title: calendarEvent.title,
    startTime: calendarEvent.startTime,
    endTime: calendarEvent.endTime,
    source: calendarEvent.source,
    
    // Add event notes if they exist
    eventNotes: calendarEvent.notes || calendarEvent.description_notes || [],
    actionItems: calendarEvent.actions || calendarEvent.todo_items || []
  };
}
```

### Step 2: Use Enhanced Templates

Replace your daily template with `daily_template_enhanced.html`:

```html
<!-- The enhanced template includes this structure -->
{{#hasDetails}}
<div class="event-details">
  {{#eventNotes}}
  <div class="event-section">
    <div class="section-title">Event Notes</div>
    <div class="section-content">
      {{#if (isArray this)}}
      <ul>
        {{#each this}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
      {{else}}
      {{this}}
      {{/if}}
    </div>
  </div>
  {{/eventNotes}}
  
  {{#actionItems}}
  <div class="event-section">
    <div class="section-title">Action Items</div>
    <div class="section-content">
      {{#if (isArray this)}}
      <ul>
        {{#each this}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
      {{else}}
      {{this}}
      {{/if}}
    </div>
  </div>
  {{/actionItems}}
</div>
{{/hasDetails}}
```

### Step 3: Update PDF Generator

Use the enhanced PDF generator:

**JavaScript:**
```javascript
const WeeklyPlannerPDFGenerator = require('./pdf_generator_enhanced');
```

**Python:**
```python
from pdf_generator_enhanced import WeeklyPlannerPDFGenerator
```

### Step 4: Test with Sample Data

Use the provided `sample_data_enhanced.json` to test:

```bash
# JavaScript
node test_enhanced.js

# Python
python pdf_generator_enhanced.py --input sample_data_enhanced.json --output test.pdf
```

## 🎨 Visual Customization

### Styling Event Notes

Customize the appearance in `daily_template_enhanced.html`:

```css
.event-details {
  margin-top: 8px;
  border-top: 1px solid #ddd;
  padding-top: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.section-title {
  font-weight: bold;
  font-size: 10px;
  color: #1976d2;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  font-size: 9px;
  line-height: 1.3;
  color: #333;
}

.section-content ul {
  margin: 0;
  padding-left: 12px;
}

.section-content li {
  margin-bottom: 2px;
  list-style-type: disc;
}
```

### Height Calculation

Adjust the automatic height calculation:

```javascript
calculateDailyEventHeight(event, hasDetails = false) {
  const duration = this.timeToMinutes(event.endTime) - this.timeToMinutes(event.startTime);
  const baseHeight = (duration / 30) * 30; // 30px per 30-minute slot
  
  if (hasDetails) {
    // Customize these values for your layout
    const pixelsPerItem = 15;        // Height per note/action item
    const sectionHeaderHeight = 20;  // Height for section headers
    const paddingHeight = 16;        // Additional padding
    
    const eventNotes = event.eventNotes || event.notes || [];
    const actionItems = event.actionItems || event.actions || [];
    
    const notesCount = Array.isArray(eventNotes) ? eventNotes.length : (eventNotes ? 1 : 0);
    const actionsCount = Array.isArray(actionItems) ? actionItems.length : (actionItems ? 1 : 0);
    
    let extraHeight = (notesCount + actionsCount) * pixelsPerItem + paddingHeight;
    if (notesCount > 0) extraHeight += sectionHeaderHeight;
    if (actionsCount > 0) extraHeight += sectionHeaderHeight;
    
    return Math.max(baseHeight, baseHeight + extraHeight);
  }
  
  return baseHeight;
}
```

## 🔄 Migration from Existing System

### Database Schema Updates

If storing in a database, add columns:

```sql
-- Example SQL for adding event notes support
ALTER TABLE events ADD COLUMN event_notes TEXT;
ALTER TABLE events ADD COLUMN action_items TEXT;

-- Store as JSON for array support
ALTER TABLE events ADD COLUMN event_notes_json JSON;
ALTER TABLE events ADD COLUMN action_items_json JSON;
```

### API Updates

Update your API endpoints:

```javascript
// Express.js example
app.get('/api/events/:eventId', (req, res) => {
  const event = getEventFromDatabase(req.params.eventId);
  
  res.json({
    ...event,
    eventNotes: JSON.parse(event.event_notes_json || '[]'),
    actionItems: JSON.parse(event.action_items_json || '[]')
  });
});

app.put('/api/events/:eventId/notes', (req, res) => {
  const { eventNotes, actionItems } = req.body;
  
  updateEventInDatabase(req.params.eventId, {
    event_notes_json: JSON.stringify(eventNotes || []),
    action_items_json: JSON.stringify(actionItems || [])
  });
  
  res.json({ success: true });
});
```

### Frontend Integration

Update your frontend to collect notes:

```javascript
// Example: Adding notes to event creation form
function createEventWithNotes(eventData) {
  const event = {
    ...eventData,
    eventNotes: document.getElementById('event-notes').value.split('\n').filter(note => note.trim()),
    actionItems: document.getElementById('action-items').value.split('\n').filter(item => item.trim())
  };
  
  return event;
}
```

## 📱 Replit Deployment

### Update Your Replit Project

1. **Replace Files:**
   - Upload `pdf_generator_enhanced.js` or `pdf_generator_enhanced.py`
   - Replace `daily_template.html` with `daily_template_enhanced.html`

2. **Update Dependencies:**
   ```bash
   # For JavaScript
   npm install
   
   # For Python
   pip install -r requirements.txt
   ```

3. **Test Enhanced Functionality:**
   ```bash
   # JavaScript
   node test_enhanced.js
   
   # Python
   python pdf_generator_enhanced.py --sample
   ```

### Environment Variables

Add to your Replit secrets if needed:

```bash
# Optional: Enable debug mode
DEBUG_EVENT_NOTES=true

# Optional: Customize height calculations
EVENT_NOTE_HEIGHT_PX=15
SECTION_HEADER_HEIGHT_PX=20
```

## 🧪 Testing Scenarios

### Test Cases

1. **Events without notes** - Should render normally
2. **Events with only notes** - Should show Event Notes section
3. **Events with only actions** - Should show Action Items section
4. **Events with both** - Should show both sections
5. **Mixed array/string formats** - Should handle both formats
6. **Long content** - Should expand appropriately
7. **Special characters** - Should escape HTML properly

### Sample Test Data

```javascript
const testEvents = [
  {
    id: 'test_1',
    title: 'No Notes Event',
    startTime: '09:00',
    endTime: '10:00',
    source: 'GOOGLE CALENDAR'
  },
  {
    id: 'test_2',
    title: 'Notes Only Event',
    startTime: '10:00',
    endTime: '11:00',
    source: 'GOOGLE CALENDAR',
    eventNotes: ['Important meeting note', 'Follow-up required']
  },
  {
    id: 'test_3',
    title: 'Actions Only Event',
    startTime: '11:00',
    endTime: '12:00',
    source: 'GOOGLE CALENDAR',
    actionItems: 'Send follow-up email'
  },
  {
    id: 'test_4',
    title: 'Full Details Event',
    startTime: '13:00',
    endTime: '14:30',
    source: 'GOOGLE CALENDAR',
    eventNotes: ['Discussed project timeline', 'Budget approved'],
    actionItems: ['Update project plan', 'Schedule next review', 'Notify stakeholders']
  }
];
```

## 🚀 Go Live Checklist

- [ ] Enhanced PDF generator deployed
- [ ] Enhanced daily template uploaded
- [ ] Sample data tested successfully
- [ ] Event notes display correctly in PDF
- [ ] Height calculations work properly
- [ ] Hyperlinks still function
- [ ] All existing functionality preserved
- [ ] Performance acceptable with expanded events
- [ ] Error handling for malformed data
- [ ] Documentation updated for team

## 📞 Support

If you encounter issues:

1. **Check the sample data** - Ensure your data matches the expected format
2. **Verify template** - Confirm you're using `daily_template_enhanced.html`
3. **Test components** - Use `test_enhanced.js` to verify individual parts
4. **Check console logs** - Look for height calculation or rendering errors
5. **Validate JSON** - Ensure event notes are properly formatted

The enhanced system maintains full backward compatibility while adding powerful new functionality for event details!

