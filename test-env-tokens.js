/**
 * Test script to apply environment tokens and verify OAuth functionality
 */

async function testEnvironmentTokens() {
  console.log('=== TESTING ENVIRONMENT TOKENS ===');
  
  try {
    // Step 1: Apply environment tokens
    console.log('1. Applying environment tokens...');
    const envTokenResponse = await fetch('/api/auth/force-env-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const envTokenResult = await envTokenResponse.json();
    console.log('Environment tokens response:', envTokenResult);
    
    if (envTokenResult.success) {
      console.log('✅ Environment tokens applied successfully');
      
      // Step 2: Wait a moment for session to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Check authentication status
      console.log('2. Checking authentication status...');
      const statusResponse = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      const statusResult = await statusResponse.json();
      console.log('Authentication status:', statusResult);
      
      if (statusResult.hasValidTokens) {
        console.log('✅ Authentication restored successfully');
        
        // Step 4: Test Google Calendar access
        console.log('3. Testing Google Calendar access...');
        const calendarResponse = await fetch('/api/calendar/events?start=2025-01-01T00:00:00Z&end=2025-12-31T23:59:59Z', {
          credentials: 'include'
        });
        
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          console.log('✅ Google Calendar access successful');
          console.log(`📅 Found ${calendarData.events?.length || 0} calendar events`);
          
          // Step 5: Test SimplePractice events
          console.log('4. Testing SimplePractice events...');
          const spResponse = await fetch('/api/simplepractice/events', {
            credentials: 'include'
          });
          
          if (spResponse.ok) {
            const spData = await spResponse.json();
            console.log('✅ SimplePractice events access successful');
            console.log(`📋 Found ${spData.events?.length || 0} SimplePractice events`);
            
            console.log('\n🎉 COMPLETE SUCCESS - All authentication restored!');
            console.log('📊 System Summary:');
            console.log(`- Authentication: ${statusResult.isAuthenticated ? 'Active' : 'Inactive'}`);
            console.log(`- Valid Tokens: ${statusResult.hasValidTokens ? 'Yes' : 'No'}`);
            console.log(`- Calendar Access: ${calendarResponse.ok ? 'Working' : 'Failed'}`);
            console.log(`- SimplePractice: ${spResponse.ok ? 'Working' : 'Failed'}`);
            
            // Reload the page to refresh the UI
            console.log('\n🔄 Reloading page to refresh UI...');
            window.location.reload();
            
          } else {
            console.log('⚠️ SimplePractice events access failed, but Google Calendar is working');
          }
        } else {
          console.log('❌ Google Calendar access failed:', calendarResponse.status);
        }
      } else {
        console.log('❌ Authentication tokens not valid after environment token application');
      }
    } else {
      console.log('❌ Environment tokens application failed:', envTokenResult.error);
    }
    
  } catch (error) {
    console.error('❌ Environment token test failed:', error);
  }
}

// Run the test
testEnvironmentTokens();