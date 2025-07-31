// Test the Notion integration with the correct URL
console.log('🧪 Testing Notion Integration with Client Databases page...\n');

async function testNotionIntegration() {
  try {
    // Test basic Notion connection
    const response = await fetch('http://localhost:5000/api/notion/databases');
    const result = await response.json();
    
    if (result.connected) {
      console.log(`✅ Notion: Connected successfully with ${result.databases.length} databases found`);
      result.databases.forEach((db, index) => {
        const title = db.title?.[0]?.plain_text || 'Untitled Database';
        console.log(`   ${index + 1}. ${title} (ID: ${db.id.substring(0, 8)}...)`);
      });
    } else {
      console.log('❌ Notion: Connection failed');
      console.log('Error:', result.error);
    }
    
    // Test integration status
    console.log('\n📊 Testing Integration Status...');
    const statusResponse = await fetch('http://localhost:5000/api/integrations/status', {
      headers: {
        'Cookie': 'remarkable.sid=s%3AeIkj0QrP8B9OjW65-H6rpWXoFgfuoE-6.0AyoqnJB6wNm2ivjGMQiYRAo9F3fOhKJFBHkO6c1BO8'
      }
    });
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Integration Status:', status);
    } else {
      console.log('❌ Integration Status: Authentication required');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotionIntegration().catch(console.error);