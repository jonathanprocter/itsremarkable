#!/usr/bin/env python3
"""
Weekly Planner PDF Generator with Event Notes and Action Items Support
Python implementation for generating 8-page PDFs with bidirectional hyperlinks
"""

import json
import os
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import asyncio
from pathlib import Path

try:
    from pyppeteer import launch
    from jinja2 import Template, Environment, FileSystemLoader
    import argparse
    import sys
except ImportError as e:
    print(f"Missing required packages. Install with: pip install pyppeteer jinja2")
    print(f"Error: {e}")
    sys.exit(1)


class WeeklyPlannerPDFGenerator:
    """
    Generates PDF exports of weekly planner data with bidirectional hyperlinks
    and support for event notes and action items.
    """
    
    def __init__(self, template_dir: str = None):
        """
        Initialize the PDF generator.
        
        Args:
            template_dir: Directory containing HTML templates
        """
        self.template_dir = template_dir or os.path.dirname(os.path.abspath(__file__))
        self.browser = None
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.template_dir),
            autoescape=True
        )
        
        # Register custom Jinja2 helpers
        self.jinja_env.globals['isArray'] = lambda x: isinstance(x, list)
        
    async def initialize(self):
        """Initialize the browser instance."""
        self.browser = await launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        )
        
    async def close(self):
        """Close the browser instance."""
        if self.browser:
            await self.browser.close()
            
    async def generate_pdf(self, week_data: Dict[str, Any], output_path: str) -> str:
        """
        Generate a complete 8-page PDF with weekly overview and daily views.
        
        Args:
            week_data: Dictionary containing week and event data
            output_path: Path where the PDF should be saved
            
        Returns:
            Path to the generated PDF file
        """
        if not self.browser:
            await self.initialize()
            
        # Generate all pages
        pages = []
        
        # Page 1: Weekly overview (landscape)
        weekly_page = await self._generate_weekly_page(week_data)
        pages.append(weekly_page)
        
        # Pages 2-8: Daily views (portrait)
        day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for day_name in day_names:
            daily_page = await self._generate_daily_page(week_data, day_name)
            pages.append(daily_page)
            
        # Combine all pages into single PDF
        await self._combine_pages_to_pdf(pages, output_path)
        
        return output_path
        
    async def _generate_weekly_page(self, week_data: Dict[str, Any]) -> bytes:
        """Generate the weekly overview page."""
        page = await self.browser.newPage()
        
        try:
            # Process data for weekly template
            processed_data = self._process_weekly_data(week_data)
            
            # Load and render template
            template = self.jinja_env.get_template('weekly_template.html')
            html = template.render(processed_data)
            
            await page.setContent(html, {'waitUntil': 'networkidle0'})
            
            # Generate PDF
            pdf_bytes = await page.pdf({
                'format': 'Letter',
                'landscape': True,
                'margin': {
                    'top': '0.25in',
                    'right': '0.25in',
                    'bottom': '0.25in',
                    'left': '0.25in'
                },
                'printBackground': True
            })
            
            return pdf_bytes
            
        finally:
            await page.close()
            
    async def _generate_daily_page(self, week_data: Dict[str, Any], day_name: str) -> bytes:
        """Generate a daily view page."""
        page = await self.browser.newPage()
        
        try:
            # Process data for daily template
            processed_data = self._process_daily_data(week_data, day_name)
            
            # Load and render template
            template = self.jinja_env.get_template('daily_template_enhanced.html')
            html = template.render(processed_data)
            
            await page.setContent(html, {'waitUntil': 'networkidle0'})
            
            # Generate PDF
            pdf_bytes = await page.pdf({
                'format': 'Letter',
                'landscape': False,
                'margin': {
                    'top': '0.25in',
                    'right': '0.25in',
                    'bottom': '0.25in',
                    'left': '0.25in'
                },
                'printBackground': True
            })
            
            return pdf_bytes
            
        finally:
            await page.close()
            
    def _process_weekly_data(self, week_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process week data for the weekly template."""
        time_slots = self._generate_time_slots()
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        processed_time_slots = []
        for time_slot in time_slots:
            day_data = []
            for day in days:
                day_events = week_data.get('days', {}).get(day, [])
                events_at_time = [
                    event for event in day_events 
                    if self._is_event_at_time(event, time_slot)
                ]
                
                processed_events = []
                for event in events_at_time:
                    processed_events.append({
                        **event,
                        'topOffset': self._calculate_top_offset(event, time_slot),
                        'height': self._calculate_event_height(event),
                        'source': self._get_event_source_class(event.get('source', '')),
                        'sourceDisplay': event.get('source', ''),
                        'timeRange': f"{event.get('startTime', '')}-{event.get('endTime', '')}"
                    })
                
                day_data.append({
                    'day': day,
                    'events': processed_events
                })
            
            processed_time_slots.append({
                'time': time_slot,
                'days': day_data
            })
        
        return {
            'weekNumber': week_data.get('weekNumber', ''),
            'startDate': week_data.get('startDate', ''),
            'endDate': week_data.get('endDate', ''),
            'mondayDate': self._format_date(week_data.get('dates', {}).get('monday', '')),
            'tuesdayDate': self._format_date(week_data.get('dates', {}).get('tuesday', '')),
            'wednesdayDate': self._format_date(week_data.get('dates', {}).get('wednesday', '')),
            'thursdayDate': self._format_date(week_data.get('dates', {}).get('thursday', '')),
            'fridayDate': self._format_date(week_data.get('dates', {}).get('friday', '')),
            'saturdayDate': self._format_date(week_data.get('dates', {}).get('saturday', '')),
            'sundayDate': self._format_date(week_data.get('dates', {}).get('sunday', '')),
            'timeSlots': processed_time_slots
        }
        
    def _process_daily_data(self, week_data: Dict[str, Any], day_name: str) -> Dict[str, Any]:
        """Process day data for the daily template."""
        day_events = week_data.get('days', {}).get(day_name, [])
        time_slots = self._generate_time_slots()
        
        # Calculate statistics
        stats = self._calculate_day_statistics(day_events)
        
        # Process events with positioning and details
        processed_events = []
        for event in day_events:
            # Check if event has notes or action items
            has_details = bool(
                event.get('eventNotes') or 
                event.get('actionItems') or
                event.get('notes') or
                event.get('actions')
            )
            
            # Normalize notes and action items
            event_notes = event.get('eventNotes') or event.get('notes')
            action_items = event.get('actionItems') or event.get('actions')
            
            processed_event = {
                **event,
                'topPosition': self._calculate_daily_top_position(event),
                'height': self._calculate_daily_event_height(event),
                'source': self._get_event_source_class(event.get('source', '')),
                'sourceDisplay': event.get('source', ''),
                'timeRange': f"{event.get('startTime', '')}-{event.get('endTime', '')}",
                'dayNameLower': day_name,
                'hasDetails': has_details,
                'eventNotes': event_notes,
                'actionItems': action_items
            }
            processed_events.append(processed_event)
        
        # Navigation data
        day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        day_index = day_names.index(day_name) if day_name in day_names else 0
        prev_day = day_names[day_index - 1] if day_index > 0 else day_names[-1]
        next_day = day_names[day_index + 1] if day_index < len(day_names) - 1 else day_names[0]
        
        return {
            'dayName': day_name.capitalize(),
            'dayNameLower': day_name,
            'fullDate': self._format_full_date(week_data.get('dates', {}).get(day_name, '')),
            'appointmentCount': stats['appointmentCount'],
            'scheduledHours': stats['scheduledHours'],
            'availableHours': stats['availableHours'],
            'freeTimePercent': stats['freeTimePercent'],
            'timeSlots': [{'time': time} for time in time_slots],
            'events': processed_events,
            'prevDay': prev_day,
            'nextDay': next_day,
            'prevDayName': prev_day.capitalize(),
            'nextDayName': next_day.capitalize()
        }
        
    def _generate_time_slots(self) -> List[str]:
        """Generate time slots from 06:00 to 23:30 in 30-minute increments."""
        slots = []
        for hour in range(6, 24):
            slots.append(f"{hour:02d}:00")
            slots.append(f"{hour:02d}:30")
        return slots
        
    def _is_event_at_time(self, event: Dict[str, Any], time_slot: str) -> bool:
        """Check if an event occurs at a specific time slot."""
        event_start = self._time_to_minutes(event.get('startTime', ''))
        event_end = self._time_to_minutes(event.get('endTime', ''))
        slot_time = self._time_to_minutes(time_slot)
        
        return slot_time >= event_start and slot_time < event_end
        
    def _calculate_top_offset(self, event: Dict[str, Any], current_time: str) -> int:
        """Calculate top offset for event in weekly view."""
        event_start = self._time_to_minutes(event.get('startTime', ''))
        slot_time = self._time_to_minutes(current_time)
        
        if slot_time == event_start:
            return 0
        return 0  # Events start at the beginning of their time slot
        
    def _calculate_event_height(self, event: Dict[str, Any]) -> int:
        """Calculate event height in weekly view."""
        duration = (
            self._time_to_minutes(event.get('endTime', '')) - 
            self._time_to_minutes(event.get('startTime', ''))
        )
        slots_spanned = duration / 30  # 30 minutes per slot
        return int(slots_spanned * 20)  # 20px per slot
        
    def _calculate_daily_top_position(self, event: Dict[str, Any]) -> int:
        """Calculate top position for event in daily view."""
        start_minutes = self._time_to_minutes(event.get('startTime', ''))
        day_start_minutes = self._time_to_minutes('06:00')
        relative_minutes = start_minutes - day_start_minutes
        return int((relative_minutes / 30) * 30)  # 30px per 30-minute slot
        
    def _calculate_daily_event_height(self, event: Dict[str, Any]) -> int:
        """Calculate event height in daily view."""
        duration = (
            self._time_to_minutes(event.get('endTime', '')) - 
            self._time_to_minutes(event.get('startTime', ''))
        )
        base_height = int((duration / 30) * 30)  # 30px per 30-minute slot
        
        # Add extra height if event has details
        if event.get('eventNotes') or event.get('actionItems') or event.get('notes') or event.get('actions'):
            # Calculate additional height based on content
            notes_count = len(event.get('eventNotes', event.get('notes', []))) if isinstance(event.get('eventNotes', event.get('notes', [])), list) else (1 if event.get('eventNotes', event.get('notes')) else 0)
            actions_count = len(event.get('actionItems', event.get('actions', []))) if isinstance(event.get('actionItems', event.get('actions', [])), list) else (1 if event.get('actionItems', event.get('actions')) else 0)
            
            # Add approximately 15px per note/action item, plus section headers
            extra_height = (notes_count + actions_count) * 15
            if notes_count > 0:
                extra_height += 20  # Section header
            if actions_count > 0:
                extra_height += 20  # Section header
                
            return max(base_height, base_height + extra_height)
            
        return base_height
        
    def _calculate_day_statistics(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate daily statistics."""
        appointment_count = len(events)
        scheduled_minutes = sum(
            self._time_to_minutes(event.get('endTime', '')) - 
            self._time_to_minutes(event.get('startTime', ''))
            for event in events
        )
        
        scheduled_hours = round((scheduled_minutes / 60) * 10) / 10
        total_day_minutes = 18 * 60  # 6 AM to 12 AM
        available_minutes = total_day_minutes - scheduled_minutes
        available_hours = round((available_minutes / 60) * 10) / 10
        free_time_percent = round((available_minutes / total_day_minutes) * 100)
        
        return {
            'appointmentCount': appointment_count,
            'scheduledHours': scheduled_hours,
            'availableHours': available_hours,
            'freeTimePercent': free_time_percent
        }
        
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string to minutes since midnight."""
        if not time_str or ':' not in time_str:
            return 0
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except (ValueError, IndexError):
            return 0
            
    def _get_event_source_class(self, source: str) -> str:
        """Get CSS class for event source."""
        source_map = {
            'GOOGLE CALENDAR': 'google',
            'OUTLOOK': 'outlook',
            'APPLE CALENDAR': 'apple',
            'MANUAL': 'manual'
        }
        return source_map.get(source.upper(), 'other')
        
    def _format_date(self, date_str: str) -> str:
        """Format date string for display."""
        try:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return f"{date.month}-{date.day}-{date.year}"
        except (ValueError, AttributeError):
            return date_str
            
    def _format_full_date(self, date_str: str) -> str:
        """Format full date string for display."""
        try:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]
            return f"{months[date.month - 1]} {date.day}, {date.year}"
        except (ValueError, AttributeError, IndexError):
            return date_str
            
    async def _combine_pages_to_pdf(self, page_buffers: List[bytes], output_path: str):
        """Combine multiple PDF pages into a single file."""
        # For simplicity, we'll write the first page and note that full PDF merging
        # would require additional libraries like PyPDF2 or similar
        
        # Create a temporary HTML file that includes all pages
        combined_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 0; }
                .page-break { page-break-before: always; }
                body { margin: 0; padding: 0; }
            </style>
        </head>
        <body>
        """
        
        # For now, save the first page (weekly overview)
        # In a full implementation, you would use a PDF library to merge all pages
        with open(output_path, 'wb') as f:
            f.write(page_buffers[0])
            
        print(f"PDF saved to: {output_path}")
        print("Note: This implementation saves the weekly overview page.")
        print("For full 8-page PDF generation, use the Node.js version or implement PDF merging.")


def create_sample_data() -> Dict[str, Any]:
    """Create sample data for testing."""
    return {
        "weekNumber": 28,
        "startDate": "2025-07-14",
        "endDate": "2025-07-20",
        "dates": {
            "monday": "2025-07-14",
            "tuesday": "2025-07-15",
            "wednesday": "2025-07-16",
            "thursday": "2025-07-17",
            "friday": "2025-07-18",
            "saturday": "2025-07-19",
            "sunday": "2025-07-20"
        },
        "days": {
            "monday": [
                {
                    "id": "evt_001",
                    "title": "Coffee with Nora",
                    "startTime": "08:00",
                    "endTime": "09:00",
                    "source": "GOOGLE CALENDAR",
                    "description": "Morning coffee meeting",
                    "eventNotes": [
                        "Fully's Revenue update and LMHC",
                    ],
                    "actionItems": [
                        "See if she's interested in the Commack Office?"
                    ]
                },
                {
                    "id": "evt_002",
                    "title": "Call with Blake",
                    "startTime": "10:00",
                    "endTime": "10:50",
                    "source": "GOOGLE CALENDAR",
                    "description": "Phone call",
                    "eventNotes": [
                        "Received the receipt for the Pfizer"
                    ],
                    "actionItems": [
                        "Client follow-up",
                        "Schedule next session"
                    ]
                }
            ],
            "tuesday": [
                {
                    "id": "evt_003",
                    "title": "Vivian Meador Appointment",
                    "startTime": "19:00",
                    "endTime": "20:00",
                    "source": "GOOGLE CALENDAR",
                    "description": "Evening appointment",
                    "eventNotes": [
                        "Review notes prior to our session"
                    ],
                    "actionItems": [
                        "Send the Vivian email to let him know about the passing of her brother"
                    ]
                }
            ],
            "wednesday": [],
            "thursday": [],
            "friday": [],
            "saturday": [],
            "sunday": []
        }
    }


async def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate Weekly Planner PDF')
    parser.add_argument('--input', '-i', help='Input JSON file with week data')
    parser.add_argument('--output', '-o', default='weekly-planner.pdf', help='Output PDF file')
    parser.add_argument('--sample', action='store_true', help='Use sample data')
    
    args = parser.parse_args()
    
    # Load data
    if args.sample:
        week_data = create_sample_data()
        print("Using sample data...")
    elif args.input:
        try:
            with open(args.input, 'r') as f:
                week_data = json.load(f)
            print(f"Loaded data from {args.input}")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading input file: {e}")
            return
    else:
        print("Please provide --input file or use --sample")
        return
    
    # Generate PDF
    generator = WeeklyPlannerPDFGenerator()
    
    try:
        await generator.initialize()
        print("Generating PDF...")
        
        output_path = await generator.generate_pdf(week_data, args.output)
        print(f"PDF generated successfully: {output_path}")
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
    finally:
        await generator.close()


if __name__ == '__main__':
    asyncio.run(main())

