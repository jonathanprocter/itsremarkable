# Weekly Planner PDF Export with Event Notes & Action Items

A comprehensive solution for exporting weekly planner data as an 8-page PDF with bidirectional hyperlinks and support for expanded event details including Event Notes and Action Items. This system replicates the exact visual appearance of your web application while adding sophisticated navigation capabilities.

## 🆕 Enhanced Features

- **Event Notes & Action Items**: Support for expanded events with detailed notes and action items
- **Dynamic Event Heights**: Events automatically expand to accommodate additional content
- **Exact Visual Replication**: Maintains pixel-perfect consistency with expanded event views
- **Bidirectional Hyperlinks**: Seamless navigation between weekly and daily views
- **8-Page PDF Structure**: 1 weekly overview (landscape) + 7 daily views (portrait)
- **Multiple Implementation Options**: Both JavaScript (Node.js) and Python versions available

## 📋 Event Data Structure with Notes

### Enhanced Event Object

```javascript
{
  id: string,                    // Unique event identifier
  title: string,                 // Event title/name
  startTime: string,             // Start time in HH:MM format (24-hour)
  endTime: string,               // End time in HH:MM format (24-hour)
  source: string,                // Event source ("GOOGLE CALENDAR", "OUTLOOK", etc.)
  description?: string,          // Optional event description
  
  // Enhanced fields for notes and action items
  eventNotes?: string[] | string,    // Event notes (array or single string)
  actionItems?: string[] | string,   // Action items (array or single string)
  
  // Alternative field names (for compatibility)
  notes?: string[] | string,         // Alternative to eventNotes
  actions?: string[] | string        // Alternative to actionItems
}
```

### Sample Data with Event Notes

```json
{
  "weekNumber": 28,
  "startDate": "2025-07-14",
  "endDate": "2025-07-20",
  "dates": {
    "monday": "2025-07-14",
    "tuesday": "2025-07-15"
  },
  "days": {
    "monday": [
      {
        "id": "evt_001",
        "title": "Coffee with Nora",
        "startTime": "08:00",
        "endTime": "09:00",
        "source": "GOOGLE CALENDAR",
        "eventNotes": [
          "Fully's Revenue update and LMHC"
        ],
        "actionItems": [
          "See if she's interested in the Commack Office?"
        ]
      }
    ],
    "tuesday": [
      {
        "id": "evt_002",
        "title": "Vivian Meador Appointment",
        "startTime": "19:00",
        "endTime": "20:00",
        "source": "GOOGLE CALENDAR",
        "eventNotes": "Review notes prior to our session",
        "actionItems": [
          "Send the Vivian email to let him know about the passing of her brother"
        ]
      }
    ]
  }
}
```

## 🚀 Implementation Options

### Option 1: JavaScript/Node.js (Recommended for Replit)

**Files:**
- `pdf_generator_enhanced.js` - Enhanced PDF generator with event notes
- `daily_template_enhanced.html` - Enhanced daily template
- `app.js` - Express server (update to use enhanced generator)

**Installation:**
```bash
npm install puppeteer handlebars pdf-lib express cors
```

**Usage:**
```javascript
const WeeklyPlannerPDFGenerator = require('./pdf_generator_enhanced');

const generator = new WeeklyPlannerPDFGenerator();
await generator.initialize();
await generator.generatePDF(weekData, 'output.pdf');
await generator.close();
```

### Option 2: Python

**Files:**
- `pdf_generator_enhanced.py` - Python PDF generator
- `requirements.txt` - Python dependencies

**Installation:**
```bash
pip install -r requirements.txt
```

**Usage:**
```bash
# Using sample data
python pdf_generator_enhanced.py --sample --output weekly-planner.pdf

# Using custom data file
python pdf_generator_enhanced.py --input data.json --output weekly-planner.pdf
```

**Python API Usage:**
```python
from pdf_generator_enhanced import WeeklyPlannerPDFGenerator
import asyncio

async def generate_pdf():
    generator = WeeklyPlannerPDFGenerator()
    await generator.initialize()
    await generator.generate_pdf(week_data, 'output.pdf')
    await generator.close()

asyncio.run(generate_pdf())
```

## 📱 Event Notes Display

### Visual Representation

When events contain `eventNotes` or `actionItems`, they are displayed in expanded format:

```
┌─────────────────────────────────────────┐
│ Coffee with Nora                        │
│ GOOGLE CALENDAR                         │
│ 08:00-09:00                            │
├─────────────────────────────────────────┤
│ EVENT NOTES                             │
│ • Fully's Revenue update and LMHC       │
│                                         │
│ ACTION ITEMS                            │
│ • See if she's interested in the        │
│   Commack Office?                       │
└─────────────────────────────────────────┘
```

### Dynamic Height Calculation

Events with notes automatically expand:
- **Base height**: Proportional to event duration
- **Additional height**: Calculated based on content
  - +20px for each section header (Event Notes, Action Items)
  - +15px per note/action item
  - Minimum height maintained for readability

## 🔧 Replit Setup Instructions

### Step 1: Upload Enhanced Files

Upload these files to your Replit project:

**Core Files:**
- `pdf_generator_enhanced.js` (or `pdf_generator_enhanced.py`)
- `daily_template_enhanced.html`
- `weekly_template.html`
- `shared_styles.css`

**Configuration:**
- `package.json` (for Node.js) or `requirements.txt` (for Python)
- `.replit`
- `replit.nix`

### Step 2: Update Your Application

**For JavaScript/Node.js:**

Update your `app.js` to use the enhanced generator:

```javascript
const WeeklyPlannerPDFGenerator = require('./pdf_generator_enhanced');

// Replace the old generator initialization
const pdfGenerator = new WeeklyPlannerPDFGenerator();
```

**For Python:**

Create a Flask app wrapper:

```python
from flask import Flask, request, send_file
from pdf_generator_enhanced import WeeklyPlannerPDFGenerator
import asyncio
import tempfile

app = Flask(__name__)

@app.route('/export-pdf', methods=['POST'])
async def export_pdf():
    week_data = request.json
    
    generator = WeeklyPlannerPDFGenerator()
    await generator.initialize()
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        await generator.generate_pdf(week_data, tmp.name)
        await generator.close()
        
        return send_file(tmp.name, as_attachment=True, 
                        download_name='weekly-planner.pdf')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
```

### Step 3: Test with Enhanced Data

Use the sample data with event notes:

```javascript
const sampleData = {
  // ... basic week structure
  "days": {
    "monday": [
      {
        "id": "evt_001",
        "title": "Coffee with Nora",
        "startTime": "08:00",
        "endTime": "09:00",
        "source": "GOOGLE CALENDAR",
        "eventNotes": ["Fully's Revenue update and LMHC"],
        "actionItems": ["See if she's interested in the Commack Office?"]
      }
    ]
  }
};
```

## 🎨 Customization

### Event Notes Styling

Modify the CSS in `daily_template_enhanced.html`:

```css
.event-details {
  margin-top: 8px;
  border-top: 1px solid #ddd;
  padding-top: 8px;
}

.section-title {
  font-weight: bold;
  font-size: 10px;
  color: #1976d2;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.section-content ul {
  margin: 0;
  padding-left: 12px;
}
```

### Height Calculation

Adjust the height calculation in the generator:

```javascript
calculateDailyEventHeight(event, hasDetails = false) {
  const duration = this.timeToMinutes(event.endTime) - this.timeToMinutes(event.startTime);
  const baseHeight = (duration / 30) * 30;
  
  if (hasDetails) {
    // Customize these values for your needs
    const pixelsPerItem = 15;
    const sectionHeaderHeight = 20;
    
    // Calculate content
    const notesCount = Array.isArray(event.eventNotes) ? event.eventNotes.length : (event.eventNotes ? 1 : 0);
    const actionsCount = Array.isArray(event.actionItems) ? event.actionItems.length : (event.actionItems ? 1 : 0);
    
    let extraHeight = (notesCount + actionsCount) * pixelsPerItem;
    if (notesCount > 0) extraHeight += sectionHeaderHeight;
    if (actionsCount > 0) extraHeight += sectionHeaderHeight;
    
    return Math.max(baseHeight, baseHeight + extraHeight);
  }
  
  return baseHeight;
}
```

## 🔍 Data Migration

### From Existing Systems

If your current system uses different field names:

```javascript
// Normalize event data before PDF generation
function normalizeEventData(events) {
  return events.map(event => ({
    ...event,
    eventNotes: event.eventNotes || event.notes || event.meeting_notes,
    actionItems: event.actionItems || event.actions || event.todo_items
  }));
}
```

### Field Compatibility

The system supports multiple field name variations:
- `eventNotes` or `notes`
- `actionItems` or `actions`
- Both string and array formats

## 📊 Performance Considerations

### Event Height Optimization

- Events without notes use standard height calculation
- Events with notes calculate height dynamically
- PDF generation time increases slightly with expanded events
- Memory usage scales with content volume

### Best Practices

1. **Limit Note Length**: Keep individual notes under 100 characters
2. **Batch Processing**: Generate PDFs for single weeks rather than multiple weeks
3. **Content Validation**: Validate note content before PDF generation
4. **Caching**: Consider caching PDFs for frequently accessed weeks

## 🐛 Troubleshooting

### Common Issues

**Events Not Expanding:**
- Verify `eventNotes` or `actionItems` fields are present
- Check that template uses `daily_template_enhanced.html`
- Ensure Handlebars helpers are registered

**Height Calculation Issues:**
- Adjust `pixelsPerItem` and `sectionHeaderHeight` values
- Test with various content lengths
- Check CSS styling for overflow issues

**Template Rendering Errors:**
- Validate JSON data structure
- Check for special characters in notes
- Ensure proper HTML escaping

### Debug Mode

Enable debug logging:

```javascript
// In JavaScript version
console.log('Event details:', {
  hasDetails: event.hasDetails,
  eventNotes: event.eventNotes,
  actionItems: event.actionItems,
  calculatedHeight: height
});
```

```python
# In Python version
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📚 API Reference

### Enhanced Event Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `eventNotes` | `string[]` or `string` | Event notes to display | No |
| `actionItems` | `string[]` or `string` | Action items to display | No |
| `notes` | `string[]` or `string` | Alternative to eventNotes | No |
| `actions` | `string[]` or `string` | Alternative to actionItems | No |

### Template Variables

| Variable | Type | Description |
|----------|------|-------------|
| `hasDetails` | `boolean` | Whether event has notes/actions |
| `eventNotes` | `array` or `string` | Normalized event notes |
| `actionItems` | `array` or `string` | Normalized action items |

## 🎯 Next Steps

1. **Test with Sample Data**: Use the provided sample data to verify functionality
2. **Customize Styling**: Adjust colors, fonts, and spacing to match your brand
3. **Integrate with Your App**: Update your application to include event notes
4. **Deploy to Production**: Use Replit's deployment features for live access

The enhanced system now fully supports event notes and action items while maintaining all existing functionality and visual consistency!

