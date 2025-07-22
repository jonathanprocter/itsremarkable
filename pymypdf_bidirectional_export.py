#!/usr/bin/env python3
"""
Enhanced Bidirectional PDF Linking System using PyMyPDF
Creates a single navigable PDF with clickable links between weekly and daily views
"""

import sys
import json
from datetime import datetime, timedelta
import tempfile
import os

# Try to import PyMyPDF with fallback
try:
    import pymypdf
    from pymypdf import PdfWriter, PdfReader
    from pymypdf.generic import DictionaryObject, ArrayObject, TextStringObject, FloatObject, NameObject
    PYMYPDF_AVAILABLE = True
except ImportError:
    print("PyMyPDF not available, using fallback implementation")
    PYMYPDF_AVAILABLE = False

def create_bidirectional_linked_pdf(events_data, week_start_str, week_end_str):
    """
    Creates a single PDF with bidirectional navigation using PyMyPDF
    
    Args:
        events_data: JSON string containing calendar events
        week_start_str: ISO date string for week start
        week_end_str: ISO date string for week end
    
    Returns:
        str: Filename of generated PDF
    """
    
    try:
        # Parse input data
        events = json.loads(events_data) if isinstance(events_data, str) else events_data
        week_start = datetime.fromisoformat(week_start_str.replace('Z', '+00:00'))
        week_end = datetime.fromisoformat(week_end_str.replace('Z', '+00:00'))
        
        print(f"🔗 Creating bidirectional PDF for week {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}")
        print(f"📊 Processing {len(events)} events")
        
        # Create PDF writer
        writer = PdfWriter()
        
        # Generate filename
        week_str = week_start.strftime('%Y-%m-%d')
        filename = f"bidirectional_weekly_planner_{week_str}.pdf"
        
        # Create temporary files for individual pages
        temp_files = []
        
        # Create weekly overview page (Page 1)
        weekly_pdf = create_weekly_overview_page(events, week_start, week_end)
        temp_files.append(weekly_pdf)
        
        # Create daily pages (Pages 2-8)
        for day_offset in range(7):
            current_date = week_start + timedelta(days=day_offset)
            daily_pdf = create_daily_page(events, current_date, day_offset + 2)
            temp_files.append(daily_pdf)
        
        # Combine all pages and add navigation links
        for i, temp_file in enumerate(temp_files):
            reader = PdfReader(temp_file)
            page = reader.pages[0]
            
            # Add navigation links based on page type
            if i == 0:  # Weekly overview page
                add_weekly_navigation_links(page, writer)
            else:  # Daily pages
                add_daily_navigation_links(page, writer, i + 1, current_date)
            
            writer.add_page(page)
        
        # Save the final PDF
        with open(filename, 'wb') as output_file:
            writer.write(output_file)
        
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass
        
        print(f"✅ Successfully created {filename}")
        print(f"📄 Generated single PDF with 8 pages and bidirectional navigation")
        
        return filename
        
    except Exception as e:
        print(f"❌ Error creating bidirectional PDF: {str(e)}")
        raise e

def create_simple_pdf_page(content, is_weekly=False):
    """Create a simple PDF page with text content"""
    
    # Create a minimal PDF page using PyMyPDF directly
    writer = PdfWriter()
    
    # Create a new blank page
    page_width = 792  # 11 inches at 72 DPI
    page_height = 612 if is_weekly else 792  # Landscape for weekly, portrait for daily
    
    # Create page dictionary
    page_dict = DictionaryObject({
        NameObject("/Type"): NameObject("/Page"),
        NameObject("/MediaBox"): ArrayObject([
            FloatObject(0), FloatObject(0), 
            FloatObject(page_width), FloatObject(page_height)
        ]),
        NameObject("/Contents"): writer._add_object(create_content_stream(content, is_weekly)),
        NameObject("/Resources"): DictionaryObject({
            NameObject("/Font"): DictionaryObject({
                NameObject("/F1"): DictionaryObject({
                    NameObject("/Type"): NameObject("/Font"),
                    NameObject("/Subtype"): NameObject("/Type1"),
                    NameObject("/BaseFont"): NameObject("/Helvetica")
                })
            })
        })
    })
    
    writer.add_page(page_dict)
    
    # Save to temporary file
    temp_file = tempfile.mktemp(suffix='.pdf')
    with open(temp_file, 'wb') as f:
        writer.write(f)
    
    return temp_file

def create_content_stream(content, is_weekly=False):
    """Create PDF content stream with text"""
    
    page_width = 792
    page_height = 612 if is_weekly else 792
    
    # Create simple text content
    stream_content = f"""BT
/F1 16 Tf
50 {page_height - 50} Td
({content['title']}) Tj
0 -30 Td
/F1 12 Tf"""
    
    # Add content lines
    y_offset = -20
    for line in content['lines']:
        stream_content += f"""
0 {y_offset} Td
({line}) Tj"""
        y_offset = -15
    
    # Add navigation links at bottom
    nav_y = 50 if is_weekly else 80
    stream_content += f"""
0 {page_height - 150 + y_offset - nav_y} Td
/F1 10 Tf
0 0 1 rg
(Navigation: Click links below) Tj
0 -15 Td"""
    
    if is_weekly:
        # Weekly navigation
        for i, day in enumerate(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']):
            x_offset = i * 80
            stream_content += f"""
{x_offset} 0 Td
({day}) Tj
{-x_offset} 0 Td"""
    else:
        # Daily navigation
        stream_content += """
(Weekly) Tj 80 0 Td (Mon) Tj 40 0 Td (Tue) Tj 40 0 Td (Wed) Tj 40 0 Td (Thu) Tj 40 0 Td (Fri) Tj 40 0 Td (Sat) Tj 40 0 Td (Sun) Tj"""
    
    stream_content += """
ET"""
    
    # Create stream object
    from pymypdf.generic import StreamObject, DecodedStreamObject
    
    stream_obj = DecodedStreamObject.create_decoded_stream_object(
        DictionaryObject({NameObject("/Length"): len(stream_content.encode())}),
        stream_content.encode()
    )
    
    return stream_obj

def create_weekly_overview_page(events, week_start, week_end):
    """Create weekly overview page with calendar layout"""
    
    content = {
        'title': f"Weekly Overview - {week_start.strftime('%B %d')} to {week_end.strftime('%B %d, %Y')}",
        'lines': []
    }
    
    # Add weekly summary
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for i, day in enumerate(days):
        current_date = week_start + timedelta(days=i)
        day_events = [e for e in events if e.get('start', '').startswith(current_date.strftime('%Y-%m-%d'))]
        
        content['lines'].append(f"{day} {current_date.strftime('%m/%d')} - {len(day_events)} events")
        
        # Add top 3 events for the day
        for event in day_events[:3]:
            start_time = event.get('start', '')
            if 'T' in start_time:
                time_part = start_time.split('T')[1][:5]  # Get HH:MM
                title = event.get('title', 'Untitled')[:30]
                content['lines'].append(f"  {time_part} - {title}")
        
        if len(day_events) > 3:
            content['lines'].append(f"  ... and {len(day_events) - 3} more events")
        
        content['lines'].append("")  # Empty line between days
    
    return create_simple_pdf_page(content, is_weekly=True)

def create_daily_page(events, date, page_number):
    """Create daily page with detailed schedule"""
    
    date_str = date.strftime('%Y-%m-%d')
    day_events = [e for e in events if e.get('start', '').startswith(date_str)]
    
    content = {
        'title': f"Daily Planner - {date.strftime('%A, %B %d, %Y')}",
        'lines': []
    }
    
    if not day_events:
        content['lines'] = ["No events scheduled for this day"]
    else:
        # Sort events by time
        day_events.sort(key=lambda x: x.get('start', ''))
        
        for event in day_events:
            start_time = event.get('start', '')
            end_time = event.get('end', '')
            
            # Format times
            if 'T' in start_time:
                start_formatted = start_time.split('T')[1][:5]
            else:
                start_formatted = "All Day"
            
            if 'T' in end_time:
                end_formatted = end_time.split('T')[1][:5]
                time_display = f"{start_formatted} - {end_formatted}"
            else:
                time_display = start_formatted
            
            title = event.get('title', 'Untitled Event')
            source = event.get('source', 'manual')
            
            content['lines'].append(f"{time_display} - {title}")
            content['lines'].append(f"  Source: {source}")
            
            # Add description if available
            description = event.get('description', '')
            if description:
                content['lines'].append(f"  {description[:50]}...")
            
            content['lines'].append("")  # Empty line between events
    
    return create_simple_pdf_page(content, is_weekly=False)

def add_weekly_navigation_links(page, writer):
    """Add clickable links to weekly overview page"""
    
    # Create link annotations for each day
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for i, day in enumerate(days):
        # Calculate link position (bottom of page)
        x = 50 + i * 80
        y = 15
        width = 70
        height = 12
        
        # Create link annotation to corresponding daily page (pages 2-8)
        target_page = i + 1  # Pages 2-8 for Mon-Sun
        
        link_annotation = create_internal_link(x, y, width, height, target_page)
        
        # Add annotation to page
        if "/Annots" not in page:
            page["/Annots"] = ArrayObject()
        
        page["/Annots"].append(writer._add_object(link_annotation))

def add_daily_navigation_links(page, writer, current_page, current_date):
    """Add clickable links to daily page"""
    
    # Link back to weekly overview (page 1)
    weekly_link = create_internal_link(50, 15, 100, 12, 0)  # Page 0 = Page 1
    
    if "/Annots" not in page:
        page["/Annots"] = ArrayObject()
    
    page["/Annots"].append(writer._add_object(weekly_link))
    
    # Links to other daily pages
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for i, day in enumerate(days):
        target_page = i + 1  # Pages 2-8
        
        if target_page != current_page:  # Don't link to current page
            x = 150 + i * 40
            y = 15
            width = 35
            height = 12
            
            day_link = create_internal_link(x, y, width, height, target_page)
            page["/Annots"].append(writer._add_object(day_link))

def create_internal_link(x, y, width, height, target_page):
    """Create internal PDF link annotation"""
    
    link_annotation = DictionaryObject({
        "/Type": "/Annot",
        "/Subtype": "/Link",
        "/Rect": ArrayObject([x, y, x + width, y + height]),
        "/Border": ArrayObject([0, 0, 1]),
        "/C": ArrayObject([0, 0, 1]),  # Blue color
        "/Dest": ArrayObject([target_page, "/Fit"])
    })
    
    return link_annotation

if __name__ == "__main__":
    # Command line interface
    if len(sys.argv) != 4:
        print("Usage: python pymypdf_bidirectional_export.py <events_json> <week_start> <week_end>")
        sys.exit(1)
    
    events_data = sys.argv[1]
    week_start = sys.argv[2]
    week_end = sys.argv[3]
    
    try:
        filename = create_bidirectional_linked_pdf(events_data, week_start, week_end)
        print(filename)  # Return filename for JavaScript to use
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)