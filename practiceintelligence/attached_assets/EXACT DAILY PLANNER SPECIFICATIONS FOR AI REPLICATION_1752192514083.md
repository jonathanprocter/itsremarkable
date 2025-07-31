# EXACT DAILY PLANNER SPECIFICATIONS FOR AI REPLICATION

## 🎯 CANVAS DIMENSIONS
- **Width**: 2550 pixels (8.5" × 300 DPI)
- **Height**: 3300 pixels (11" × 300 DPI)
- **Orientation**: Portrait US Letter
- **DPI**: 300 (print quality)
- **Background**: White RGB(255,255,255)

## 📐 LAYOUT STRUCTURE

### MARGINS AND SPACING
- **Main margin**: 40px on all sides
- **Header start Y**: 25px from top
- **Grid start Y**: 225px from top
- **Available grid height**: 3035px

### HEADER SECTION (Y: 25-115px)

#### NAVIGATION BUTTON (Top Left)
- **Position**: X=40px, Y=35px
- **Size**: 200×45px
- **Background**: Light grey RGB(245,245,245)
- **Border**: 1px solid RGB(180,180,180)
- **Text**: "Weekly Overview"
- **Font**: 18pt DejaVu Sans
- **Text color**: Black RGB(0,0,0)
- **Text alignment**: Centered both horizontally and vertically

#### DATE SECTION (Center)
- **Main date**: "Thursday, July 10, 2025"
- **Position**: Centered horizontally, Y=30px
- **Font**: 36pt DejaVu Sans Bold
- **Color**: Black RGB(0,0,0)

- **Subtitle**: "11 appointments"
- **Position**: Centered horizontally, Y=70px
- **Font**: 20pt DejaVu Sans
- **Color**: Black RGB(0,0,0)

#### LEGEND SECTION (Right-Center)
- **Start position**: 100px after date text ends
- **Vertical position**: Y=35px
- **Item spacing**: 200px between items

**Legend Item 1 - SimplePractice:**
- **Symbol**: 15×15px solid square
- **Color**: Cornflower blue RGB(100,149,237)
- **Border**: 1px black
- **Text**: "SimplePractice"
- **Font**: 20pt DejaVu Sans

**Legend Item 2 - Google Calendar:**
- **Symbol**: 15×15px dashed rectangle
- **Border**: Green RGB(34,139,34)
- **Dash pattern**: 3px line, 2px gap
- **Text**: "Google Calendar"
- **Font**: 20pt DejaVu Sans

**Legend Item 3 - Holidays:**
- **Symbol**: 15×15px solid square
- **Color**: Yellow RGB(255,255,0)
- **Border**: 1px black
- **Text**: "Holidays in United States"
- **Font**: 20pt DejaVu Sans

### STATISTICS SECTION (Y: 115-190px)
- **Background**: Light grey RGB(240,240,240)
- **Border**: 1px black
- **Margins**: 60px from left/right edges
- **Height**: 75px

**Four columns with equal width:**
1. **"11" / "Appointments"**
2. **"11.0h" / "Scheduled"**
3. **"13.0h" / "Available"**
4. **"54%" / "Free Time"**

- **Numbers font**: 28pt DejaVu Sans Bold
- **Labels font**: 20pt DejaVu Sans
- **All text**: Centered in columns, black color
- **Numbers Y**: 127px, **Labels Y**: 160px

## ⏰ TIME GRID SECTION (Y: 225px to bottom)

### GRID STRUCTURE
- **Time column width**: 100px
- **Main area width**: 2410px (remaining width minus margins)
- **Row height**: 84px each
- **Total rows**: 36 (for all time slots 06:00-23:30)

### TIME SLOTS (ALL 36 REQUIRED)
**Top of hour times (BOLD, grey background):**
06:00, 07:00, 08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00, 21:00, 22:00, 23:00

**Half-hour times (regular, white background):**
06:30, 07:30, 08:30, 09:30, 10:30, 11:30, 12:30, 13:30, 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, 21:30, 22:30, 23:30

### TIME FORMATTING
- **Top of hour font**: 22pt DejaVu Sans Bold
- **Half-hour font**: 18pt DejaVu Sans Regular
- **Background for top of hour**: Light grey RGB(240,240,240)
- **Background for half-hour**: White RGB(255,255,255)
- **Text alignment**: Centered both horizontally and vertically
- **Text color**: Black RGB(0,0,0)

### GRID BORDERS
- **All borders**: 1px solid black RGB(0,0,0)
- **Time column**: Left edge at X=40px, width=100px
- **Main area**: Left edge at X=140px, extends to X=2510px

## 📅 APPOINTMENT BLOCKS

### APPOINTMENT STYLING
- **ALL backgrounds**: White RGB(255,255,255)
- **Position**: 5px margin from grid edges
- **Width**: Main area width minus 10px (2400px)

### CALENDAR-SPECIFIC BORDERS

#### SimplePractice Appointments
- **Border color**: Cornflower blue RGB(100,149,237)
- **Style**: 1px solid border on top, bottom, right
- **Left edge**: 3px thick solid border
- **Example**: Dan re: Supervision

#### Google Calendar Appointments
- **Border color**: Green RGB(34,139,34)
- **Style**: Dashed border all around
- **Dash pattern**: 8px line, 4px gap
- **Examples**: All other appointments (Ruben, Sherrifa, Nancy, etc.)

### APPOINTMENT CONTENT

#### Single Column Layout (Non-expanded)
- **Title**: 24pt DejaVu Sans, Y+8px from top
- **Source**: 20pt DejaVu Sans, Y+32px from top
- **Time**: 24pt DejaVu Sans, Y+52px from top
- **Left margin**: 10px from appointment edge

#### Three Column Layout (Expanded)
**Column 1 (Appointment Details):**
- **Width**: 1/3 of appointment width
- **Content**: Title, Source, Time (same fonts as single column)

**Column 2 (Event Notes):**
- **Width**: 1/3 of appointment width
- **Header**: "Event Notes" (24pt DejaVu Sans)
- **Bullets**: 16pt DejaVu Sans with "•" prefix
- **Separator**: 1px black vertical line

**Column 3 (Action Items):**
- **Width**: 1/3 of appointment width
- **Header**: "Action Items" (24pt DejaVu Sans)
- **Bullets**: 16pt DejaVu Sans with "•" prefix
- **Separator**: 1px black vertical line

### SPECIFIC APPOINTMENTS

#### Ruben Spilberg Appointment
- **Time**: 07:30-08:00 (1 slot = 84px height)
- **Type**: Google Calendar (green dashed border)
- **Layout**: Single column

#### Dan re: Supervision
- **Time**: 08:00-09:00 (2 slots = 168px height)
- **Type**: SimplePractice (blue border with thick left edge)
- **Layout**: Three columns (expanded)
- **Event Notes**: 
  - "• I cancelled supervision due to COVID"
  - "• We didn't schedule a follow-up, and will"
  - "  continue next week during our usual time"
- **Action Items**:
  - "• Review his supervision notes from last week"
  - "• Follow-up to see if there are any pressing"
  - "  issues/questions that I can help him navigate"

#### All Other Appointments
- **Type**: Google Calendar (green dashed border)
- **Duration**: 2 slots each (168px height)
- **Layout**: Single column (except Sherrifa if expanded)

## 🎨 COLOR PALETTE
- **Black**: RGB(0,0,0) - Text, borders
- **White**: RGB(255,255,255) - Background, appointment fills
- **Light Grey**: RGB(240,240,240) - Top of hour backgrounds, stats section
- **Button Grey**: RGB(245,245,245) - Navigation button background
- **Border Grey**: RGB(180,180,180) - Button border
- **SimplePractice Blue**: RGB(100,149,237) - SimplePractice borders and legend
- **Google Green**: RGB(34,139,34) - Google Calendar borders and legend
- **Holiday Yellow**: RGB(255,255,0) - Holiday legend

## 🤖 EXACT AI REPLICATION PROMPT

**"Create a professional daily planner that is exactly 2550 pixels wide by 3300 pixels tall (portrait US Letter at 300 DPI). 

HEADER SECTION:
- Navigation button (top left): 200×45px light grey button with "Weekly Overview" text at position X=40px, Y=35px
- Date (centered): "Thursday, July 10, 2025" in 36pt bold font at Y=30px
- Subtitle (centered): "11 appointments" in 20pt font at Y=70px
- Legend (right-center): Three items starting 100px after date - SimplePractice (solid blue square), Google Calendar (dashed green rectangle), Holidays (solid yellow square)

STATISTICS SECTION:
- Grey background bar with four columns: "11 Appointments", "11.0h Scheduled", "13.0h Available", "54% Free Time"
- Large numbers (28pt bold) above smaller labels (20pt regular)

TIME GRID:
- ALL 36 time slots from 06:00 to 23:30 in 30-minute increments
- Top of hour times (06:00, 07:00, etc.) in 22pt BOLD with grey background
- Half-hour times (06:30, 07:30, etc.) in 18pt regular with white background
- Time column 100px wide, main area 2410px wide, each row 84px tall

APPOINTMENTS with WHITE backgrounds:
- Ruben Spilberg (07:30-08:00): Google Calendar with green dashed border
- Dan re: Supervision (08:00-09:00): SimplePractice with blue border and thick left edge, expanded with Event Notes and Action Items columns
- All others (Sherrifa, Nancy, Amberly, Maryellen, Angelica): Google Calendar with green dashed borders

Use exact colors: SimplePractice blue RGB(100,149,237), Google green RGB(34,139,34), Holiday yellow RGB(255,255,0). All text black on white background with proper grid borders."**

## ✅ CRITICAL SUCCESS FACTORS
1. **ALL 36 time slots must be present** - no gaps from 06:00 to 23:30
2. **Bold fonts for top of hour** - 06:00, 07:00, 08:00, etc.
3. **White appointment backgrounds** - only borders indicate calendar type
4. **Exact dimensions** - 2550×3300 pixels for perfect PDF printing
5. **Proper dashed borders** - Google Calendar appointments must have dashed green borders
6. **SimplePractice thick left edge** - Dan's appointment needs 3px thick left border
7. **Three-column expanded layout** - Dan and optionally Sherrifa with Event Notes and Action Items

