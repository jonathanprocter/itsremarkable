import { CalendarEvent } from '../types/calendar';

/**
 * Demo of the Export Audit System
 * This shows exactly what the audit system captures and reports
 */

// Example of events from the current dashboard (based on console logs)
const mockDashboardEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Nancy Grossman Appointment',
    startTime: new Date('2025-07-07T10:00:00'),
    endTime: new Date('2025-07-07T11:00:00'),
    source: 'simplepractice',
    color: '#4285F4',
    notes: 'Patient progress discussion\n• Review medication compliance\n• Discuss coping strategies',
    actionItems: 'Follow up on therapy goals\n• Schedule next appointment\n• Contact primary care'
  },
  {
    id: '2',
    title: 'Dan re: Supervision',
    startTime: new Date('2025-07-07T14:00:00'),
    endTime: new Date('2025-07-07T15:00:00'),
    source: 'google',
    color: '#34A853',
    notes: 'Weekly supervision meeting\n• Case review\n• Professional development',
    actionItems: 'Prepare case notes\n• Review ethical guidelines\n• Update supervision log'
  },
  {
    id: '3',
    title: 'Sherrifa Hoosein Appointment',
    startTime: new Date('2025-07-07T16:00:00'),
    endTime: new Date('2025-07-07T17:00:00'),
    source: 'simplepractice',
    color: '#4285F4',
    notes: 'Initial consultation\n• Assessment\n• Treatment planning',
    actionItems: 'Complete intake forms\n• Schedule follow-up\n• Coordinate with team'
  },
  {
    id: '4',
    title: '🔒 Nico Luppino Appointment',
    startTime: new Date('2025-07-07T11:00:00'),
    endTime: new Date('2025-07-07T12:00:00'),
    source: 'simplepractice',
    color: '#4285F4',
    notes: '',
    actionItems: ''
  }
];

export function demoAuditSystem() {
  console.log('\n=== EXPORT AUDIT SYSTEM DEMO ===');
  console.log('This demonstrates what the audit system captures:\n');
  
  // Import the audit functions
  import('../utils/exportAudit').then(({ auditExportData, logExportAudit, cleanEventTitle }) => {
    
    // 1. Show event data validation
    console.log('1. EVENT DATA VALIDATION:');
    mockDashboardEvents.forEach((event, index) => {
      console.log(`   Event ${index + 1}:`);
      console.log(`   - Title: "${event.title}"`);
      console.log(`   - Cleaned Title: "${cleanEventTitle(event.title)}"`);
      console.log(`   - Has Notes: ${!!(event.notes && event.notes.trim())}`);
      console.log(`   - Has Action Items: ${!!(event.actionItems && event.actionItems.trim())}`);
      console.log(`   - Source: ${event.source}`);
      console.log('');
    });
    
    // 2. Show audit report for daily view
    console.log('2. DAILY VIEW AUDIT REPORT:');
    const selectedDate = new Date('2025-07-07');
    const auditReport = auditExportData(mockDashboardEvents, mockDashboardEvents, selectedDate);
    logExportAudit(auditReport, 'Daily View');
    
    // 3. Show what happens with calendar filtering
    console.log('3. CALENDAR FILTERING AUDIT:');
    const filteredEvents = mockDashboardEvents.filter(event => event.source !== 'google');
    const filteredAudit = auditExportData(mockDashboardEvents, filteredEvents, selectedDate);
    logExportAudit(filteredAudit, 'Filtered Daily View');
    
    console.log('4. SPECIFIC ISSUES DETECTED:');
    console.log('   - Lock symbol in Nico Luppino event (will be cleaned)');
    console.log('   - Missing notes/action items in some events');
    console.log('   - Calendar filtering changes event count');
    console.log('   - Text encoding issues handled automatically');
    
    console.log('\n=== AUDIT SYSTEM BENEFITS ===');
    console.log('✓ Ensures PDF exports match dashboard exactly');
    console.log('✓ Validates all event data before export');
    console.log('✓ Cleans problematic text (lock symbols, corrupted characters)');
    console.log('✓ Reports missing notes and action items');
    console.log('✓ Tracks calendar filtering effects');
    console.log('✓ Provides detailed export statistics');
    
  });
}

// Make it available globally for testing
(window as any).demoAuditSystem = demoAuditSystem;