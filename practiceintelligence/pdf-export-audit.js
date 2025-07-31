// PDF Export Audit Script - July 20, 2025
// Comprehensive audit of isolatedCalendarPDF.ts implementation

console.log("=== PDF EXPORT AUDIT STARTING ===");

// Test the isolated calendar PDF export function
async function auditPDFExport() {
  try {
    // Get today's date (July 20, 2025)
    const testDate = new Date('2025-07-20');
    console.log("📅 Testing date:", testDate.toDateString());
    
    // Fetch events from API
    const response = await fetch('/api/events');
    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status}`);
    }
    
    const allEvents = await response.json();
    console.log("📊 Total events loaded:", allEvents.length);
    
    // Filter events for July 20, 2025
    const filteredEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getFullYear() === testDate.getFullYear() &&
             eventDate.getMonth() === testDate.getMonth() &&
             eventDate.getDate() === testDate.getDate();
    });
    
    console.log("📅 Events for July 20, 2025:", filteredEvents.length);
    
    // List all appointments for the test date
    filteredEvents.forEach((event, i) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      console.log(`${i+1}. ${event.title}`);
      console.log(`   Time: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
      console.log(`   Duration: ${(end - start) / (1000 * 60)} minutes`);
      console.log(`   Source: ${event.source}`);
    });
    
    // Critical checks for known requirements
    console.log("\n=== CRITICAL REQUIREMENT CHECKS ===");
    
    // 1. Check for Amberly Comeau appointment at 22:30-23:30
    const amberlyAppointment = filteredEvents.find(event => 
      event.title.includes("Amberly") && event.title.includes("Comeau")
    );
    
    if (amberlyAppointment) {
      console.log("✅ FOUND: Amberly Comeau appointment");
      const amberlyStart = new Date(amberlyAppointment.startTime);
      const amberlyEnd = new Date(amberlyAppointment.endTime);
      console.log(`   Time: ${amberlyStart.toLocaleTimeString()} - ${amberlyEnd.toLocaleTimeString()}`);
    } else {
      console.log("❌ MISSING: Amberly Comeau appointment (22:30-23:30)");
    }
    
    // 2. Check for David Grossman multi-hour appointment
    const davidAppointment = filteredEvents.find(event => 
      event.title.includes("David") && event.title.includes("Grossman")
    );
    
    if (davidAppointment) {
      console.log("✅ FOUND: David Grossman appointment");
      const davidStart = new Date(davidAppointment.startTime);
      const davidEnd = new Date(davidAppointment.endTime);
      const durationMinutes = (davidEnd - davidStart) / (1000 * 60);
      console.log(`   Time: ${davidStart.toLocaleTimeString()} - ${davidEnd.toLocaleTimeString()}`);
      console.log(`   Duration: ${durationMinutes} minutes`);
      
      if (durationMinutes > 60) {
        console.log("✅ CONFIRMED: Multi-hour appointment (>60 minutes)");
      } else {
        console.log("⚠️  WARNING: Expected multi-hour appointment");
      }
    } else {
      console.log("❌ MISSING: David Grossman appointment");
    }
    
    // 3. Statistics calculation audit
    console.log("\n=== STATISTICS AUDIT ===");
    
    const appointmentCount = filteredEvents.length;
    console.log("📊 Appointment count:", appointmentCount);
    
    // Calculate total scheduled hours
    let totalScheduledMinutes = 0;
    filteredEvents.forEach(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const durationMinutes = (end - start) / (1000 * 60);
      totalScheduledMinutes += durationMinutes;
    });
    
    const totalScheduledHours = totalScheduledMinutes / 60;
    console.log("⏰ Total scheduled hours:", totalScheduledHours.toFixed(1));
    
    // Working day calculation (6:00 AM to 12:00 AM = 18 hours)
    const totalWorkingHours = 18;
    const availableHours = totalWorkingHours - totalScheduledHours;
    const freeTimePercentage = (availableHours / totalWorkingHours) * 100;
    
    console.log("🕐 Working day hours:", totalWorkingHours);
    console.log("💪 Available hours:", availableHours.toFixed(1));
    console.log("📈 Free time percentage:", freeTimePercentage.toFixed(0) + "%");
    
    // Expected values check
    console.log("\n=== EXPECTED VALUES VERIFICATION ===");
    
    const expectedStats = {
      appointments: 12,
      scheduledHours: 11.5,
      freeTimePercentage: 52
    };
    
    console.log("Expected appointment count: 12, Actual:", appointmentCount);
    if (appointmentCount === expectedStats.appointments) {
      console.log("✅ CORRECT: Appointment count matches expected");
    } else {
      console.log("❌ INCORRECT: Appointment count mismatch");
    }
    
    console.log("Expected scheduled hours: 11.5h, Actual:", totalScheduledHours.toFixed(1) + "h");
    if (Math.abs(totalScheduledHours - expectedStats.scheduledHours) < 0.1) {
      console.log("✅ CORRECT: Scheduled hours match expected");
    } else {
      console.log("❌ INCORRECT: Scheduled hours mismatch");
    }
    
    console.log("Expected free time: 52%, Actual:", Math.round(freeTimePercentage) + "%");
    if (Math.abs(Math.round(freeTimePercentage) - expectedStats.freeTimePercentage) <= 1) {
      console.log("✅ CORRECT: Free time percentage matches expected");
    } else {
      console.log("❌ INCORRECT: Free time percentage mismatch");
    }
    
    console.log("\n=== AUDIT SUMMARY ===");
    
    const auditResults = {
      hasAmberlyAppointment: !!amberlyAppointment,
      hasDavidAppointment: !!davidAppointment,
      correctAppointmentCount: appointmentCount === expectedStats.appointments,
      correctScheduledHours: Math.abs(totalScheduledHours - expectedStats.scheduledHours) < 0.1,
      correctFreeTimePercentage: Math.abs(Math.round(freeTimePercentage) - expectedStats.freeTimePercentage) <= 1
    };
    
    const passedChecks = Object.values(auditResults).filter(result => result === true).length;
    const totalChecks = Object.keys(auditResults).length;
    const completionPercentage = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`📊 COMPLETION: ${passedChecks}/${totalChecks} checks passed (${completionPercentage}%)`);
    
    if (completionPercentage === 100) {
      console.log("🎉 PERFECT: All audit checks passed!");
    } else {
      console.log("⚠️  NEEDS WORK: Some checks failed");
      
      // List failed checks
      Object.entries(auditResults).forEach(([check, passed]) => {
        if (!passed) {
          console.log(`❌ FAILED: ${check}`);
        }
      });
    }
    
    return {
      completionPercentage,
      auditResults,
      filteredEvents,
      statistics: {
        appointmentCount,
        totalScheduledHours: parseFloat(totalScheduledHours.toFixed(1)),
        availableHours: parseFloat(availableHours.toFixed(1)),
        freeTimePercentage: Math.round(freeTimePercentage)
      }
    };
    
  } catch (error) {
    console.error("❌ AUDIT FAILED:", error);
    return {
      completionPercentage: 0,
      error: error.message
    };
  }
}

// Run the audit
auditPDFExport().then(results => {
  console.log("=== FINAL AUDIT RESULTS ===");
  console.log(results);
});