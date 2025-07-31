/**
 * Browser-based alignment test script
 * Run this in browser console on the daily view to check alignment
 */

console.log("🔍 DAILY VIEW ALIGNMENT TEST");
console.log("=" * 50);

// 1. Check if schedule grid is properly constructed
const scheduleGrid = document.querySelector('.schedule-grid');
if (scheduleGrid) {
    const gridStyles = window.getComputedStyle(scheduleGrid);
    console.log("✅ Schedule Grid Found");
    console.log(`📐 Grid Template Columns: ${gridStyles.gridTemplateColumns}`);
    console.log(`📐 Grid Template Rows: ${gridStyles.gridTemplateRows}`);
    console.log(`📏 Height: ${gridStyles.height}`);
    console.log(`📍 Position: ${gridStyles.position}`);
    
    // Check for background pattern
    const beforeStyles = window.getComputedStyle(scheduleGrid, '::before');
    console.log(`🎨 Background Pattern: ${beforeStyles.background || 'Not found'}`);
} else {
    console.log("❌ Schedule Grid NOT FOUND");
}

// 2. Check time column
const timeColumn = document.querySelector('.time-column');
if (timeColumn) {
    console.log("✅ Time Column Found");
    const timeSlots = timeColumn.querySelectorAll('.time-slot');
    console.log(`⏰ Time Slots Count: ${timeSlots.length}`);
    
    // Check first few time slots
    Array.from(timeSlots).slice(0, 5).forEach((slot, index) => {
        const rect = slot.getBoundingClientRect();
        console.log(`  Slot ${index}: "${slot.textContent.trim()}" - Height: ${rect.height}px, Top: ${rect.top}px`);
    });
} else {
    console.log("❌ Time Column NOT FOUND");
}

// 3. Check appointments column
const appointmentsColumn = document.querySelector('.appointments-column');
if (appointmentsColumn) {
    console.log("✅ Appointments Column Found");
    const appointments = appointmentsColumn.querySelectorAll('.appointment');
    console.log(`📅 Appointments Count: ${appointments.length}`);
    
    // Check each appointment positioning
    Array.from(appointments).forEach((appt, index) => {
        const styles = window.getComputedStyle(appt);
        const rect = appt.getBoundingClientRect();
        const title = appt.querySelector('.appointment-title')?.textContent?.trim() || 'Unknown';
        
        console.log(`  📍 Appointment ${index + 1}: "${title}"`);
        console.log(`    Position: ${styles.position}`);
        console.log(`    Top: ${styles.top}`);
        console.log(`    Height: ${styles.height}`);
        console.log(`    Computed Rect: Top=${Math.round(rect.top)}px, Height=${Math.round(rect.height)}px`);
        console.log(`    Z-Index: ${styles.zIndex}`);
    });
} else {
    console.log("❌ Appointments Column NOT FOUND");
}

// 4. Calculate expected vs actual positioning for sample appointments
console.log("\n🎯 POSITIONING VERIFICATION");
const sampleTimes = [
    { time: "10:00", expectedTop: 320 },
    { time: "11:00", expectedTop: 400 },
    { time: "14:00", expectedTop: 640 }
];

sampleTimes.forEach(sample => {
    console.log(`⏰ ${sample.time} should be at ${sample.expectedTop}px from grid top`);
    
    // Try to find appointment at this time
    const appointments = document.querySelectorAll('.appointment');
    let found = false;
    
    Array.from(appointments).forEach(appt => {
        const timeDisplay = appt.querySelector('.appointment-time')?.textContent;
        if (timeDisplay && timeDisplay.includes(sample.time)) {
            const styles = window.getComputedStyle(appt);
            const actualTop = parseInt(styles.top) || 0;
            const accuracy = actualTop === sample.expectedTop ? "✅ PERFECT" : `❌ MISALIGNED (${actualTop}px)`;
            console.log(`  Found: ${accuracy} - Actual: ${actualTop}px, Expected: ${sample.expectedTop}px`);
            found = true;
        }
    });
    
    if (!found) {
        console.log(`  ⚠️ No appointment found for ${sample.time}`);
    }
});

// 5. Check background alternation
console.log("\n🎨 BACKGROUND ALTERNATION CHECK");
const timeSlots = document.querySelectorAll('.time-slot');
Array.from(timeSlots).slice(0, 8).forEach((slot, index) => {
    const rect = slot.getBoundingClientRect();
    const isHourSlot = index % 2 === 0;
    const expectedBg = isHourSlot ? "Grey (#f0f0f0)" : "White/Transparent";
    console.log(`  Slot ${index}: ${slot.textContent.trim()} - Expected: ${expectedBg}, Position: ${Math.round(rect.top)}px`);
});

console.log("\n🏁 ALIGNMENT TEST COMPLETE");
console.log("Check console output above for any alignment issues");