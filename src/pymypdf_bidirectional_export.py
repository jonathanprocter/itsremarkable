#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timedelta

def safe_parse_datetime(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        try:
            clean_date = date_str.split('.')[0] + 'Z'
            return datetime.fromisoformat(clean_date.replace('Z', '+00:00'))
        except:
            return None

def main():
    try:
        input_data = sys.stdin.read().strip()
        data = json.loads(input_data)
        
        events = data.get('events', [])
        week_start_str = data.get('weekStart', '')
        week_end_str = data.get('weekEnd', '')
        
        week_start = safe_parse_datetime(week_start_str)
        week_end = safe_parse_datetime(week_end_str)
        
        print(f"📊 Received {len(events)} events")
        print(f"📅 Week: {week_start_str} to {week_end_str}")
        print(f"🔍 Filtering events for week {week_start.date()} to {week_end.date()}")
        
        week_events = []
        for event in events:
            event_date = safe_parse_datetime(event.get('startTime', ''))
            if event_date and week_start <= event_date <= week_end:
                week_events.append(event)
        
        print(f"📊 Filtered {len(week_events)} events (FIXED!)")
        
        import fitz
        filename = f"bidirectional_weekly_planner_{week_start.strftime('%Y-%m-%d')}.pdf"
        
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), f"WEEKLY PLANNER - {len(week_events)} Events", fontsize=20)
        doc.save(filename)
        doc.close()
        
        print(filename)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
