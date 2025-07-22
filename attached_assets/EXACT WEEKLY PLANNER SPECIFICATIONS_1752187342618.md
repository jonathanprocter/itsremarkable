# EXACT WEEKLY PLANNER SPECIFICATIONS

## OVERALL CANVAS DIMENSIONS
- **Total Width**: 3300 pixels
- **Total Height**: 2550 pixels
- **DPI**: 300
- **Format**: PNG
- **Orientation**: Landscape US Letter (11" × 8.5")

## MARGINS AND SPACING
- **Left/Right Margins**: 30 pixels each
- **Top Margin**: 30 pixels
- **Bottom Margin**: 32 pixels (calculated)

## HEADER SECTION
- **Header Start Y**: 30 pixels from top
- **Header Height**: 120 pixels
- **Line Spacing Below Header**: 20 pixels
- **Header Font Size**: 60pt (DejaVu Sans Bold)
- **Header Text Color**: Black (0, 0, 0)

### Header Text Positioning
- **"WEEKLY PLANNER"**: 
  - X Position: 30 pixels (left margin)
  - Y Position: 30 pixels
- **"Week 27 — 7/7-7/13"**:
  - X Position: 2700 pixels (calculated: width - text_width - 100)
  - Y Position: 30 pixels

### Header Line
- **Start X**: 30 pixels
- **End X**: 3270 pixels (width - margin)
- **Y Position**: 140 pixels (header_height + line_spacing)
- **Line Width**: 2 pixels
- **Color**: Black

## TABLE SECTION
- **Table Start Y**: 170 pixels (header + line + spacing)
- **Available Table Height**: 2350 pixels
- **Total Rows**: 37 (1 header + 36 time slots)
- **Row Height**: 63 pixels each (2350 ÷ 37)

## COLUMN SPECIFICATIONS
- **Total Columns**: 8
- **Time Column Width**: 180 pixels
- **Day Column Width**: 441 pixels each (calculated: (3240 - 180) ÷ 7)

### Column Positions (X coordinates)
1. **Time Column**: 30 - 210 pixels
2. **Mon 7/7**: 210 - 651 pixels
3. **Tue 7/8**: 651 - 1092 pixels
4. **Wed 7/9**: 1092 - 1533 pixels
5. **Thu 7/10**: 1533 - 1974 pixels
6. **Fri 7/11**: 1974 - 2415 pixels
7. **Sat 7/12**: 2415 - 2856 pixels
8. **Sun 7/13**: 2856 - 3270 pixels

## TIME SLOT SPECIFICATIONS
- **Total Time Slots**: 36
- **Time Range**: 0600 - 2330
- **Increment**: 30 minutes

### Top of Hour Rows (Grey Background)
- **Times**: 0600, 0700, 0800, 0900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300
- **Background Color**: RGB(220, 220, 220)
- **Font Size**: 28pt (DejaVu Sans)
- **Font Color**: Black

### Half Hour Rows (White Background)
- **Times**: 0630, 0730, 0830, 0930, 1030, 1130, 1230, 1330, 1430, 1530, 1630, 1730, 1830, 1930, 2030, 2130, 2230, 2330
- **Background Color**: White (255, 255, 255)
- **Font Size**: 24pt (DejaVu Sans)
- **Font Color**: Black

## GRID SPECIFICATIONS
- **Header Row Border**: 2 pixels, Black
- **Cell Borders**: 1 pixel, Black
- **Vertical Lines**: Between all columns
- **Horizontal Lines**: Between all rows

## TEXT ALIGNMENT
- **All Times**: Centered both vertically and horizontally in cells
- **Column Headers**: Centered both vertically and horizontally in cells

---

# AI REPLICATION INSTRUCTIONS

## EXACT PROMPT FOR AI GENERATION

"Create a weekly planner with these EXACT specifications:

**CANVAS**: 3300 pixels wide × 2550 pixels tall, 300 DPI, landscape orientation

**HEADER**: 
- 'WEEKLY PLANNER' at top left (30px from left, 30px from top)
- 'Week 27 — 7/7-7/13' at top right (positioned 100px from right edge)
- Both texts use 60pt bold font, black color
- Horizontal line 2px thick, black, spanning from 30px to 3270px at Y=140px

**TABLE GRID**:
- 8 columns: Time (180px wide) + 7 day columns (441px wide each)
- 37 rows total: 1 header row + 36 time slots
- Each row 63px tall
- Strong black borders: 2px for header, 1px for cells
- Vertical lines between ALL columns

**TIME COLUMN** (ALL 36 slots required):
0600 (grey bg, 28pt font), 0630 (white bg, 24pt font), 0700 (grey bg, 28pt font), 0730 (white bg, 24pt font), 0800 (grey bg, 28pt font), 0830 (white bg, 24pt font), 0900 (grey bg, 28pt font), 0930 (white bg, 24pt font), 1000 (grey bg, 28pt font), 1030 (white bg, 24pt font), 1100 (grey bg, 28pt font), 1130 (white bg, 24pt font), 1200 (grey bg, 28pt font), 1230 (white bg, 24pt font), 1300 (grey bg, 28pt font), 1330 (white bg, 24pt font), 1400 (grey bg, 28pt font), 1430 (white bg, 24pt font), 1500 (grey bg, 28pt font), 1530 (white bg, 24pt font), 1600 (grey bg, 28pt font), 1630 (white bg, 24pt font), 1700 (grey bg, 28pt font), 1730 (white bg, 24pt font), 1800 (grey bg, 28pt font), 1830 (white bg, 24pt font), 1900 (grey bg, 28pt font), 1930 (white bg, 24pt font), 2000 (grey bg, 28pt font), 2030 (white bg, 24pt font), 2100 (grey bg, 28pt font), 2130 (white bg, 24pt font), 2200 (grey bg, 28pt font), 2230 (white bg, 24pt font), 2300 (grey bg, 28pt font), 2330 (white bg, 24pt font)

**GREY BACKGROUNDS**: Must extend horizontally across ALL columns for top-of-hour rows
**DAY COLUMNS**: Mon 7/7, Tue 7/8, Wed 7/9, Thu 7/10, Fri 7/11, Sat 7/12, Sun 7/13
**TEXT ALIGNMENT**: All text centered vertically and horizontally in cells"

## CRITICAL SUCCESS FACTORS
1. **MUST include ALL 36 time slots** - no gaps or missing times
2. **Grey backgrounds MUST span entire row** - not just time column
3. **Exact pixel dimensions** - 3300×2550 at 300 DPI
4. **Font size difference** - 28pt for top of hour, 24pt for half hour
5. **Strong vertical grid lines** between all 8 columns
6. **Proper text centering** in all cells

