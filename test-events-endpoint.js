// Test the events endpoint specifically
console.log('🧪 Testing Events Endpoint...\n');

async function testEventsEndpoint() {
  try {
    console.log('📅 Step 1: Testing events endpoint without authentication...');
    let response = await fetch('http://localhost:5000/api/events');
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint requires authentication (as expected)');
      
      console.log('\n🔧 Step 2: Force fixing authentication...');
      const forceFixResponse = await fetch('http://localhost:5000/api/auth/force-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const forceFixResult = await forceFixResponse.json();
      console.log('Force fix result:', forceFixResult);
      
      // Extract session cookie from response
      const cookies = forceFixResponse.headers.get('set-cookie');
      console.log('Set cookies:', cookies);
      
      if (cookies) {
        // Try with the new session
        console.log('\n📅 Step 3: Testing events endpoint with new session...');
        
        response = await fetch('http://localhost:5000/api/events', {
          headers: { 'Cookie': cookies }
        });
        
        console.log(`New response status: ${response.status}`);
        
        if (response.ok) {
          const events = await response.json();
          console.log(`✅ Successfully retrieved ${events.length} events!`);
          
          if (events.length > 0) {
            console.log('\n📋 Sample events:');
            events.slice(0, 5).forEach((event, index) => {
              console.log(`   ${index + 1}. ${event.title} (${event.source}) - ${new Date(event.startTime).toLocaleDateString()}`);
            });
            
            // Show breakdown by source
            const sources = events.reduce((acc, event) => {
              acc[event.source] = (acc[event.source] || 0) + 1;
              return acc;
            }, {});
            
            console.log('\n📊 Events by source:');
            Object.entries(sources).forEach(([source, count]) => {
              console.log(`   - ${source}: ${count} events`);
            });
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Still failed:', errorText);
        }
      }
    } else if (response.ok) {
      const events = await response.json();
      console.log(`✅ Events endpoint working! Found ${events.length} events`);
    } else {
      const errorText = await response.text();
      console.log(`❌ Unexpected response: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEventsEndpoint().catch(console.error);