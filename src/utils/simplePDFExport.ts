import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

export async function exportSimplePDF(selectedDate: Date, events: CalendarEvent[]) {
  console.log('🚀 Starting Simple PDF Export');
  console.log('📅 Date:', selectedDate.toDateString());
  console.log('📊 Events:', events.length);

  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    // Add title
    pdf.setFontSize(20);
    pdf.text('Daily Planner', 50, 50);
    
    // Add date
    pdf.setFontSize(14);
    pdf.text(selectedDate.toDateString(), 50, 80);
    
    // Add events
    let yPos = 120;
    pdf.setFontSize(12);
    
    if (events.length === 0) {
      pdf.text('No events for this date', 50, yPos);
    } else {
      events.forEach((event, index) => {
        const eventDate = new Date(event.startTime);
        const timeText = `${eventDate.getHours()}:${eventDate.getMinutes().toString().padStart(2, '0')}`;
        const eventText = `${timeText} - ${event.title}`;
        
        pdf.text(eventText, 50, yPos);
        yPos += 20;
        
        if (yPos > 700) {
          pdf.addPage();
          yPos = 50;
        }
      });
    }

    // Save the PDF
    const filename = `simple-daily-${selectedDate.toISOString().split('T')[0]}.pdf`;
    console.log('💾 Saving PDF as:', filename);
    pdf.save(filename);
    
    console.log('✅ Simple PDF export completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Simple PDF export failed:', error);
    throw error;
  }
}