import React from 'react';
import { DailyScheduleData } from '../types/schedule';

interface AppointmentSource {
  source: 'google' | 'simplepractice' | 'manual' | 'holiday';
}

interface DailySchedulePDFExportProps {
  data: DailyScheduleData & {
    appointments: (DailyScheduleData['appointments'][0] & { source?: string })[];
  };
}

const DailySchedulePDFExport: React.FC<DailySchedulePDFExportProps> = ({ data }) => {
  // Debug: Log the received data
  console.log('📊 DailySchedulePDFExport received data:', data);
  console.log('📅 Appointments:', data.appointments);

  // Generate time slots for the day (7 AM to 7 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 19) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  console.log('🕒 Generated time slots:', timeSlots.slice(0, 5), '... (total:', timeSlots.length, ')');

  // Helper function to format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Helper function to get appointment for time slot
  const getAppointmentForSlot = (timeSlot: string) => {
    // Try exact match first
    let appointment = data.appointments.find(apt => apt.startTime === timeSlot);
    
    // If no exact match, try to find appointment that starts within this time slot
    if (!appointment) {
      const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
      const slotTotalMinutes = slotHours * 60 + slotMinutes;
      
      appointment = data.appointments.find(apt => {
        const [aptHours, aptMinutes] = apt.startTime.split(':').map(Number);
        const aptTotalMinutes = aptHours * 60 + aptMinutes;
        
        // Check if appointment starts within this 30-minute slot
        return aptTotalMinutes >= slotTotalMinutes && aptTotalMinutes < slotTotalMinutes + 30;
      });
    }
    
    return appointment;
  };

  // Helper function to get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'clinician_canceled':
        return 'clinician-cancelled';
      case 'client_canceled':
        return 'client-cancelled';
      default:
        return 'confirmed';
    }
  };

  // Helper function to get badge text
  const getBadgeText = (status: string) => {
    switch (status) {
      case 'clinician_canceled':
        return 'Clinician Canceled';
      case 'client_canceled':
        return 'Client Canceled';
      default:
        return null;
    }
  };

  // Helper function to get badge class
  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'clinician_canceled':
        return 'clinician-badge';
      case 'client_canceled':
        return 'client-badge';
      default:
        return '';
    }
  };

  // Helper function to get source-based styling
  const getSourceStyling = (source: string) => {
    switch (source) {
      case 'google':
        return {
          border: '2px dashed #4285f4',
          backgroundColor: '#f8fbff',
          borderRadius: '4px'
        };
      case 'simplepractice':
        return {
          border: '1px solid #6c8ebf',
          borderLeft: '4px solid #6c8ebf',
          backgroundColor: '#ffffff',
          borderRadius: '4px'
        };
      case 'holiday':
        return {
          border: '1px solid #ff9500',
          backgroundColor: '#fff8e1',
          borderRadius: '4px'
        };
      default:
        return {
          border: '1px solid #9ca3af',
          backgroundColor: '#f9fafb',
          borderRadius: '4px'
        };
    }
  };

  const pdfStyles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#ffffff',
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: '#333'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e9ecef'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: 600,
      margin: 0,
      color: '#212529'
    },
    appointmentCount: {
      fontSize: '14px',
      color: '#6c757d',
      margin: '4px 0 0 0'
    },
    headerStats: {
      display: 'flex',
      gap: '32px'
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      textAlign: 'center' as const
    },
    statNumber: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#212529',
      lineHeight: 1.2
    },
    statLabel: {
      fontSize: '12px',
      color: '#6c757d',
      marginTop: '2px'
    },
    legend: {
      display: 'flex',
      gap: '24px',
      marginBottom: '20px',
      padding: '12px 0'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: '#6c757d'
    },
    legendColor: {
      width: '12px',
      height: '12px',
      borderRadius: '2px'
    },
    scheduleGrid: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1px',
      background: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    timeSlot: {
      display: 'flex',
      minHeight: '40px',
      background: '#ffffff',
      borderBottom: '1px solid #f1f3f4'
    },
    timeLabel: {
      width: '80px',
      padding: '12px 16px',
      fontSize: '12px',
      fontWeight: 500,
      color: '#6c757d',
      background: '#f8f9fa',
      borderRight: '1px solid #e9ecef',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0
    },
    appointmentArea: {
      flex: 1,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center'
    },
    appointmentBox: {
      position: 'relative' as const,
      width: '100%',
      padding: '12px 16px',
      borderRadius: '8px',
      background: '#ffffff',
      border: '1.5px solid #6c8ebf',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease'
    },
    appointmentContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px'
    },
    appointmentTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#212529',
      lineHeight: 1.3
    },
    appointmentTime: {
      fontSize: '12px',
      color: '#6c757d',
      fontWeight: 500
    }
  };

  return (
    <div style={pdfStyles.container}>
      {/* Header */}
      <div style={pdfStyles.header}>
        <div>
          <h1 style={pdfStyles.headerTitle}>Daily Schedule</h1>
          <div style={pdfStyles.appointmentCount}>
            {data.totalAppointments} appointments scheduled for {new Date(data.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        <div style={pdfStyles.headerStats}>
          <div style={pdfStyles.statItem}>
            <div style={pdfStyles.statNumber}>{data.totalAppointments}</div>
            <div style={pdfStyles.statLabel}>Total Appointments</div>
          </div>
          <div style={pdfStyles.statItem}>
            <div style={pdfStyles.statNumber}>{data.scheduledHours}h</div>
            <div style={pdfStyles.statLabel}>Scheduled Hours</div>
          </div>
          <div style={pdfStyles.statItem}>
            <div style={pdfStyles.statNumber}>{data.availableHours}h</div>
            <div style={pdfStyles.statLabel}>Available Hours</div>
          </div>
          <div style={pdfStyles.statItem}>
            <div style={pdfStyles.statNumber}>{data.freeTimePercentage}%</div>
            <div style={pdfStyles.statLabel}>Free Time</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={pdfStyles.legend}>
        <div style={pdfStyles.legendItem}>
          <div style={{...pdfStyles.legendColor, background: '#6c8ebf'}}></div>
          <span>SimplePractice</span>
        </div>
        <div style={pdfStyles.legendItem}>
          <div style={{...pdfStyles.legendColor, background: '#4285f4'}}></div>
          <span>Google Calendar</span>
        </div>
        <div style={pdfStyles.legendItem}>
          <div style={{...pdfStyles.legendColor, background: '#ff9500'}}></div>
          <span>Holidays in United States</span>
        </div>
      </div>

      {/* Schedule Grid */}
      <div style={pdfStyles.scheduleGrid}>
        {timeSlots.map((timeSlot, index) => {
          const appointment = getAppointmentForSlot(timeSlot);
          
          // Debug log for first few slots
          if (index < 5) {
            console.log(`🕒 Time slot ${timeSlot}: ${appointment ? `Found appointment: ${appointment.clientName}` : 'No appointment'}`);
          }
          
          return (
            <div key={timeSlot} style={pdfStyles.timeSlot}>
              <div style={pdfStyles.timeLabel}>
                {formatTime(timeSlot)}
              </div>
              <div style={pdfStyles.appointmentArea}>
                {appointment ? (
                  <div style={{
                    ...pdfStyles.appointmentBox,
                    ...(appointment.status === 'clinician_canceled' && {
                      background: '#e9ecef',
                      border: '1.5px solid #adb5bd',
                      opacity: 0.8
                    }),
                    ...(appointment.status === 'client_canceled' && {
                      background: '#fffbe6',
                      border: '1.5px solid #ffe066',
                      opacity: 0.8
                    })
                  }}>
                    <div style={pdfStyles.appointmentContent}>
                      <div style={{
                        ...pdfStyles.appointmentTitle,
                        ...(appointment.status !== 'confirmed' && {
                          textDecoration: 'line-through',
                          textDecorationColor: '#dc3545',
                          textDecorationThickness: '2px'
                        })
                      }}>
                        {appointment.clientName}
                      </div>
                      <div style={pdfStyles.appointmentTime}>
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                    </div>
                    {getBadgeText(appointment.status) && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        lineHeight: 1,
                        ...(appointment.status === 'clinician_canceled' && {
                          background: '#adb5bd',
                          color: '#212529'
                        }),
                        ...(appointment.status === 'client_canceled' && {
                          background: '#ffe066',
                          color: '#856404'
                        })
                      }}>
                        {getBadgeText(appointment.status)}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailySchedulePDFExport;