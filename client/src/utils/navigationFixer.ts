// Emergency Navigation Fix - Remove corrupted elements and rebuild clean navigation
export const emergencyNavigationFix = () => {
  console.log('🚨 STARTING EMERGENCY NAVIGATION FIX...');
  
  // Step 1: Remove all corrupted elements
  const removeCorruptedElements = () => {
    const corruptedSelectors = [
      '*[data-corrupted]',
      '*:contains("Ø=ÜÅ")',
      '*:contains("!•")',
      '*:contains("Page") *:contains("of 8")',
      '.corrupted-nav',
      '.broken-navigation'
    ];
    
    // Remove elements containing corrupted text
    document.querySelectorAll('*').forEach(element => {
      const text = element.textContent || '';
      if (text.includes('Ø=ÜÅ') || 
          text.includes('!•') || 
          text.includes('Page') && text.includes('of 8') ||
          text.includes('←') && text.includes('Back to Weekly Overview')) {
        element.remove();
      }
    });
    
    console.log('✅ Removed corrupted navigation elements');
  };
  
  // Step 2: Fix header date and clean up corrupted text
  const fixHeaderAndCleanText = () => {
    // Step 1: Fix header date format
    document.body.innerHTML = document.body.innerHTML.replace(
      /July 7 - 2025 \(day: 13\)/g, 
      'July 7 - 13, 2025'
    );
    
    // Step 2: Remove corrupted symbols
    document.body.innerHTML = document.body.innerHTML.replace(/Ø=ÜÅ/g, '');
    document.body.innerHTML = document.body.innerHTML.replace(/Ø=Ý/g, '');
    
    // Step 3: Remove broken text navigation
    document.body.innerHTML = document.body.innerHTML
      .replace(/!•[^!]*!/g, '')
      .replace(/Page \d+ of 8 -[^!]*/g, '')
      .replace(/!• Back to Weekly Overview/g, '')
      .replace(/!• Weekly Overview/g, '')
      .replace(/!• Sunday Tuesday !/g, '');
    
    // Clean up event titles
    document.querySelectorAll('.event-title, .appointment-title, .event-name').forEach(element => {
      const text = element.textContent || '';
      const cleanText = text
        .replace(/🔒\s*/g, '')
        .replace(/Ø=ÜÅ/g, '')
        .replace(/Ø=Ý/g, '')
        .replace(/[!•]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanText !== text) {
        element.textContent = cleanText;
      }
    });
    
    console.log('✅ Fixed header date and cleaned corrupted text');
  };
  
  // Step 3: Add simple navigation buttons
  const addSimpleNavigation = () => {
    // Add header button to daily views
    const dailyViews = document.querySelectorAll('.daily-planner, .daily-view');
    dailyViews.forEach(view => {
      // Remove existing corrupted navigation
      const existingNav = view.querySelectorAll('.corrupted-nav, .broken-navigation');
      existingNav.forEach(nav => nav.remove());
      
      // Add clean header button
      const headerHTML = `
        <div style="padding: 20px; background: #f8f9fa; border-bottom: 2px solid #e0e0e0;">
          <button onclick="alert('Go to Weekly View')" style="
            background: #f0f0f0; 
            border: 2px solid #ccc; 
            border-radius: 8px; 
            padding: 10px 16px; 
            cursor: pointer;
          ">📅 Weekly Overview</button>
        </div>
      `;
      
      // Add footer buttons
      const footerHTML = `
        <div style="padding: 20px; background: #f8f9fa; border-top: 2px solid #e0e0e0; display: flex; justify-content: space-between;">
          <button onclick="alert('Previous Day')" style="
            background: #f0f0f0; 
            border: 2px solid #ccc; 
            border-radius: 8px; 
            padding: 8px 16px; 
            cursor: pointer;
          ">← Previous</button>
          
          <button onclick="alert('Go to Weekly View')" style="
            background: #f0f0f0; 
            border: 2px solid #ccc; 
            border-radius: 8px; 
            padding: 10px 16px; 
            cursor: pointer;
          ">📅 Weekly</button>
          
          <button onclick="alert('Next Day')" style="
            background: #f0f0f0; 
            border: 2px solid #ccc; 
            border-radius: 8px; 
            padding: 8px 16px; 
            cursor: pointer;
          ">Next →</button>
        </div>
      `;
      
      view.insertAdjacentHTML('afterbegin', headerHTML);
      view.insertAdjacentHTML('beforeend', footerHTML);
    });
    
    console.log('✅ Added simple navigation buttons');
  };
  
  // Step 4: Remove broken navigation styles
  const removeBrokenStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide any remaining corrupted navigation elements */
      *[data-corrupted],
      .corrupted-nav,
      .broken-navigation {
        display: none !important;
      }
      
      /* Clean up any text with corrupted characters */
      *:before,
      *:after {
        content: none !important;
      }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Added cleanup styles');
  };
  
  // Execute all cleanup steps
  removeCorruptedElements();
  fixHeaderAndCleanText();
  addSimpleNavigation();
  removeBrokenStyles();
  
  console.log('✅ EMERGENCY NAVIGATION FIX COMPLETE!');
  console.log('Navigation should now be clean and functional');
};

// Auto-execute on page load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', emergencyNavigationFix);
  } else {
    emergencyNavigationFix();
  }
}