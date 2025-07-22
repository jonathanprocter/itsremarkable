// PDFGeneratorService.tsx
import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AppointmentData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'clinician_canceled' | 'client_canceled';
  clientName: string;
  duration: number;
}

interface ScheduleData {
  date: string;
  appointments: AppointmentData[];
  totalAppointments: number;
  scheduledHours: number;
  availableHours: number;
  freeTimePercentage: number;
}

// Transform your existing data to match the component interface
export const transformScheduleData = (rawData: any): ScheduleData => {
  // Calculate metrics properly
  const totalAppointments = rawData.appointments.length;
  const scheduledHours = rawData.appointments.reduce((sum: number, apt: any) => {
    return sum + (apt.duration || 1); // Default to 1 hour if duration not provided
  }, 0);
  
  // Calculate available hours (assuming 8 AM to 6 PM = 10 hours workday)
  const workdayHours = 10;
  const availableHours = Math.max(0, workdayHours - scheduledHours);
  const freeTimePercentage = Math.round((availableHours / workdayHours) * 100);

  return {
    date: rawData.date,
    appointments: rawData.appointments.map((apt: any) => ({
      id: apt.id,
      title: apt.title,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status || 'confirmed',
      clientName: apt.clientName || apt.title,
      duration: apt.duration || 1
    })),
    totalAppointments,
    scheduledHours,
    availableHours,
    freeTimePercentage
  };
};

// Method 1: Using html2canvas + jsPDF (recommended for React components)
export const generatePDFFromComponent = async (elementId: string, filename: string = 'daily-schedule.pdf'): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found`);
  }

  try {
    // Configure canvas options for better quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200,
      windowHeight: 800
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions to fit A4
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add extra pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Usage example in your React component
export const usePDFExport = () => {
  const exportToPDF = async (data: ScheduleData) => {
    // Create a temporary container for the PDF component
    const container = document.createElement('div');
    container.id = 'pdf-export-container';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1200px';
    container.style.backgroundColor = '#ffffff';
    
    document.body.appendChild(container);
    
    try {
      // Render the component to the container
      const React = require('react');
      const ReactDOM = require('react-dom/client');
      const DailySchedulePDFExport = require('./DailySchedulePDFExport').default;
      
      const root = ReactDOM.createRoot(container);
      
      await new Promise<void>((resolve) => {
        root.render(
          React.createElement(DailySchedulePDFExport, { data }),
        );
        // Wait for rendering to complete
        setTimeout(resolve, 1000);
      });
      
      // Generate PDF
      await generatePDFFromComponent('pdf-export-container', `schedule-${data.date}.pdf`);
      
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  };
  
  return { exportToPDF };
};

// Example integration with your existing code
export const ExportButton: React.FC<{ scheduleData: any }> = ({ scheduleData }) => {
  const { exportToPDF } = usePDFExport();
  
  const handleExport = async () => {
    try {
      const transformedData = transformScheduleData(scheduleData);
      await exportToPDF(transformedData);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };
  
  return (
    <button 
      onClick={handleExport}
      className="export-pdf-button"
      style={{
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Export PDF
    </button>
  );
};