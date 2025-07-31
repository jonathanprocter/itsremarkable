/**
 * Test script to verify frontend is loading properly
 */

function testFrontendLoading() {
  console.log('🧪 Testing frontend loading...');
  
  // Check if React is loaded
  console.log('React loaded:', typeof React !== 'undefined');
  
  // Check if main components exist
  console.log('DOM root exists:', !!document.getElementById('root'));
  
  // Check if router is working
  console.log('Current path:', window.location.pathname);
  
  // Check if we can see the planner
  console.log('Planner visible:', !!document.querySelector('[data-testid="planner"]') || !!document.querySelector('main') || !!document.querySelector('.planner'));
  
  // Check for any error messages
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log('Error elements found:', errorElements.length);
  
  // Check if 404 page is showing
  const notFoundElements = document.querySelectorAll('*:contains("404"), *:contains("Not Found")');
  console.log('404 elements found:', notFoundElements.length);
  
  // Check if planner content is present
  const plannerContent = document.querySelector('body');
  console.log('Body content length:', plannerContent ? plannerContent.textContent.length : 0);
  
  // Check for loading states
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
  console.log('Loading elements found:', loadingElements.length);
  
  // Check if authentication component exists
  const authComponents = document.querySelectorAll('[class*="auth"], [class*="Auth"]');
  console.log('Auth components found:', authComponents.length);
  
  // Final assessment
  if (document.getElementById('root') && document.querySelector('body').textContent.length > 100) {
    console.log('✅ Frontend appears to be loading correctly');
  } else {
    console.log('❌ Frontend may not be loading properly');
  }
}

// Run the test
testFrontendLoading();

// Also make it available globally
window.testFrontendLoading = testFrontendLoading;