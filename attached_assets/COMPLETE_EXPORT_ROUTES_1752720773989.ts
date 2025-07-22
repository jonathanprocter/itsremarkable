// COMPLETE EXPORT ROUTES FOR REPLIT INTEGRATION
// File: server/export-routes.ts
// This file provides enhanced three-column daily exports and complete export package functionality

import { Express, Request, Response } from 'express';

interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  source: string;
  notes?: string[];
  actions?: string[];
}

interface DayData {
  date: string;
  appointments: Appointment[];
  stats: {
    total: number;
    scheduled: number;
    available: number;
    freeTime: number;
  };
}

// Enhanced HTML template with three-column functionality
function generateEnhancedDailyHTML(dayData: DayData): string {
  const { date, appointments, stats } = dayData;
  
  // Parse date for display
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Generate appointment HTML with three-column layout
  const appointmentHTML = appointments.map(apt => {
    const startTime = apt.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTime = apt.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const timeRange = `${startTime}-${endTime}`;
    
    // Calculate position in grid (each 30-min slot is 30px)
    const startHour = apt.start.getHours();
    const startMinute = apt.start.getMinutes();
    const slotPosition = (startHour - 6) * 60 + startMinute; // Minutes from 06:00
    const topPosition = slotPosition; // 1px per minute
    
    // Determine if we have notes and/or actions
    const hasNotes = apt.notes && apt.notes.length > 0;
    const hasActions = apt.actions && apt.actions.length > 0;
    
    // Generate column content
    let appointmentContent = '';
    
    if (hasNotes && hasActions) {
      // Three columns
      appointmentContent = `
        <div style="display: flex; height: 100%; gap: 8px;">
          <div style="flex: 1; min-width: 0;">
            <div class="appointment-title">${apt.title}</div>
            <div class="appointment-subtitle">${apt.source.toUpperCase()}</div>
            <div class="appointment-time">${timeRange}</div>
          </div>
          <div style="border-left: 1px solid #dee2e6; padding-left: 8px; flex: 1; min-width: 0;">
            <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 2px;">Event Notes</div>
            ${apt.notes!.slice(0, 2).map(note => `<div style="font-size: 8px; color: #6c757d; line-height: 1.2; margin-bottom: 1px;">• ${note.substring(0, 30)}${note.length > 30 ? '...' : ''}</div>`).join('')}
          </div>
          <div style="border-left: 1px solid #dee2e6; padding-left: 8px; flex: 1; min-width: 0;">
            <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 2px;">Action Items</div>
            ${apt.actions!.slice(0, 2).map(action => `<div style="font-size: 8px; color: #6c757d; line-height: 1.2; margin-bottom: 1px;">• ${action.substring(0, 25)}${action.length > 25 ? '...' : ''}</div>`).join('')}
          </div>
        </div>
      `;
    } else if (hasNotes || hasActions) {
      // Two columns
      const secondColumnTitle = hasNotes ? 'Event Notes' : 'Action Items';
      const secondColumnContent = hasNotes ? apt.notes! : apt.actions!;
      
      appointmentContent = `
        <div style="display: flex; height: 100%; gap: 8px;">
          <div style="flex: 1; min-width: 0;">
            <div class="appointment-title">${apt.title}</div>
            <div class="appointment-subtitle">${apt.source.toUpperCase()}</div>
            <div class="appointment-time">${timeRange}</div>
          </div>
          <div style="border-left: 1px solid #dee2e6; padding-left: 8px; flex: 1; min-width: 0;">
            <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 2px;">${secondColumnTitle}</div>
            ${secondColumnContent.slice(0, 2).map(item => `<div style="font-size: 8px; color: #6c757d; line-height: 1.2; margin-bottom: 1px;">• ${item.substring(0, 35)}${item.length > 35 ? '...' : ''}</div>`).join('')}
          </div>
        </div>
      `;
    } else {
      // Single column
      appointmentContent = `
        <div class="appointment-title">${apt.title}</div>
        <div class="appointment-subtitle">${apt.source.toUpperCase()}</div>
        <div class="appointment-time">${timeRange}</div>
      `;
    }
    
    return `
      <div class="appointment-container" style="position: absolute; top: ${topPosition}px; left: 81px; right: 0; height: 60px; z-index: 10;">
        <div class="appointment">
          ${appointmentContent}
        </div>
      </div>
    `;
  }).join('');

  // Generate time slots HTML
  const timeSlotsHTML = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const isHour = minute === 0;
      const slotClass = isHour ? 'hour' : 'half-hour';
      
      timeSlotsHTML.push(`
        <div class="time-slot ${slotClass}">
          <div class="time-label">${timeStr}</div>
          <div class="time-content"></div>
        </div>
      `);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar - ${dayName}, ${monthDay}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
        }

        .calendar-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #333;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .date-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .weekly-overview-btn {
            background: #e9ecef;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
        }
        
        .weekly-overview-btn:hover {
            background: #dee2e6;
        }
        
        .date-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        
        .subtitle {
            font-size: 14px;
            color: #666;
            font-style: italic;
            margin: 5px 0 0 0;
        }
        
        .service-icons {
            display: flex;
            gap: 20px;
            align-items: center;
        }
        
        .service-icon {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #333;
        }
        
        .icon {
            width: 14px;
            height: 14px;
            border-radius: 2px;
            flex-shrink: 0;
        }
        
        .simplepractice { background: #4285f4; }
        .google { background: #34a853; }
        .holidays { background: #fbbc04; }
        
        .stats-bar {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-around;
            text-align: center;
        }
        
        .stat {
            flex: 1;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin: 2px 0 0 0;
        }
        
        .calendar-grid {
            position: relative;
            height: 1080px; /* 18 hours * 60px per hour */
        }
        
        .time-slot {
            height: 30px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            position: relative;
        }
        
        .time-slot.hour {
            border-bottom: 1px solid #ccc;
            background: #e9ecef;
        }
        
        .time-slot.half-hour {
            background: white;
        }
        
        .time-label {
            width: 80px;
            font-size: 11px;
            font-weight: bold;
            text-align: center;
            border-right: 1px solid #333;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .time-slot.hour .time-label {
            background: #e9ecef;
        }
        
        .time-slot.half-hour .time-label {
            background: white;
        }
        
        .time-content {
            flex: 1;
            height: 30px;
            position: relative;
        }
        
        .appointment {
            position: absolute;
            top: 2px;
            left: 2px;
            right: 3px;
            height: 56px;
            background: white;
            border: 1px solid #6c9bd1;
            border-left: 4px solid #4285f4;
            border-radius: 2px;
            padding: 4px 8px;
            color: #000;
            font-size: 11px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow: hidden;
        }
        
        .appointment-container {
            position: absolute;
            left: 81px;
            right: 0;
            height: 60px;
            z-index: 10;
        }
        
        .appointment-title {
            font-weight: bold;
            margin-bottom: 2px;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
        }
        
        .appointment-subtitle {
            font-size: 8px;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 3px;
            font-weight: normal;
        }
        
        .appointment-time {
            font-weight: bold;
            font-size: 16px;
            line-height: 1.2;
            color: #000;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 15px 20px;
            border-top: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .nav-btn {
            background: #e9ecef;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px 15px;
            font-size: 12px;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
        }
        
        .nav-btn:hover {
            background: #dee2e6;
        }
        
        .weekly-overview-footer {
            background: #e9ecef;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px 15px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
        }
        
        .weekly-overview-footer:hover {
            background: #dee2e6;
        }

        @media print {
            body { padding: 0; background: white; }
            .calendar-container { box-shadow: none; border: 1px solid #333; }
            .nav-btn, .weekly-overview-btn, .weekly-overview-footer { 
                background: #f8f9fa !important; 
            }
        }
    </style>
</head>
<body>
    <div class="calendar-container">
        <!-- Header -->
        <div class="header">
            <div class="date-section">
                <a href="/api/export/enhanced-weekly" class="weekly-overview-btn">
                    📅 Weekly Overview
                </a>
                <div>
                    <h1 class="date-title">${dayName}, ${monthDay}</h1>
                    <p class="subtitle">${stats.total} appointments</p>
                </div>
            </div>
            <div class="service-icons">
                <div class="service-icon">
                    <div class="icon simplepractice"></div>
                    <span>SimplePractice</span>
                </div>
                <div class="service-icon">
                    <div class="icon google"></div>
                    <span>Google Calendar</span>
                </div>
                <div class="service-icon">
                    <div class="icon holidays"></div>
                    <span>Holidays in United States</span>
                </div>
            </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Appointments</div>
            </div>
            <div class="stat">
                <div class="stat-number">${stats.scheduled}h</div>
                <div class="stat-label">Scheduled</div>
            </div>
            <div class="stat">
                <div class="stat-number">${stats.available}h</div>
                <div class="stat-label">Available</div>
            </div>
            <div class="stat">
                <div class="stat-number">${stats.freeTime}%</div>
                <div class="stat-label">Free Time</div>
            </div>
        </div>
        
        <!-- Calendar Grid -->
        <div class="calendar-grid">
            ${timeSlotsHTML.join('')}
            ${appointmentHTML}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <a href="/api/export/three-column-daily?date=${getPreviousDay(date)}" class="nav-btn">← Previous Day</a>
            <a href="/api/export/enhanced-weekly" class="weekly-overview-footer">
                📅 Weekly Overview
            </a>
            <a href="/api/export/three-column-daily?date=${getNextDay(date)}" class="nav-btn">Next Day →</a>
        </div>
    </div>
</body>
</html>`;
}

// Helper functions
function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function getNextDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

// Sample data generator (replace with your actual data fetching)
function getSampleDayData(date: string): DayData {
  // This is sample data - replace with your actual calendar data fetching logic
  const appointments: Appointment[] = [
    {
      id: '1',
      title: 'Richie Hayes Appointment',
      start: new Date(`${date}T07:00:00`),
      end: new Date(`${date}T08:00:00`),
      source: 'SimplePractice',
      notes: ['Discussed anxiety management techniques', 'Progress on breathing exercises'],
      actions: ['Schedule follow-up in 2 weeks', 'Send mindfulness resources']
    },
    {
      id: '2',
      title: 'John Best Appointment',
      start: new Date(`${date}T08:00:00`),
      end: new Date(`${date}T09:00:00`),
      source: 'SimplePractice',
      notes: [],
      actions: ['Review treatment plan']
    },
    {
      id: '3',
      title: 'Max Hafker Appointment',
      start: new Date(`${date}T09:00:00`),
      end: new Date(`${date}T10:00:00`),
      source: 'SimplePractice',
      notes: ['Working on relationship communication'],
      actions: []
    },
    {
      id: '4',
      title: 'Sarah Palladino Appointment',
      start: new Date(`${date}T11:00:00`),
      end: new Date(`${date}T12:00:00`),
      source: 'SimplePractice',
      notes: [],
      actions: []
    },
    {
      id: '5',
      title: 'Noah Silverman Appointment',
      start: new Date(`${date}T13:00:00`),
      end: new Date(`${date}T14:00:00`),
      source: 'SimplePractice',
      notes: ['CBT session progress'],
      actions: ['Assign homework exercises']
    },
    {
      id: '6',
      title: 'Trendall Storey Appointment',
      start: new Date(`${date}T16:00:00`),
      end: new Date(`${date}T17:00:00`),
      source: 'SimplePractice',
      notes: [],
      actions: ['Follow up on medication']
    },
    {
      id: '7',
      title: 'Michael Bower & Bob Delmond Appointment',
      start: new Date(`${date}T17:00:00`),
      end: new Date(`${date}T18:00:00`),
      source: 'SimplePractice',
      notes: ['Couples therapy session'],
      actions: []
    },
    {
      id: '8',
      title: 'Brianna Brickman Appointment',
      start: new Date(`${date}T18:00:00`),
      end: new Date(`${date}T19:00:00`),
      source: 'SimplePractice',
      notes: [],
      actions: []
    }
  ];

  return {
    date,
    appointments,
    stats: {
      total: appointments.length,
      scheduled: 9.0,
      available: 15.0,
      freeTime: 63
    }
  };
}

// Weekly overview HTML generator
function generateWeeklyHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Overview - July 14-20, 2025</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
        }
        .weekly-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border: 2px solid #333;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #333;
            text-align: center;
        }
        .week-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background: #333;
        }
        .day-column {
            background: white;
            min-height: 600px;
            padding: 15px;
        }
        .day-header {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .appointment-item {
            background: white;
            border: 1px solid #4285f4;
            border-left: 4px solid #4285f4;
            border-radius: 2px;
            padding: 8px;
            margin-bottom: 8px;
            font-size: 12px;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            display: block;
        }
        .appointment-item:hover {
            background: #f8f9fa;
        }
        .appointment-title {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .appointment-time {
            color: #666;
            font-size: 11px;
        }
        @media print {
            body { padding: 0; background: white; }
            .weekly-container { box-shadow: none; }
            @page { size: landscape; margin: 0.5in; }
        }
    </style>
</head>
<body>
    <div class="weekly-container">
        <div class="header">
            <h1>Weekly Overview - July 14-20, 2025</h1>
            <p>Click any appointment to view detailed daily view</p>
        </div>
        <div class="week-grid">
            <div class="day-column">
                <div class="day-header">Monday, July 14</div>
                <a href="/api/export/three-column-daily?date=2025-07-14" class="appointment-item">
                    <div class="appointment-title">Morning Session</div>
                    <div class="appointment-time">09:00-10:00</div>
                </a>
            </div>
            <div class="day-column">
                <div class="day-header">Tuesday, July 15</div>
                <a href="/api/export/three-column-daily?date=2025-07-15" class="appointment-item">
                    <div class="appointment-title">Team Meeting</div>
                    <div class="appointment-time">10:00-11:00</div>
                </a>
            </div>
            <div class="day-column">
                <div class="day-header">Wednesday, July 16</div>
                <a href="/api/export/three-column-daily?date=2025-07-16" class="appointment-item">
                    <div class="appointment-title">Client Session</div>
                    <div class="appointment-time">14:00-15:00</div>
                </a>
            </div>
            <div class="day-column">
                <div class="day-header">Thursday, July 17</div>
                <a href="/api/export/three-column-daily?date=2025-07-17" class="appointment-item">
                    <div class="appointment-title">David Grossman</div>
                    <div class="appointment-time">11:00-12:00</div>
                </a>
            </div>
            <div class="day-column">
                <div class="day-header">Friday, July 18</div>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">Richie Hayes</div>
                    <div class="appointment-time">07:00-08:00</div>
                </a>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">John Best</div>
                    <div class="appointment-time">08:00-09:00</div>
                </a>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">Max Hafker</div>
                    <div class="appointment-time">09:00-10:00</div>
                </a>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">Sarah Palladino</div>
                    <div class="appointment-time">11:00-12:00</div>
                </a>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">Noah Silverman</div>
                    <div class="appointment-time">13:00-14:00</div>
                </a>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">Trendall Storey</div>
                    <div class="appointment-time">16:00-17:00</div>
                </a>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">Michael Bower & Bob</div>
                    <div class="appointment-time">17:00-18:00</div>
                </a>
                <a href="/api/export/three-column-daily?date=2025-07-18" class="appointment-item">
                    <div class="appointment-title">Brianna Brickman</div>
                    <div class="appointment-time">18:00-19:00</div>
                </a>
            </div>
            <div class="day-column">
                <div class="day-header">Saturday, July 19</div>
                <a href="/api/export/three-column-daily?date=2025-07-19" class="appointment-item">
                    <div class="appointment-title">Weekend Session</div>
                    <div class="appointment-time">10:00-11:00</div>
                </a>
            </div>
            <div class="day-column">
                <div class="day-header">Sunday, July 20</div>
                <a href="/api/export/three-column-daily?date=2025-07-20" class="appointment-item">
                    <div class="appointment-title">Planning Session</div>
                    <div class="appointment-time">15:00-16:00</div>
                </a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Export route registration function
export function registerExportRoutes(app: Express): void {
  
  // Three-column daily export
  app.get('/api/export/three-column-daily', (req: Request, res: Response) => {
    try {
      const date = req.query.date as string || '2025-07-18';
      const dayData = getSampleDayData(date);
      const html = generateEnhancedDailyHTML(dayData);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating three-column daily export:', error);
      res.status(500).send('Error generating export');
    }
  });

  // Enhanced weekly package
  app.get('/api/export/enhanced-weekly', (req: Request, res: Response) => {
    try {
      const html = generateWeeklyHTML();
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating weekly export:', error);
      res.status(500).send('Error generating export');
    }
  });

  // Complete monthly package
  app.get('/api/export/complete-monthly', (req: Request, res: Response) => {
    try {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Calendar - July 2025</title>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .monthly-container { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #333; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #333; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #333; }
        .day-cell { background: white; min-height: 100px; padding: 10px; border: 1px solid #e0e0e0; }
        .day-number { font-weight: bold; margin-bottom: 5px; }
        .day-link { color: #4285f4; text-decoration: none; font-size: 12px; }
        .day-link:hover { text-decoration: underline; }
        @media print { @page { size: portrait; margin: 0.5in; } }
    </style>
</head>
<body>
    <div class="monthly-container">
        <div class="header">
            <h1>July 2025</h1>
            <p>Click any date to view detailed daily view</p>
        </div>
        <div class="calendar-grid">
            ${Array.from({length: 31}, (_, i) => {
              const day = i + 1;
              const date = `2025-07-${day.toString().padStart(2, '0')}`;
              return `
                <div class="day-cell">
                    <div class="day-number">${day}</div>
                    <a href="/api/export/three-column-daily?date=${date}" class="day-link">View Day</a>
                </div>
              `;
            }).join('')}
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating monthly export:', error);
      res.status(500).send('Error generating export');
    }
  });

  // Bidirectional package landing page
  app.get('/api/export/bidirectional-package', (req: Request, res: Response) => {
    try {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Export Package</title>
    <style>
        body { margin: 0; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .export-grid { display: grid; gap: 20px; }
        .export-card { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
        .export-link { display: block; text-decoration: none; color: inherit; }
        .export-link:hover .export-card { border-color: #4285f4; background: #f0f8ff; }
        .export-icon { font-size: 32px; margin-bottom: 10px; }
        .export-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .export-description { font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Complete Export Package</h1>
        <div class="export-grid">
            <a href="/api/export/three-column-daily?date=2025-07-18" class="export-link">
                <div class="export-card">
                    <div class="export-icon">📋</div>
                    <div class="export-title">Three-Column Daily Export</div>
                    <div class="export-description">Enhanced daily view with conditional columns for notes and actions</div>
                </div>
            </a>
            <a href="/api/export/enhanced-weekly" class="export-link">
                <div class="export-card">
                    <div class="export-icon">📊</div>
                    <div class="export-title">Enhanced Weekly Package</div>
                    <div class="export-description">Landscape weekly overview with clickable appointments</div>
                </div>
            </a>
            <a href="/api/export/complete-monthly" class="export-link">
                <div class="export-card">
                    <div class="export-icon">📅</div>
                    <div class="export-title">Complete Monthly Package</div>
                    <div class="export-description">Monthly calendar with daily detail navigation</div>
                </div>
            </a>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating package landing page:', error);
      res.status(500).send('Error generating export');
    }
  });

  console.log('✅ Enhanced export routes registered successfully');
}

