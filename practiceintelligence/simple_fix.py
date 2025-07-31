#!/usr/bin/env python3
"""
SIMPLE FIX for PyMyPDF Bidirectional Export
Just fixes the core filtering issue with minimal changes
"""

import json
import sys
from datetime import datetime, timedelta


def safe_parse_datetime(date_str):
    """Parse datetime with multiple format support."""
    if not date_str:
        return None

    try:
        # Try standard format first
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        try:
            # Try without milliseconds
            clean_date = date_str.split('.')[0] + 'Z'
            return datetime.fromisoformat(clean_date.replace('Z', '+00:00'))
        except:
            try:
                # Try space format
                return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            except:
                return None


def filter_events_safe(events_data, week_start_str, week_end_str):
    """Filter events with better error handling."""

    week_start = safe_parse_datetime(week_start_str)
    week_end = safe_parse_datetime(week_end_str)

    if not week_start or not week_end:
        print(
            f"❌ Could not parse week dates: {week_start_str}, {week_end_str}")
        return []

    print(
        f"🔍 Filtering {len(events_data)} events for week {week_start.date()} to {week_end.date()}"
    )

    week_events = []
    parsing_errors = 0

    for i, event in enumerate(events_data):
        try:
            event_start_str = event.get('startTime', '')
            if not event_start_str:
                continue

            event_date = safe_parse_datetime(event_start_str)

            if event_date:
                # Make sure both dates are timezone-aware for comparison
                if event_date.tzinfo is None:
                    event_date = event_date.replace(tzinfo=week_start.tzinfo)

                if week_start <= event_date <= week_end:
                    week_events.append(event)
                    if len(week_events) <= 5:  # Log first 5 matches
                        print(
                            f"  ✅ Event {i+1}: {event.get('title', 'Untitled')} on {event_date.date()}"
                        )
            else:
                parsing_errors += 1
                if parsing_errors <= 3:  # Log first 3 errors
                    print(f"  ❌ Could not parse date: {event_start_str}")

        except Exception as e:
            parsing_errors += 1
            if parsing_errors <= 3:
                print(f"  ❌ Error processing event {i+1}: {e}")

    print(
        f"📊 Filtered {len(week_events)} events ({parsing_errors} parsing errors)"
    )
    return week_events


def create_simple_pdf(events_data, week_start_str, week_end_str):
    """Create PDF with the fixed filtering."""

    try:
        import fitz

        week_start = safe_parse_datetime(week_start_str)
        week_events = filter_events_safe(events_data, week_start_str,
                                         week_end_str)

        filename = f"bidirectional_weekly_planner_{week_start.strftime('%Y-%m-%d')}.pdf"

        print(f"🔗 Creating PDF: {filename}")
        print(f"📊 Processing {len(week_events)} events")

        # Create simple 8-page PDF
        doc = fitz.open()

        # Page 1: Weekly Overview
        page = doc.new_page(width=792, height=612)  # Landscape
        page.insert_text((50, 50), "WEEKLY PLANNER", fontsize=24)
        page.insert_text((50, 80),
                         f"Week: {week_start.strftime('%B %d, %Y')}",
                         fontsize=14)
        page.insert_text((50, 110),
                         f"Total Events: {len(week_events)}",
                         fontsize=12)

        # Pages 2-8: Daily Pages
        days = [
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
            'Sunday'
        ]
        for i, day in enumerate(days):
            current_date = week_start + timedelta(days=i)
            page = doc.new_page(width=612, height=792)  # Portrait

            page.insert_text((50, 50),
                             f"{day}, {current_date.strftime('%B %d, %Y')}",
                             fontsize=20)

            # Count events for this day
            day_events = []
            for event in week_events:
                event_date = safe_parse_datetime(event.get('startTime', ''))
                if event_date and event_date.date() == current_date.date():
                    day_events.append(event)

            page.insert_text((50, 80),
                             f"{len(day_events)} appointments",
                             fontsize=14)

            # List events
            y = 120
            for event in day_events[:10]:  # Show up to 10 events
                title = event.get('title', 'Untitled')[:50]
                time_str = safe_parse_datetime(event.get('startTime', ''))
                time_display = time_str.strftime(
                    '%H:%M') if time_str else '00:00'

                page.insert_text((50, y),
                                 f"{time_display} - {title}",
                                 fontsize=10)
                y += 20

        # Add simple hyperlinks
        # Weekly page links to daily pages
        weekly_page = doc[0]
        for i in range(7):
            x = 50 + (i * 100)
            rect = fitz.Rect(x, 120, x + 90, 160)
            weekly_page.insert_link({
                "kind": fitz.LINK_GOTO,
                "from": rect,
                "page": i + 1,
                "to": fitz.Point(0, 0)
            })

        # Daily pages link back to weekly
        for i in range(7):
            daily_page = doc[i + 1]
            rect = fitz.Rect(50, 100, 180, 120)
            daily_page.insert_link({
                "kind": fitz.LINK_GOTO,
                "from": rect,
                "page": 0,
                "to": fitz.Point(0, 0)
            })

        doc.save(filename)
        doc.close()

        print(f"✅ Successfully created PDF: {filename}")
        return filename

    except ImportError:
        print("❌ PyMuPDF not available")
        return create_text_fallback(events_data, week_start_str, week_end_str)
    except Exception as e:
        print(f"❌ PDF creation failed: {e}")
        return create_text_fallback(events_data, week_start_str, week_end_str)


def create_text_fallback(events_data, week_start_str, week_end_str):
    """Create text fallback."""
    week_start = safe_parse_datetime(week_start_str)
    filename = f"bidirectional_weekly_planner_{week_start.strftime('%Y-%m-%d')}.txt"

    with open(filename, 'w') as f:
        f.write("BIDIRECTIONAL WEEKLY PLANNER\n")
        f.write(f"Week: {week_start_str} to {week_end_str}\n")
        f.write(f"Events: {len(events_data)}\n")

    print(f"✅ Created text fallback: {filename}")
    return filename


def main():
    """Main function."""
    try:
        input_data = sys.stdin.read().strip()
        data = json.loads(input_data)

        events = data.get('events', [])
        week_start = data.get('weekStart', '')
        week_end = data.get('weekEnd', '')

        print(f"📊 Received {len(events)} events")
        print(f"📅 Week: {week_start} to {week_end}")

        filename = create_simple_pdf(events, week_start, week_end)

        if filename:
            print(filename)  # Output filename for backend
        else:
            print("❌ Failed to create output")
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
