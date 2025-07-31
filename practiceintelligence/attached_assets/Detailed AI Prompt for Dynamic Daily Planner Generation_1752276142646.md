# Detailed AI Prompt for Dynamic Daily Planner Generation

## Project Overview
Create a dynamic daily planner generator that produces a professional, print-optimized HTML layout specifically designed for reMarkable Paper Pro e-ink tablets. The planner should be generated from appointment data and formatted for US Letter paper in portrait mode.

## Core Requirements

### 1. Layout Structure
- **Three-column grid layout**: Time column (90px), Appointments column (flexible), Notes column (120px)
- **30-minute time slots**: From 06:00 to 23:30 (36 total slots)
- **Portrait orientation**: Optimized for US Letter paper (8.5" x 11")
- **Print-ready**: Exact color reproduction with proper margins (0.75in)

### 2. Appointment Block Design
Each appointment should have a **horizontal three-zone layout**:

#### Left Zone (Appointment Info):
- Appointment title at the very top
- Blank line (0.3rem margin)
- Time and duration (e.g., "08:00 - 09:00 • 60 min")
- Another blank line (0.3rem margin)
- Status button (Scheduled/Canceled) - larger size for proportionality
- Vertical border line separating from middle zone

#### Middle Zone (Event Notes):
- Content starts below the status button level (0.25rem margin-top)
- Header: "📝 Event Notes:" (6px font, uppercase)
- Bulleted list with proper indentation (1.2rem padding-left)
- Only show vertical border line if content exists

#### Right Zone (Action Items):
- Content starts at same level as Event Notes
- Header: "✅ Action Items:" (6px font, uppercase)
- Bulleted list with proper indentation (1.2rem padding-left)

### 3. Visual Specifications

#### Color Palette:
```css
--cornflower: #6495ED (primary blue)
--navy: #243B53 (dark text)
--warm-white: #FAFAF7 (background)
--cool-grey: #AAB8C2 (secondary text)
--coral: #F6A99A (canceled appointments)
--border-grey: #E8E9EA (borders)
```

#### Typography:
- **Font family**: Georgia serif
- **Appointment titles**: 10px, font-weight 600
- **Time/duration**: 7px, cool-grey color
- **Status buttons**: 8px, uppercase, proper padding
- **Detail headers**: 6px, uppercase, navy color
- **Bullet content**: 5px, cool-grey, line-height 1.2

#### Appointment Heights:
- **60-minute appointments**: 80px (spans 2 time blocks)
- **90-minute appointments**: 120px (spans 3 time blocks)
- **30-minute appointments**: 40px (spans 1 time block)

### 4. Free Time Highlighting
Highlight free time slots in cornflower blue:
- Early morning: 06:00, 06:30, 07:00
- Any unscheduled 30-minute slots throughout the day
- Late evening: typically 21:00-23:30

### 5. Data Structure Requirements

#### Appointment Object:
```python
{
    "title": "Dan re: Supervision Notes",
    "start_time": "08:00",
    "end_time": "09:00",
    "duration_minutes": 60,
    "status": "scheduled",  # or "canceled"
    "event_notes": [
        "Review supervision notes from last week",
        "Discuss progress on current cases"
    ],
    "action_items": [
        "Schedule next supervision meeting",
        "Send summary notes by end of day"
    ]
}
```

### 6. Dynamic Generation Features

#### Header Section:
- Date display (e.g., "Friday, July 11, 2025")
- Statistics: Total appointments, scheduled count, canceled count, utilization percentage

#### Navigation (screen only):
- Previous Day, Today, Next Day buttons
- Hidden in print mode

#### Day Summary Section:
- Positioned close to 23:30 time slot
- Statistics grid (4 columns)
- Reflection notes area with dashed border

### 7. Technical Implementation

#### CSS Requirements:
- `@page` rules for print optimization
- Responsive grid layout with CSS Grid
- Proper z-index for overlapping appointments
- Print-specific media queries
- Color adjustment for e-ink displays

#### Python Functions Needed:
1. `parse_appointments()` - Convert input data to appointment objects
2. `calculate_free_time()` - Identify unscheduled time slots
3. `generate_time_slots()` - Create 30-minute time grid
4. `render_appointment()` - Generate HTML for single appointment
5. `calculate_statistics()` - Compute utilization and counts
6. `generate_html()` - Assemble complete HTML document

### 8. Conditional Logic

#### Vertical Lines:
- Show border between left and middle zones always
- Show border between middle and right zones ONLY if appointment has event_notes OR action_items

#### Content Sections:
- Only render "Event Notes" section if event_notes list is not empty
- Only render "Action Items" section if action_items list is not empty
- Apply `.has-content` class to middle zone if either section has content

### 9. Print Optimization
- Exact color reproduction with `-webkit-print-color-adjust: exact`
- Page break avoidance for appointment blocks
- Proper margin calculations for US Letter paper
- Font size adjustments for print clarity

### 10. Accessibility & Usability
- High contrast colors for e-ink displays
- Proper semantic HTML structure
- Clear visual hierarchy with appropriate spacing
- Touch-friendly navigation buttons (screen mode)

## Expected Output
Generate a Python Flask application that:
1. Accepts appointment data via JSON input
2. Processes the data to identify free time and calculate statistics
3. Renders the complete HTML with embedded CSS
4. Provides both screen and print-optimized views
5. Maintains exact visual specifications as described above

The final HTML should be production-ready for PDF export to reMarkable Paper Pro devices.

