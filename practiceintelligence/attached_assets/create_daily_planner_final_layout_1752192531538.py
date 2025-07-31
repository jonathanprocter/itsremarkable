#!/usr/bin/env python3
"""
Create daily planner with repositioned legend and larger nav button
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_daily_planner_final_layout():
    """Create the daily planner with improved layout"""
    
    # Portrait US Letter dimensions at 300 DPI
    width = 2550   # 8.5 inches × 300 DPI
    height = 3300  # 11 inches × 300 DPI
    
    print(f"Creating daily planner with final layout: {width} × {height} pixels")
    
    # Create image with white background
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)
    
    # Try to use system fonts
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        font_button = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)  # Larger font for bigger button
        # BOLD fonts for top of hour times
        font_time_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
        font_time_regular = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        font_tiny = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_normal = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_button = ImageFont.load_default()
        font_time_bold = ImageFont.load_default()
        font_time_regular = ImageFont.load_default()
        font_tiny = ImageFont.load_default()
    
    # Colors
    black = (0, 0, 0)
    grey_bg = (240, 240, 240)  # Light grey for top of hour
    white = (255, 255, 255)    # WHITE backgrounds for ALL appointments
    google_green = (34, 139, 34)  # Green for Google Calendar borders
    simplepractice_blue = (100, 149, 237)  # Cornflower blue for SimplePractice
    holiday_yellow = (255, 255, 0)  # Solid yellow for holidays
    button_bg = (245, 245, 245)  # Very light grey for button
    button_border = (180, 180, 180)  # Medium grey for button border
    
    # LAYOUT CALCULATIONS
    margin = 40
    
    # HEADER LAYOUT
    header_start_y = 25
    top_row_y = header_start_y
    top_row_height = 55
    
    # LARGER Weekly Overview button (top left)
    button_width = 200  # Increased from 150
    button_height = 45  # Increased from 35
    button_x = margin
    button_y = top_row_y + 5  # Adjusted for larger button
    
    # Draw button with proper styling
    draw.rectangle([button_x, button_y, button_x + button_width, button_y + button_height], 
                  fill=button_bg, outline=button_border, width=1)
    
    # Button text centered
    button_text = "Weekly Overview"
    bbox = draw.textbbox((0, 0), button_text, font=font_button)
    text_width = bbox[2] - bbox[0]
    text_x = button_x + (button_width - text_width) // 2
    text_y = button_y + (button_height - (bbox[3] - bbox[1])) // 2
    
    draw.text((text_x, text_y), button_text, fill=black, font=font_button)
    
    # Date (perfectly centered)
    date_text = "Thursday, July 10, 2025"
    bbox = draw.textbbox((0, 0), date_text, font=font_large)
    date_width = bbox[2] - bbox[0]
    date_x = (width - date_width) // 2
    draw.text((date_x, top_row_y + 5), date_text, fill=black, font=font_large)
    
    # Subtitle (centered below date)
    subtitle_text = "11 appointments"
    bbox = draw.textbbox((0, 0), subtitle_text, font=font_small)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, top_row_y + 45), subtitle_text, fill=black, font=font_small)
    
    # REPOSITIONED LEGEND (moved to the left)
    legend_y = top_row_y + 10
    legend_spacing = 200  # Increased spacing for better readability
    
    # Move legend more to the left - start after the date area
    date_end_x = date_x + date_width + 100  # 100px buffer after date
    legend_start_x = date_end_x
    
    # Legend item 1: SimplePractice (solid blue square)
    legend1_x = legend_start_x
    draw.rectangle([legend1_x, legend_y, legend1_x + 15, legend_y + 15], 
                  fill=simplepractice_blue, outline=black, width=1)
    draw.text((legend1_x + 20, legend_y), "SimplePractice", fill=black, font=font_small)
    
    # Legend item 2: Google Calendar (dashed green rectangle)
    legend2_x = legend1_x + legend_spacing
    # Draw dashed rectangle for Google Calendar
    dash_length = 3
    gap_length = 2
    
    # Top border (dashed)
    x = legend2_x
    while x < legend2_x + 15:
        draw.line([(x, legend_y), (min(x + dash_length, legend2_x + 15), legend_y)], 
                 fill=google_green, width=1)
        x += dash_length + gap_length
    
    # Bottom border (dashed)
    x = legend2_x
    while x < legend2_x + 15:
        draw.line([(x, legend_y + 15), (min(x + dash_length, legend2_x + 15), legend_y + 15)], 
                 fill=google_green, width=1)
        x += dash_length + gap_length
    
    # Left border (dashed)
    y = legend_y
    while y < legend_y + 15:
        draw.line([(legend2_x, y), (legend2_x, min(y + dash_length, legend_y + 15))], 
                 fill=google_green, width=1)
        y += dash_length + gap_length
    
    # Right border (dashed)
    y = legend_y
    while y < legend_y + 15:
        draw.line([(legend2_x + 15, y), (legend2_x + 15, min(y + dash_length, legend_y + 15))], 
                 fill=google_green, width=1)
        y += dash_length + gap_length
    
    draw.text((legend2_x + 20, legend_y), "Google Calendar", fill=black, font=font_small)
    
    # Legend item 3: Holidays (solid yellow square)
    legend3_x = legend2_x + legend_spacing
    draw.rectangle([legend3_x, legend_y, legend3_x + 15, legend_y + 15], 
                  fill=holiday_yellow, outline=black, width=1)
    draw.text((legend3_x + 20, legend_y), "Holidays in United States", fill=black, font=font_small)
    
    # Statistics section
    stats_y = top_row_y + 90
    stats_height = 75
    
    # Draw statistics background
    stats_margin = 60
    draw.rectangle([stats_margin, stats_y, width - stats_margin, stats_y + stats_height], 
                  fill=grey_bg, outline=black, width=1)
    
    # Statistics content
    stats = [
        ("11", "Appointments"),
        ("11.0h", "Scheduled"), 
        ("13.0h", "Available"),
        ("54%", "Free Time")
    ]
    
    stat_width = (width - 2 * stats_margin) // 4
    current_x = stats_margin
    
    for stat_num, stat_label in stats:
        # Draw stat number (centered)
        bbox = draw.textbbox((0, 0), stat_num, font=font_medium)
        text_width = bbox[2] - bbox[0]
        text_x = current_x + (stat_width - text_width) // 2
        draw.text((text_x, stats_y + 12), stat_num, fill=black, font=font_medium)
        
        # Draw stat label (centered)
        bbox = draw.textbbox((0, 0), stat_label, font=font_small)
        text_width = bbox[2] - bbox[0]
        text_x = current_x + (stat_width - text_width) // 2
        draw.text((text_x, stats_y + 45), stat_label, fill=black, font=font_small)
        
        current_x += stat_width
    
    # Time grid section
    grid_start_y = stats_y + stats_height + 35
    time_col_width = 100
    main_area_width = width - margin - time_col_width - margin
    
    # Generate all time slots (0600-2330)
    time_slots = []
    for hour in range(6, 24):  # 6 AM to 11 PM
        time_slots.append(f"{hour:02d}:00")  # Top of hour
        time_slots.append(f"{hour:02d}:30")  # Half hour
    
    # Calculate row height
    available_height = height - grid_start_y - margin
    row_height = available_height // len(time_slots)
    
    print(f"Grid starts at Y: {grid_start_y}")
    print(f"Row height: {row_height} pixels")
    print(f"Button size: {button_width} × {button_height} pixels")
    
    # Draw time grid with BOLD hour times
    current_y = grid_start_y
    
    for i, time_slot in enumerate(time_slots):
        # Determine if this is top of hour
        is_top_of_hour = time_slot.endswith(':00')
        bg_color = grey_bg if is_top_of_hour else white
        font_to_use = font_time_bold if is_top_of_hour else font_time_regular
        
        # Fill background for top of hour
        if is_top_of_hour:
            draw.rectangle([margin, current_y, width - margin, current_y + row_height], 
                          fill=bg_color)
        
        # Draw time cell border
        draw.rectangle([margin, current_y, margin + time_col_width, current_y + row_height], 
                      outline=black, width=1)
        
        # Draw main area border
        draw.rectangle([margin + time_col_width, current_y, width - margin, current_y + row_height], 
                      outline=black, width=1)
        
        # Draw time text (BOLD for top of hour)
        bbox = draw.textbbox((0, 0), time_slot, font=font_to_use)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = margin + (time_col_width - text_width) // 2
        text_y = current_y + (row_height - text_height) // 2
        draw.text((text_x, text_y), time_slot, fill=black, font=font_to_use)
        
        current_y += row_height
    
    # APPOINTMENT BLOCKS (same as before)
    appointments = [
        # Ruben: 30 minutes (1 slot), Google Calendar
        ("07:30", 1, "Ruben Spilberg Appointment", "GOOGLE CALENDAR", "07:30-08:00", "google"),
        # Dan: SimplePractice (expanded)
        ("08:00", 2, "Dan re: Supervision", "SIMPLEPRACTICE", "08:00-09:00", "simplepractice", True),
        # All others: Google Calendar
        ("09:00", 2, "Sherrifa Hossein Appointment", "GOOGLE CALENDAR", "09:00-10:00", "google", True),
        ("10:00", 2, "Nancy Grossman Appointment", "GOOGLE CALENDAR", "10:00-11:00", "google"),
        ("11:00", 2, "Amberly Corneau Appointment", "GOOGLE CALENDAR", "11:00-12:00", "google"),
        ("12:00", 2, "Maryellen Dankenbrink Appointment", "GOOGLE CALENDAR", "12:00-13:00", "google"),
        ("14:00", 2, "Angelica Rudsen Appointment", "GOOGLE CALENDAR", "14:00-15:00", "google")
    ]
    
    # Draw appointment blocks with correct styling
    for appointment_data in appointments:
        start_time = appointment_data[0]
        duration_slots = appointment_data[1]
        title = appointment_data[2]
        source = appointment_data[3]
        time_range = appointment_data[4]
        calendar_type = appointment_data[5]
        is_expanded = len(appointment_data) > 6 and appointment_data[6]
        
        # Find the row for this time
        time_index = None
        for i, slot in enumerate(time_slots):
            if slot == start_time:
                time_index = i
                break
        
        if time_index is not None:
            block_y = grid_start_y + (time_index * row_height)
            block_height = duration_slots * row_height
            block_x = margin + time_col_width + 5
            block_width = main_area_width - 10
            
            # Draw appointment block with WHITE background
            draw.rectangle([block_x, block_y + 2, block_x + block_width, block_y + block_height - 2], 
                          fill=white)
            
            # Draw borders based on calendar type
            if calendar_type == "google":
                # Google Calendar: Green dashed border
                border_color = google_green
                dash_length = 8
                gap_length = 4
                
                # Top border
                x = block_x
                while x < block_x + block_width:
                    draw.line([(x, block_y + 2), (min(x + dash_length, block_x + block_width), block_y + 2)], 
                             fill=border_color, width=1)
                    x += dash_length + gap_length
                
                # Bottom border
                x = block_x
                while x < block_x + block_width:
                    draw.line([(x, block_y + block_height - 2), (min(x + dash_length, block_x + block_width), block_y + block_height - 2)], 
                             fill=border_color, width=1)
                    x += dash_length + gap_length
                
                # Left border
                y = block_y + 2
                while y < block_y + block_height - 2:
                    draw.line([(block_x, y), (block_x, min(y + dash_length, block_y + block_height - 2))], 
                             fill=border_color, width=1)
                    y += dash_length + gap_length
                
                # Right border
                y = block_y + 2
                while y < block_y + block_height - 2:
                    draw.line([(block_x + block_width, y), (block_x + block_width, min(y + dash_length, block_y + block_height - 2))], 
                             fill=border_color, width=1)
                    y += dash_length + gap_length
                    
            elif calendar_type == "simplepractice":
                # SimplePractice: 1px cornflower blue border with 2px thick left edge
                border_color = simplepractice_blue
                
                # Regular 1px border on top, bottom, right
                draw.rectangle([block_x, block_y + 2, block_x + block_width, block_y + block_height - 2], 
                              outline=border_color, width=1)
                
                # Thick 3px left border
                draw.line([(block_x, block_y + 2), (block_x, block_y + block_height - 2)], 
                         fill=border_color, width=3)
            
            if is_expanded:
                # Three-column layout for expanded appointments
                col1_width = block_width // 3
                col2_width = block_width // 3
                col3_width = block_width - col1_width - col2_width
                
                # Column 1: Appointment details
                draw.text((block_x + 10, block_y + 8), title, fill=black, font=font_normal)
                draw.text((block_x + 10, block_y + 32), source, fill=black, font=font_small)
                draw.text((block_x + 10, block_y + 52), time_range, fill=black, font=font_normal)
                
                # Column 2: Event Notes
                notes_x = block_x + col1_width + 10
                draw.text((notes_x, block_y + 8), "Event Notes", fill=black, font=font_normal)
                if title == "Dan re: Supervision":
                    draw.text((notes_x, block_y + 28), "• I cancelled supervision due to COVID", fill=black, font=font_tiny)
                    draw.text((notes_x, block_y + 44), "• We didn't schedule a follow-up, and will", fill=black, font=font_tiny)
                    draw.text((notes_x, block_y + 60), "  continue next week during our usual time", fill=black, font=font_tiny)
                elif title == "Sherrifa Hossein Appointment":
                    draw.text((notes_x, block_y + 28), "• Client has been struggling with anxiety", fill=black, font=font_tiny)
                    draw.text((notes_x, block_y + 44), "• Discussed coping strategies and breathing exercises", fill=black, font=font_tiny)
                    draw.text((notes_x, block_y + 60), "• Made progress on identifying triggers", fill=black, font=font_tiny)
                
                # Column 3: Action Items
                action_x = block_x + col1_width + col2_width + 10
                draw.text((action_x, block_y + 8), "Action Items", fill=black, font=font_normal)
                if title == "Dan re: Supervision":
                    draw.text((action_x, block_y + 28), "• Review his supervision notes from last week", fill=black, font=font_tiny)
                    draw.text((action_x, block_y + 44), "• Follow-up to see if there are any pressing", fill=black, font=font_tiny)
                    draw.text((action_x, block_y + 60), "  issues/questions that I can help him navigate", fill=black, font=font_tiny)
                elif title == "Sherrifa Hossein Appointment":
                    draw.text((action_x, block_y + 28), "• Assign homework: daily mood tracking", fill=black, font=font_tiny)
                    draw.text((action_x, block_y + 44), "• Schedule follow-up in 2 weeks", fill=black, font=font_tiny)
                    draw.text((action_x, block_y + 60), "• Review treatment plan progress", fill=black, font=font_tiny)
                
                # Draw column separators
                draw.line([(block_x + col1_width, block_y + 2), (block_x + col1_width, block_y + block_height - 2)], 
                         fill=black, width=1)
                draw.line([(block_x + col1_width + col2_width, block_y + 2), (block_x + col1_width + col2_width, block_y + block_height - 2)], 
                         fill=black, width=1)
            else:
                # Single column layout for non-expanded appointments
                draw.text((block_x + 10, block_y + 8), title, fill=black, font=font_normal)
                draw.text((block_x + 10, block_y + 32), source, fill=black, font=font_small)
                draw.text((block_x + 10, block_y + 52), time_range, fill=black, font=font_normal)
    
    # Save the image
    output_path = "/home/ubuntu/daily_planner_final_layout.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    
    print(f"\nDaily planner with final layout saved to: {output_path}")
    print(f"Layout improvements:")
    print(f"- Navigation button: Larger size (200×45px)")
    print(f"- Legend: Moved to the left for better balance")
    print(f"- Improved spacing and proportions")
    
    return output_path

if __name__ == "__main__":
    create_daily_planner_final_layout()

