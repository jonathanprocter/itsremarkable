/**
 * Grid Positioning Test Script
 * Run in browser console to verify CSS Grid positioning works
 */

console.log("🏗️ CSS GRID POSITIONING TEST");
console.log("=" * 50);

// 1. Check appointments column grid setup
const appointmentsColumn = document.querySelector('.appointments-column');
if (appointmentsColumn) {
    const styles = window.getComputedStyle(appointmentsColumn);
    console.log("✅ Appointments Column Found");
    console.log(`📐 Display: ${styles.display}`);
    console.log(`📐 Grid Template Rows: ${styles.gridTemplateRows}`);
    console.log(`📏 Height: ${styles.height}`);
    
    // Check if it's a grid
    if (styles.display === 'grid') {
        console.log("🎯 GRID DISPLAY CONFIRMED");
    } else {
        console.log("❌ NOT USING GRID DISPLAY");
    }
} else {
    console.log("❌ Appointments Column NOT FOUND");
}

// 2. Check individual appointments and their grid positioning
const appointments = document.querySelectorAll('.appointment');
console.log(`\n📅 Found ${appointments.length} appointments`);

appointments.forEach((appt, index) => {
    const styles = window.getComputedStyle(appt);
    const title = appt.querySelector('.appointment-title-bold')?.textContent?.trim() || 'Unknown';
    
    console.log(`\n📍 Appointment ${index + 1}: "${title}"`);
    console.log(`  Grid Row Start: ${styles.gridRowStart}`);
    console.log(`  Grid Row End: ${styles.gridRowEnd}`);
    console.log(`  Position: ${styles.position}`);
    console.log(`  Z-Index: ${styles.zIndex}`);
    
    // Check if appointment is using grid positioning
    if (styles.gridRowStart && styles.gridRowStart !== 'auto') {
        const rowStart = parseInt(styles.gridRowStart);
        const rowEnd = parseInt(styles.gridRowEnd);
        const span = rowEnd - rowStart;
        console.log(`  🎯 USING GRID: Spans ${span} rows (${rowStart} to ${rowEnd})`);
        
        // Calculate expected time from grid row
        const expectedStartTime = Math.floor((rowStart - 1) / 2) + 6;
        const expectedStartMinute = ((rowStart - 1) % 2) * 30;
        console.log(`  ⏰ Expected Time: ${expectedStartTime}:${expectedStartMinute.toString().padStart(2, '0')}`);
    } else {
        console.log(`  ❌ NOT USING GRID POSITIONING`);
    }
});

// 3. Check for any appointments still using absolute positioning
const absoluteAppointments = Array.from(appointments).filter(appt => {
    return window.getComputedStyle(appt).position === 'absolute';
});

if (absoluteAppointments.length > 0) {
    console.log(`\n⚠️ WARNING: ${absoluteAppointments.length} appointments still using absolute positioning:`);
    absoluteAppointments.forEach((appt, index) => {
        const title = appt.querySelector('.appointment-title-bold')?.textContent?.trim() || 'Unknown';
        const styles = window.getComputedStyle(appt);
        console.log(`  ${index + 1}. "${title}" - Position: ${styles.position}, Top: ${styles.top}`);
    });
} else {
    console.log("\n✅ NO APPOINTMENTS USING ABSOLUTE POSITIONING");
}

// 4. Check background patterns
console.log("\n🎨 BACKGROUND PATTERN CHECK");
const scheduleGrid = document.querySelector('.schedule-grid');
if (scheduleGrid) {
    const beforeStyles = window.getComputedStyle(scheduleGrid, '::before');
    console.log(`Background: ${beforeStyles.background || 'Not detected'}`);
    
    if (beforeStyles.background && beforeStyles.background.includes('repeating-linear-gradient')) {
        console.log("✅ REPEATING GRADIENT BACKGROUND DETECTED");
    } else {
        console.log("❌ REPEATING GRADIENT NOT FOUND");
    }
} else {
    console.log("❌ Schedule Grid NOT FOUND");
}

console.log("\n🏁 GRID POSITIONING TEST COMPLETE");
console.log("Check above for any grid positioning issues");