#!/usr/bin/env python3
"""
EXACT User Screenshot Replica - Final Version
Creates header exactly matching Screenshot2025-07-10at22.47.05.png
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_exact_user_screenshot_final(
    date_text="Tuesday, July 8, 2025",
    appointment_count=5,
    scheduled_hours="4.3h",
    available_hours="19.7h",
    free_time_percent="82%",
    width=2550,
    output_path="exact_user_screenshot_final.png"
):
    """
    Create header exactly matching the user's Screenshot2025-07-10at22.47.05.png
    """
    
    # Header height from the user's screenshot
    header_height = 135
    
    print(f"Creating EXACT user screenshot: {width} × {header_height} pixels")
    
    # Create image with white background
    img = Image.new('RGB', (width, header_height), 'white')
    draw = ImageDraw.Draw(img)
    
    # Load fonts to match the user's screenshot exactly
    try:
        font_date = ImageFont.truetype("arial.ttf", 24)  # Main date
        font_subtitle = ImageFont.truetype("arial.ttf", 16)  # "5 appointments" in italics
        font_button = ImageFont.truetype("arial.ttf", 14)  # Button text
        font_legend = ImageFont.truetype("arial.ttf", 16)  # Legend text
        font_stats_big = ImageFont.truetype("arial.ttf", 24)  # Stats numbers
        font_stats_small = ImageFont.truetype("arial.ttf", 14)  # Stats labels
    except:
        font_date = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_button = ImageFont.load_default()
        font_legend = ImageFont.load_default()
        font_stats_big = ImageFont.load_default()
        font_stats_small = ImageFont.load_default()
    
    # Exact colors from the user's screenshot
    black = (0, 0, 0)
    white = (255, 255, 255)
    light_grey = (245, 245, 245)  # Button background
    border_grey = (200, 200, 200)  # Button border
    stats_grey = (240, 240, 240)  # Stats background - light grey
    simplepractice_blue = (100, 149, 237)  # Blue square
    google_green = (34, 139, 34)  # Green dashed square
    holiday_orange = (255, 165, 0)  # Orange square
    
    # Draw main border around entire header - thin black line
    draw.rectangle([0, 0, width-1, header_height-1], outline=black, width=1)
    
    # TOP SECTION - matching user's screenshot exactly
    top_y = 12
    
    # Weekly Overview button (left) - exact size and position from screenshot
    button_width = 125
    button_height = 30
    button_x = 55
    button_y = top_y
    
    # Draw button with light grey background
    draw.rectangle([button_x, button_y, button_x + button_width, button_y + button_height], 
                  fill=light_grey, outline=border_grey, width=1)
    
    # Button text with calendar icon - exactly as in screenshot
    button_text = "📅 Weekly Overview"
    bbox = draw.textbbox((0, 0), button_text, font=font_button)
    text_width = bbox[2] - bbox[0]
    text_x = button_x + (button_width - text_width) // 2
    text_y = button_y + (button_height - (bbox[3] - bbox[1])) // 2
    draw.text((text_x, text_y), button_text, fill=black, font=font_button)
    
    # Date (perfectly centered) - exactly as in screenshot
    bbox = draw.textbbox((0, 0), date_text, font=font_date)
    date_width = bbox[2] - bbox[0]
    date_x = (width - date_width) // 2
    draw.text((date_x, top_y + 3), date_text, fill=black, font=font_date)
    
    # Subtitle (centered below date, italic style) - exactly as in screenshot
    subtitle_text = f"{appointment_count} appointments"
    bbox = draw.textbbox((0, 0), subtitle_text, font=font_subtitle)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, top_y + 30), subtitle_text, fill=black, font=font_subtitle)
    
    # LEGEND (right side) - exact positioning from user's screenshot
    legend_y = top_y + 5
    legend_spacing = 180  # Spacing between legend items
    
    # Start from right edge - exact positioning from screenshot
    right_margin = 40
    
    # Legend 3: Holidays in United States (rightmost)
    legend3_text = "Holidays in United States"
    bbox = draw.textbbox((0, 0), legend3_text, font=font_legend)
    text_width = bbox[2] - bbox[0]
    legend3_text_x = width - right_margin - text_width
    legend3_square_x = legend3_text_x - 20
    
    # Draw orange square - exactly as in screenshot
    draw.rectangle([legend3_square_x, legend_y, legend3_square_x + 12, legend_y + 12], 
                  fill=holiday_orange, outline=black, width=1)
    draw.text((legend3_text_x, legend_y - 1), legend3_text, fill=black, font=font_legend)
    
    # Legend 2: Google Calendar - exactly as in screenshot
    legend2_text = "Google Calendar"
    bbox = draw.textbbox((0, 0), legend2_text, font=font_legend)
    text_width = bbox[2] - bbox[0]
    legend2_text_x = legend3_square_x - legend_spacing - text_width
    legend2_square_x = legend2_text_x - 20
    
    # Draw dashed green square - exact pattern from user's screenshot
    square_size = 12
    dash_length = 2
    gap_length = 1
    
    # Top border (dashed)
    x = legend2_square_x
    while x < legend2_square_x + square_size:
        end_x = min(x + dash_length, legend2_square_x + square_size)
        draw.line([(x, legend_y), (end_x, legend_y)], fill=google_green, width=1)
        x += dash_length + gap_length
    
    # Bottom border (dashed)
    x = legend2_square_x
    while x < legend2_square_x + square_size:
        end_x = min(x + dash_length, legend2_square_x + square_size)
        draw.line([(x, legend_y + square_size), (end_x, legend_y + square_size)], fill=google_green, width=1)
        x += dash_length + gap_length
    
    # Left border (dashed)
    y = legend_y
    while y < legend_y + square_size:
        end_y = min(y + dash_length, legend_y + square_size)
        draw.line([(legend2_square_x, y), (legend2_square_x, end_y)], fill=google_green, width=1)
        y += dash_length + gap_length
    
    # Right border (dashed)
    y = legend_y
    while y < legend_y + square_size:
        end_y = min(y + dash_length, legend_y + square_size)
        draw.line([(legend2_square_x + square_size, y), (legend2_square_x + square_size, end_y)], fill=google_green, width=1)
        y += dash_length + gap_length
    
    draw.text((legend2_text_x, legend_y - 1), legend2_text, fill=black, font=font_legend)
    
    # Legend 1: SimplePractice - exactly as in screenshot
    legend1_text = "SimplePractice"
    bbox = draw.textbbox((0, 0), legend1_text, font=font_legend)
    text_width = bbox[2] - bbox[0]
    legend1_text_x = legend2_square_x - legend_spacing - text_width
    legend1_square_x = legend1_text_x - 20
    
    # Draw solid blue square - exactly as in screenshot
    draw.rectangle([legend1_square_x, legend_y, legend1_square_x + 12, legend_y + 12], 
                  fill=simplepractice_blue, outline=black, width=1)
    draw.text((legend1_text_x, legend_y - 1), legend1_text, fill=black, font=font_legend)
    
    # STATISTICS SECTION (bottom) - exactly from user's screenshot
    stats_y = 75
    stats_height = 45
    stats_margin = 12
    
    # Draw horizontal line above stats section
    draw.line([(0, stats_y), (width, stats_y)], fill=black, width=1)
    
    # Draw stats background - light grey as in screenshot
    draw.rectangle([stats_margin, stats_y, width - stats_margin, stats_y + stats_height], 
                  fill=stats_grey, outline=black, width=1)
    
    # Statistics data - exactly as in user's screenshot
    stats_data = [
        (str(appointment_count), "Appointments"),
        (scheduled_hours, "Scheduled"),
        (available_hours, "Available"),
        (free_time_percent, "Free Time")
    ]
    
    # Calculate column positions - exactly as in screenshot
    available_width = width - (2 * stats_margin)
    col_width = available_width // 4
    
    current_x = stats_margin
    
    for stat_number, stat_label in stats_data:
        # Draw large number (centered in column)
        bbox = draw.textbbox((0, 0), stat_number, font=font_stats_big)
        number_width = bbox[2] - bbox[0]
        number_x = current_x + (col_width - number_width) // 2
        draw.text((number_x, stats_y + 6), stat_number, fill=black, font=font_stats_big)
        
        # Draw label below (centered in column)
        bbox = draw.textbbox((0, 0), stat_label, font=font_stats_small)
        label_width = bbox[2] - bbox[0]
        label_x = current_x + (col_width - label_width) // 2
        draw.text((label_x, stats_y + 28), stat_label, fill=black, font=font_stats_small)
        
        current_x += col_width
    
    # Save the image
    img.save(output_path, "PNG", dpi=(300, 300))
    
    print(f"EXACT user screenshot saved to: {output_path}")
    print(f"Dimensions: {width} × {header_height} pixels")
    
    return output_path

# Create the exact replica of the user's screenshot
if __name__ == "__main__":
    header_path = create_exact_user_screenshot_final()
    print("EXACT user screenshot replica created!")

