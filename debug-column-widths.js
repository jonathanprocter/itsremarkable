/**
 * Debug script to inspect column widths and identify the root cause
 * Run this in the browser console on the planner page
 */

function debugColumnWidths() {
    console.log('=== COLUMN WIDTH DEBUG ===');
    
    // Find the calendar grid
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) {
        console.error('Calendar grid not found');
        return;
    }
    
    console.log('Calendar grid:', calendarGrid);
    console.log('Grid computed styles:', window.getComputedStyle(calendarGrid));
    
    // Get all header cells (day columns)
    const headerCells = document.querySelectorAll('.calendar-cell.header-cell');
    console.log(`Found ${headerCells.length} header cells`);
    
    // Analyze each header cell
    headerCells.forEach((cell, index) => {
        const rect = cell.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(cell);
        
        console.log(`Header Cell ${index}:`, {
            text: cell.textContent,
            width: rect.width,
            computedWidth: computedStyle.width,
            gridColumn: computedStyle.gridColumn,
            borderLeft: computedStyle.borderLeft,
            borderRight: computedStyle.borderRight,
            paddingLeft: computedStyle.paddingLeft,
            paddingRight: computedStyle.paddingRight,
            marginLeft: computedStyle.marginLeft,
            marginRight: computedStyle.marginRight,
            boxSizing: computedStyle.boxSizing
        });
    });
    
    // Check grid template columns
    const gridTemplateColumns = window.getComputedStyle(calendarGrid).gridTemplateColumns;
    console.log('Grid template columns:', gridTemplateColumns);
    
    // Check for any width constraints on parent containers
    let parent = calendarGrid.parentElement;
    let level = 0;
    while (parent && level < 5) {
        const parentStyle = window.getComputedStyle(parent);
        console.log(`Parent ${level} (${parent.className}):`, {
            width: parentStyle.width,
            maxWidth: parentStyle.maxWidth,
            minWidth: parentStyle.minWidth,
            display: parentStyle.display,
            flexBasis: parentStyle.flexBasis,
            gridTemplateColumns: parentStyle.gridTemplateColumns
        });
        parent = parent.parentElement;
        level++;
    }
    
    // Check for any overlapping CSS rules
    const allCalendarCells = document.querySelectorAll('.calendar-cell');
    console.log(`Total calendar cells: ${allCalendarCells.length}`);
    
    // Test CSS rule conflicts
    const testCell = headerCells[1]; // Test second header cell
    if (testCell) {
        console.log('Test cell CSS rules:', {
            appliedRules: window.getComputedStyle(testCell),
            classList: testCell.classList.toString()
        });
    }
}

// Run the debug
debugColumnWidths();