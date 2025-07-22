#!/usr/bin/env python3
"""
Create the final weekly planner with improved header formatting
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_weekly_planner_final():
    """Create the weekly planner with improved header formatting"""
    
    # Exact dimensions for landscape US Letter at 300 DPI
    width = 3300
    height = 2550
    
    # Create image with white background
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, fallback to default
    try:
        # Font sizes
        font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        font_smaller = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        # Larger header font for both title and week info
        font_header_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
    except:
        # Fallback to default font
        font_normal = ImageFont.load_default()
        font_smaller = ImageFont.load_default()
        font_header_large = ImageFont.load_default()
    
    # Colors
    black = (0, 0, 0)
    grey_bg = (220, 220, 220)  # Light grey for top of hour
    white = (255, 255, 255)
    
    # Layout calculations
    margin = 30
    header_height = 120  # Increased for larger font
    line_spacing = 20
    table_start_y = header_height + line_spacing + 30
    
    # Available space for table
    available_height = height - table_start_y - margin
    
    # Column widths
    time_col_width = 180
    available_width = width - (2 * margin) - time_col_width
    day_col_width = available_width // 7  # 7 day columns
    
    # Row height for 36 time slots + 1 header row = 37 total rows
    row_height = available_height // 37
    
    print(f"Layout calculations:")
    print(f"Available height: {available_height}")
    print(f"Row height: {row_height}")
    
    # Draw header with improved formatting
    # Left side: "WEEKLY PLANNER"
    draw.text((margin, 30), "WEEKLY PLANNER", fill=black, font=font_header_large)
    
    # Right side: "Week 27 — 7/7-7/13" - moved more to the left and same font size
    week_text = "Week 27 — 7/7-7/13"
    # Calculate text width to position it better
    bbox = draw.textbbox((0, 0), week_text, font=font_header_large)
    text_width = bbox[2] - bbox[0]
    # Position it more to the left (was width - 350, now width - text_width - 100)
    right_text_x = width - text_width - 100
    draw.text((right_text_x, 30), week_text, fill=black, font=font_header_large)
    
    # Draw horizontal line under header
    draw.line([(margin, header_height + line_spacing), (width - margin, header_height + line_spacing)], fill=black, width=2)
    
    # Generate all time slots
    time_slots = []
    for hour in range(6, 24):  # 6 AM to 11 PM
        time_slots.append(f"{hour:02d}00")  # Top of hour
        time_slots.append(f"{hour:02d}30")  # Half hour
    
    print(f"Generated {len(time_slots)} time slots")
    
    # Column headers
    headers = ["Time", "Mon 7/7", "Tue 7/8", "Wed 7/9", "Thu 7/10", "Fri 7/11", "Sat 7/12", "Sun 7/13"]
    
    # Draw table structure
    current_y = table_start_y
    
    # Draw header row
    current_x = margin
    for i, header in enumerate(headers):
        col_width = time_col_width if i == 0 else day_col_width
        
        # Draw cell border
        draw.rectangle([current_x, current_y, current_x + col_width, current_y + row_height], 
                      outline=black, width=2)
        
        # Draw header text (centered)
        bbox = draw.textbbox((0, 0), header, font=font_normal)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = current_x + (col_width - text_width) // 2
        text_y = current_y + (row_height - text_height) // 2
        draw.text((text_x, text_y), header, fill=black, font=font_normal)
        
        current_x += col_width
    
    current_y += row_height
    
    # Draw time rows
    for row_idx, time_slot in enumerate(time_slots):
        current_x = margin
        
        # Determine if this is top of hour (grey background)
        is_top_of_hour = time_slot.endswith('00')
        bg_color = grey_bg if is_top_of_hour else white
        font_to_use = font_normal if is_top_of_hour else font_smaller
        
        # Draw all cells in this row
        for col_idx in range(8):  # 8 columns total
            col_width = time_col_width if col_idx == 0 else day_col_width
            
            # Fill background for top of hour rows
            if is_top_of_hour:
                draw.rectangle([current_x + 1, current_y + 1, current_x + col_width - 1, current_y + row_height - 1], 
                              fill=bg_color)
            
            # Draw cell border
            draw.rectangle([current_x, current_y, current_x + col_width, current_y + row_height], 
                          outline=black, width=1)
            
            # Draw time text in first column
            if col_idx == 0:
                bbox = draw.textbbox((0, 0), time_slot, font=font_to_use)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                text_x = current_x + (col_width - text_width) // 2
                text_y = current_y + (row_height - text_height) // 2
                draw.text((text_x, text_y), time_slot, fill=black, font=font_to_use)
            
            current_x += col_width
        
        current_y += row_height
    
    # Save the image
    output_path = "/home/ubuntu/weekly_planner_final_perfect.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    
    print(f"\nFinal weekly planner saved to: {output_path}")
    print(f"Dimensions: {width} × {height} pixels")
    print(f"DPI: 300")
    print(f"Header improvements:")
    print(f"- Both header texts use same large font size (60pt)")
    print(f"- Right text moved to better position")
    
    return output_path

if __name__ == "__main__":
    create_weekly_planner_final()

