// Test comprehensive calendar sync functionality
console.log('🧪 Testing Complete Calendar Sync Integration...\n');

async function testCalendarSync() {
  try {
    // Get session cookie from authenticated session (using working session)
    const sessionCookie = 'remarkable.sid=s%3Ae_SXv1Dyibf2Us1YaawUjieYEfPyt3eD.2RNdbX6cKGGpdfjqjs6xrldE896Pyvs%2FIZaU1DY1JRU';
    
    console.log('📅 Step 1: Testing current calendar events...');
    const eventsResponse = await fetch('http://localhost:5000/api/events', {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      console.log(`✅ Found ${events.length} calendar events in database`);
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title} (${event.source}) - ${new Date(event.startTime).toLocaleDateString()}`);
      });
    } else {
      console.log('❌ Failed to get calendar events');
      return;
    }
    
    console.log('\n📤 Step 2: Testing sync TO Notion...');
    const syncToNotionResponse = await fetch('http://localhost:5000/api/notion/sync', {
      method: 'POST',
      headers: { 
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });
    
    if (syncToNotionResponse.ok) {
      const syncResult = await syncToNotionResponse.json();
      console.log('✅ Sync to Notion completed:');
      console.log(`   - Events synced: ${syncResult.syncedCount}`);
      console.log(`   - Errors: ${syncResult.errorCount}`);
      console.log(`   - Database ID: ${syncResult.databaseId ? syncResult.databaseId.substring(0, 8) + '...' : 'N/A'}`);
    } else {
      const error = await syncToNotionResponse.json();
      console.log('❌ Sync to Notion failed:', error.error);
    }
    
    console.log('\n📥 Step 3: Testing sync FROM Notion...');
    const syncFromNotionResponse = await fetch('http://localhost:5000/api/sync/notion-bidirectional', {
      method: 'POST',
      headers: { 
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });
    
    if (syncFromNotionResponse.ok) {
      const syncResult = await syncFromNotionResponse.json();
      console.log('✅ Sync from Notion completed:');
      console.log(`   - Events synced from Notion: ${syncResult.syncedFromNotion}`);
      console.log(`   - Total Notion events: ${syncResult.totalNotionEvents}`);
    } else {
      const error = await syncFromNotionResponse.json();
      console.log('❌ Sync from Notion failed:', error.error);
    }
    
    console.log('\n🔄 Step 4: Testing complete sync...');
    const completeSyncResponse = await fetch('http://localhost:5000/api/sync/complete', {
      method: 'POST',
      headers: { 
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });
    
    if (completeSyncResponse.ok) {
      const syncResult = await completeSyncResponse.json();
      console.log('✅ Complete sync finished');
      console.log('   Result:', syncResult);
    } else {
      const error = await completeSyncResponse.json();
      console.log('❌ Complete sync failed:', error.error);
    }
    
    console.log('\n📊 Step 5: Final status check...');
    // Check final event count
    const finalEventsResponse = await fetch('http://localhost:5000/api/events', {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (finalEventsResponse.ok) {
      const finalEvents = await finalEventsResponse.json();
      console.log(`📈 Final event count: ${finalEvents.length}`);
      
      // Show breakdown by source
      const sources = finalEvents.reduce((acc, event) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📋 Events by source:');
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   - ${source}: ${count} events`);
      });
    }
    
    console.log('\n✨ Calendar sync test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCalendarSync().catch(console.error);