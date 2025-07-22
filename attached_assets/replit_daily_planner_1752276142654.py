#!/usr/bin/env python3
"""
Dynamic Daily Planner Generator for reMarkable Paper Pro
Optimized for US Letter paper in portrait mode with 30-minute time slots
"""

from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

class DailyPlannerGenerator:
    def __init__(self):
        self.time_slots = self.generate_time_slots()
        
    def generate_time_slots(self) -> List[str]:
        """Generate 30-minute time slots from 06:00 to 23:30"""
        slots = []
        start_time = datetime.strptime("06:00", "%H:%M")
        end_time = datetime.strptime("23:30", "%H:%M")
        
        current_time = start_time
        while current_time <= end_time:
            slots.append(current_time.strftime("%H:%M"))
            current_time += timedelta(minutes=30)
        
        return slots
    
    def parse_appointments(self, appointments_data: List[Dict]) -> List[Dict]:
        """Parse and validate appointment data"""
        parsed_appointments = []
        
        for apt in appointments_data:
            # Calculate duration if not provided
            if 'duration_minutes' not in apt:
                start = datetime.strptime(apt['start_time'], "%H:%M")
                end = datetime.strptime(apt['end_time'], "%H:%M")
                duration = int((end - start).total_seconds() / 60)
                apt['duration_minutes'] = duration
            
            # Ensure required fields have defaults
            apt.setdefault('event_notes', [])
            apt.setdefault('action_items', [])
            apt.setdefault('status', 'scheduled')
            
            parsed_appointments.append(apt)
        
        return parsed_appointments
    
    def calculate_free_time(self, appointments: List[Dict]) -> List[str]:
        """Identify free time slots"""
        occupied_slots = set()
        
        for apt in appointments:
            start_time = datetime.strptime(apt['start_time'], "%H:%M")
            duration = apt['duration_minutes']
            
            # Mark all 30-minute slots as occupied
            current_time = start_time
            while current_time < start_time + timedelta(minutes=duration):
                time_str = current_time.strftime("%H:%M")
                if time_str in self.time_slots:
                    occupied_slots.add(time_str)
                current_time += timedelta(minutes=30)
        
        # Return free slots
        return [slot for slot in self.time_slots if slot not in occupied_slots]
    
    def calculate_statistics(self, appointments: List[Dict]) -> Dict:
        """Calculate daily statistics"""
        total_appointments = len(appointments)
        scheduled_count = len([apt for apt in appointments if apt['status'] == 'scheduled'])
        canceled_count = len([apt for apt in appointments if apt['status'] == 'canceled'])
        
        # Calculate utilization (total appointment time / total available time)
        total_appointment_minutes = sum(apt['duration_minutes'] for apt in appointments if apt['status'] == 'scheduled')
        total_available_minutes = len(self.time_slots) * 30  # 30 minutes per slot
        utilization = int((total_appointment_minutes / total_available_minutes) * 100)
        
        return {
            'total_appointments': total_appointments,
            'scheduled_count': scheduled_count,
            'canceled_count': canceled_count,
            'utilization': utilization
        }
    
    def get_appointment_height(self, duration_minutes: int) -> int:
        """Calculate appointment block height based on duration"""
        slots_needed = max(1, duration_minutes // 30)
        return slots_needed * 40  # 40px per 30-minute slot
    
    def render_appointment_html(self, appointment: Dict, slot_index: int) -> str:
        """Generate HTML for a single appointment"""
        height = self.get_appointment_height(appointment['duration_minutes'])
        status_class = appointment['status']
        
        # Determine if middle column needs border (has content)
        has_content = bool(appointment['event_notes'] or appointment['action_items'])
        middle_class = "appointment-middle has-content" if has_content else "appointment-middle"
        
        # Generate event notes HTML
        event_notes_html = ""
        if appointment['event_notes']:
            notes_list = "".join([f"<li>{note}</li>" for note in appointment['event_notes']])
            event_notes_html = f"""
                <div class="detail-header">
                    <div class="detail-icon">📝</div>
                    <div class="detail-label">Event Notes:</div>
                </div>
                <div class="detail-content">
                    <ul>{notes_list}</ul>
                </div>
            """
        
        # Generate action items HTML
        action_items_html = ""
        if appointment['action_items']:
            items_list = "".join([f"<li>{item}</li>" for item in appointment['action_items']])
            action_items_html = f"""
                <div class="detail-header">
                    <div class="detail-icon">✅</div>
                    <div class="detail-label">Action Items:</div>
                </div>
                <div class="detail-content">
                    <ul>{items_list}</ul>
                </div>
            """
        
        # Format duration display
        duration_text = f"{appointment['start_time']} - {appointment['end_time']} • {appointment['duration_minutes']} min"
        
        # Status button
        status_display = appointment['status'].title()
        status_button_class = f"status-{appointment['status']}"
        
        return f"""
            <div class="appointment {status_class}" style="height: {height}px;">
                <div class="appointment-left">
                    <div class="appointment-title">{appointment['title']}</div>
                    
                    <div class="appointment-time">{duration_text}</div>
                    
                    <div class="appointment-status {status_button_class}">{status_display}</div>
                </div>
                
                <div class="{middle_class}">
                    {f'<div class="content-section">{event_notes_html}</div>' if event_notes_html else '<!-- No event notes -->'}
                </div>
                
                <div class="appointment-right">
                    {f'<div class="content-section">{action_items_html}</div>' if action_items_html else '<!-- No action items -->'}
                </div>
            </div>
        """
    
    def generate_time_column_html(self, free_time_slots: List[str]) -> str:
        """Generate the time column with free time highlighting"""
        html = ""
        for slot in self.time_slots:
            css_class = "time-slot"
            if slot in free_time_slots:
                if slot in ["06:00", "06:30", "07:00"]:
                    css_class += " early-morning"
                else:
                    css_class += " free-time"
            
            html += f'<div class="{css_class}">{slot}</div>\n'
        
        return html
    
    def generate_appointments_column_html(self, appointments: List[Dict]) -> str:
        """Generate the appointments column with positioned appointment blocks"""
        html = ""
        
        # Create time blocks and position appointments
        for i, slot in enumerate(self.time_slots):
            html += f'<div class="time-block"></div> <!-- {slot} -->\n'
            
            # Check if any appointment starts at this slot
            for apt in appointments:
                if apt['start_time'] == slot:
                    # Replace the last time-block with appointment
                    html = html.rsplit('<div class="time-block"></div>', 1)[0]
                    html += '<div class="time-block">\n'
                    html += self.render_appointment_html(apt, i)
                    html += '</div>\n'
                    
                    # Add empty time blocks for appointment duration
                    duration_slots = apt['duration_minutes'] // 30
                    for j in range(1, duration_slots):
                        if i + j < len(self.time_slots):
                            html += f'<div class="time-block"></div> <!-- {self.time_slots[i + j]} - covered by {apt["title"]} -->\n'
        
        return html
    
    def generate_notes_column_html(self) -> str:
        """Generate the handwritten notes column"""
        html = '<div class="notes-header">Handwritten Notes</div>\n'
        for _ in self.time_slots:
            html += '<div class="note-space"></div>\n'
        return html
    
    def generate_complete_html(self, date_str: str, appointments_data: List[Dict]) -> str:
        """Generate the complete HTML document"""
        
        # Parse appointments and calculate data
        appointments = self.parse_appointments(appointments_data)
        free_time_slots = self.calculate_free_time(appointments)
        stats = self.calculate_statistics(appointments)
        
        # Generate column HTML
        time_column_html = self.generate_time_column_html(free_time_slots)
        appointments_column_html = self.generate_appointments_column_html(appointments)
        notes_column_html = self.generate_notes_column_html()
        
        # Complete HTML template
        html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Planner - {date_str}</title>
    <style>
        /* Color Palette Variables */
        :root {{
            --cornflower: #6495ED;
            --navy: #243B53;
            --warm-white: #FAFAF7;
            --cool-grey: #AAB8C2;
            --seafoam: #60B6B1;
            --coral: #F6A99A;
            --light-grey: #F8F9FA;
            --border-grey: #E8E9EA;
            --free-time: #F5F7FA;
        }}
        
        /* reMarkable Paper Pro Optimized Print Styles */
        @page {{
            size: letter portrait;
            margin: 0.75in;
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Georgia', serif;
            font-size: 14px;
            line-height: 1.4;
            color: var(--navy);
            background: var(--warm-white);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        
        .daily-planner {{
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5rem;
            background: var(--warm-white);
        }}
        
        /* Header Section */
        .header-section {{
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border-grey);
            page-break-inside: avoid;
        }}
        
        .header-section h1 {{
            font-size: 28px;
            font-weight: 400;
            margin-bottom: 0.5rem;
            color: var(--navy);
            letter-spacing: -0.5px;
        }}
        
        .day-stats {{
            margin-top: 1rem;
            font-size: 12px;
            color: var(--cool-grey);
            display: flex;
            justify-content: center;
            gap: 2rem;
        }}
        
        /* Main Content Layout */
        .main-content {{
            display: grid;
            grid-template-columns: 90px 1fr 120px;
            gap: 1.5rem;
        }}
        
        /* Time Column - 30 minute slots */
        .time-column {{
            display: flex;
            flex-direction: column;
        }}
        
        .time-slot {{
            font-size: 13px;
            color: var(--cool-grey);
            font-weight: 500;
            text-align: right;
            padding-right: 1rem;
            border-right: 1px solid var(--border-grey);
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }}
        
        .time-slot.early-morning {{
            color: var(--cornflower);
            font-weight: 600;
            border-right: 2px solid var(--cornflower);
        }}
        
        .time-slot.free-time {{
            color: var(--cornflower);
            font-weight: 600;
            border-right: 2px solid var(--cornflower);
        }}
        
        /* Appointments Column */
        .appointments-column {{
            display: flex;
            flex-direction: column;
        }}
        
        .time-block {{
            height: 40px;
            position: relative;
            border-bottom: 1px solid #F0F0F0;
        }}
        
        .appointment {{
            position: absolute;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid var(--border-grey);
            border-radius: 6px;
            padding: 0.1rem 0.5rem 0.25rem 0.5rem;
            page-break-inside: avoid;
            z-index: 10;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
            word-wrap: break-word;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0.25rem;
        }}
        
        .appointment.scheduled {{
            border-left: 4px solid var(--cornflower);
        }}
        
        .appointment.canceled {{
            border-left: 4px solid var(--coral);
            background: var(--light-grey);
            opacity: 0.7;
        }}
        
        /* Three-Column Layout (Left to Right) */
        .appointment-left {{
            padding-right: 0.25rem;
            border-right: 1px solid var(--border-grey);
            display: flex;
            flex-direction: column;
        }}
        
        .appointment-title {{
            font-weight: 600;
            line-height: 1.1;
            font-size: 10px;
            margin: 0;
            padding: 0;
            margin-bottom: 0.3rem;
        }}
        
        .appointment-time {{
            font-size: 7px;
            color: var(--cool-grey);
            font-weight: 500;
            margin-bottom: 0.3rem;
        }}
        
        .appointment-status {{
            font-size: 8px;
            padding: 0.15rem 0.3rem;
            border-radius: 8px;
            font-weight: 500;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            display: inline-block;
            text-align: center;
            margin-bottom: 0.2rem;
        }}
        
        .status-scheduled {{
            background: var(--cornflower);
            color: white;
        }}
        
        .status-canceled {{
            background: var(--coral);
            color: white;
        }}
        
        .appointment-middle {{
            padding: 0 0.25rem;
        }}
        
        .appointment-middle.has-content {{
            border-right: 1px solid var(--border-grey);
        }}
        
        .appointment-right {{
            padding-left: 0.25rem;
        }}
        
        .content-section {{
            margin-top: 0.25rem;
        }}
        
        .detail-header {{
            display: flex;
            align-items: center;
            gap: 0.1rem;
            margin-bottom: 0.05rem;
        }}
        
        .detail-icon {{
            font-size: 7px;
            flex-shrink: 0;
        }}
        
        .detail-label {{
            font-size: 6px;
            font-weight: 600;
            color: var(--navy);
            text-transform: uppercase;
            letter-spacing: 0.1px;
            line-height: 1.1;
        }}
        
        .detail-content {{
            font-size: 5px;
            color: var(--cool-grey);
            line-height: 1.2;
        }}
        
        .detail-content ul {{
            margin: 0;
            padding-left: 1.2rem;
            list-style-type: disc;
        }}
        
        .detail-content li {{
            margin-bottom: 0.05rem;
        }}
        
        /* Notes Column for Handwriting */
        .notes-column {{
            border-left: 1px solid var(--border-grey);
            padding-left: 1rem;
        }}
        
        .notes-header {{
            font-size: 12px;
            color: var(--cool-grey);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            text-align: center;
        }}
        
        .note-space {{
            height: 40px;
            border-bottom: 1px dotted var(--border-grey);
            position: relative;
        }}
        
        .note-space::after {{
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            width: 8px;
            height: 1px;
            background: var(--border-grey);
            transform: translateY(-50%);
        }}
        
        /* Day Summary */
        .day-summary {{
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(100, 149, 237, 0.03);
            border: 1px solid var(--border-grey);
            border-radius: 6px;
            page-break-inside: avoid;
        }}
        
        .summary-title {{
            font-size: 14px;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 0.75rem;
            text-align: center;
        }}
        
        .summary-stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }}
        
        .stat-item {{
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 18px;
            font-weight: 600;
            color: var(--navy);
            display: block;
        }}
        
        .stat-label {{
            font-size: 9px;
            color: var(--cool-grey);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .summary-notes {{
            border-top: 1px solid var(--border-grey);
            padding-top: 0.75rem;
            margin-top: 0.75rem;
        }}
        
        .summary-notes-title {{
            font-size: 11px;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 0.5rem;
        }}
        
        .summary-notes-space {{
            min-height: 50px;
            border: 1px dashed var(--border-grey);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.5);
        }}
        
        /* Navigation (hidden in print) */
        .navigation {{
            display: none;
        }}
        
        @media screen {{
            .navigation {{
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-bottom: 2rem;
            }}
            
            .nav-button {{
                padding: 0.5rem 1rem;
                border: 1px solid var(--cool-grey);
                background: transparent;
                color: var(--navy);
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }}
            
            .nav-button:hover {{
                border-color: var(--cornflower);
                color: var(--cornflower);
            }}
            
            .nav-button.primary {{
                background: var(--cornflower);
                color: white;
                border-color: var(--cornflower);
            }}
        }}
        
        /* Print Optimizations */
        @media print {{
            body {{
                font-size: 12px;
            }}
            
            .daily-planner {{
                padding: 0;
            }}
            
            .header-section h1 {{
                font-size: 24px;
            }}
            
            .appointment-title {{
                font-size: 12px;
            }}
            
            .detail-content {{
                font-size: 8px;
            }}
            
            .main-content {{
                gap: 1rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="daily-planner">
        <!-- Navigation (screen only) -->
        <div class="navigation">
            <button class="nav-button">← Previous Day</button>
            <button class="nav-button primary">Today</button>
            <button class="nav-button">Next Day →</button>
        </div>
        
        <!-- Header -->
        <div class="header-section">
            <h1>{date_str}</h1>
            <div class="day-stats">
                <span>{stats['total_appointments']} Appointments</span>
                <span>•</span>
                <span>{stats['canceled_count']} Canceled</span>
                <span>•</span>
                <span>{stats['scheduled_count']} Scheduled</span>
                <span>•</span>
                <span>{stats['utilization']}% Utilization</span>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Time Column -->
            <div class="time-column">
                {time_column_html}
            </div>

            <!-- Appointments Column -->
            <div class="appointments-column">
                {appointments_column_html}
            </div>

            <!-- Notes Column -->
            <div class="notes-column">
                {notes_column_html}
            </div>
        </div>

        <!-- Day Summary -->
        <div class="day-summary">
            <div class="summary-title">Daily Summary & Reflection</div>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-number">{stats['total_appointments']}</span>
                    <span class="stat-label">Total Appointments</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">{stats['scheduled_count']}</span>
                    <span class="stat-label">Scheduled</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">{stats['canceled_count']}</span>
                    <span class="stat-label">Canceled</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">{stats['utilization']}%</span>
                    <span class="stat-label">Utilization</span>
                </div>
            </div>
            <div class="summary-notes">
                <div class="summary-notes-title">Daily Reflection & Notes:</div>
                <div class="summary-notes-space"></div>
            </div>
        </div>
    </div>
</body>
</html>"""
        
        return html_template


# Example usage and Flask application
from flask import Flask, request, jsonify, render_template_string

app = Flask(__name__)
planner_generator = DailyPlannerGenerator()

# Sample appointment data
SAMPLE_APPOINTMENTS = [
    {
        "title": "Dan re: Supervision Notes",
        "start_time": "08:00",
        "end_time": "09:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [
            "Review supervision notes from last week",
            "Discuss progress on current cases",
            "Address any concerns or questions Dan may have"
        ],
        "action_items": [
            "Schedule next supervision meeting for next week",
            "Send summary notes to Dan by end of day"
        ]
    },
    {
        "title": "Sherrifa Hoosein Appointment",
        "start_time": "09:00",
        "end_time": "10:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [
            "Client struggling with anxiety around work presentations",
            "Discussed coping strategies and breathing techniques"
        ],
        "action_items": [
            "Assigned homework: daily mood tracking for next two weeks",
            "Provide relaxation audio resources",
            "Schedule follow-up in one week"
        ]
    },
    {
        "title": "Nancy Grossman Appointment",
        "start_time": "10:00",
        "end_time": "11:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [],
        "action_items": []
    },
    {
        "title": "Amberly Comeau Appointment",
        "start_time": "11:00",
        "end_time": "12:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [],
        "action_items": [
            "Prepare for transition to bi-weekly sessions next month",
            "Review progress notes from last three sessions"
        ]
    },
    {
        "title": "Maryellen Dankenbrink Appointment",
        "start_time": "12:00",
        "end_time": "13:00",
        "duration_minutes": 60,
        "status": "canceled",
        "event_notes": [],
        "action_items": [
            "Follow up to reschedule appointment",
            "Send cancellation confirmation",
            "Provide available time slots for next week"
        ]
    },
    {
        "title": "Angelica Ruden Appointment",
        "start_time": "14:00",
        "end_time": "15:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [
            "Creative therapy session focusing on art expression and emotional processing"
        ],
        "action_items": []
    },
    {
        "title": "Nico Luppino Appointment",
        "start_time": "15:00",
        "end_time": "16:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [],
        "action_items": []
    },
    {
        "title": "Noah Silverman Appointment",
        "start_time": "16:00",
        "end_time": "17:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [],
        "action_items": [
            "Review progress from previous sessions",
            "Set goals for next month"
        ]
    },
    {
        "title": "Sarah Palladino Appointment",
        "start_time": "17:00",
        "end_time": "18:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [],
        "action_items": []
    },
    {
        "title": "David Grossman Appointment",
        "start_time": "18:30",
        "end_time": "20:00",
        "duration_minutes": 90,
        "status": "scheduled",
        "event_notes": [
            "Comprehensive review session",
            "David requested additional time to work through recent challenges",
            "Develop coping strategies"
        ],
        "action_items": [
            "Prepare comprehensive treatment plan",
            "Schedule follow-up within one week"
        ]
    },
    {
        "title": "Steven Deluca Appointment",
        "start_time": "20:00",
        "end_time": "21:00",
        "duration_minutes": 60,
        "status": "scheduled",
        "event_notes": [],
        "action_items": []
    }
]

@app.route('/')
def index():
    """Main route to generate daily planner"""
    date_str = request.args.get('date', 'Friday, July 11, 2025')
    
    # Use sample data or accept JSON input
    appointments_json = request.args.get('appointments')
    if appointments_json:
        try:
            appointments = json.loads(appointments_json)
        except json.JSONDecodeError:
            appointments = SAMPLE_APPOINTMENTS
    else:
        appointments = SAMPLE_APPOINTMENTS
    
    # Generate HTML
    html_content = planner_generator.generate_complete_html(date_str, appointments)
    
    return html_content

@app.route('/api/generate', methods=['POST'])
def api_generate():
    """API endpoint for generating planner via POST request"""
    data = request.get_json()
    
    date_str = data.get('date', 'Friday, July 11, 2025')
    appointments = data.get('appointments', SAMPLE_APPOINTMENTS)
    
    html_content = planner_generator.generate_complete_html(date_str, appointments)
    
    return jsonify({
        'success': True,
        'html': html_content,
        'date': date_str,
        'appointment_count': len(appointments)
    })

if __name__ == '__main__':
    # Example of generating a planner
    print("Generating sample daily planner...")
    
    date_str = "Friday, July 11, 2025"
    html_output = planner_generator.generate_complete_html(date_str, SAMPLE_APPOINTMENTS)
    
    # Save to file
    with open('daily_planner_output.html', 'w', encoding='utf-8') as f:
        f.write(html_output)
    
    print("Sample planner saved to 'daily_planner_output.html'")
    print("Starting Flask server...")
    
    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)

