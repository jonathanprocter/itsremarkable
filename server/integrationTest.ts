import express from 'express';

const app = express();

// Test function to check all integrations
export async function testAllIntegrations() {
  console.log('🧪 Testing all integrations...\n');

  // Test Notion Integration
  console.log('📓 Testing Notion Integration...');
  try {
    const { getNotionDatabases } = await import('./notion');
    const databases = await getNotionDatabases();
    console.log(`✅ Notion: Connected successfully with ${databases.length} databases found`);
    databases.forEach((db: any, index: number) => {
      const title = db.title?.[0]?.plain_text || 'Untitled Database';
      console.log(`   ${index + 1}. ${title} (ID: ${db.id.substring(0, 8)}...)`);
    });
  } catch (error) {
    console.log(`❌ Notion: Failed - ${error.message}`);
  }

  // Test Google Drive Integration (simplified test)
  console.log('\n💾 Testing Google Drive Integration...');
  try {
    const hasGoogleCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    if (hasGoogleCredentials) {
      console.log('✅ Google Drive: OAuth credentials configured');
    } else {
      console.log('❌ Google Drive: Missing OAuth credentials');
    }
  } catch (error) {
    console.log(`❌ Google Drive: Failed - ${error.message}`);
  }

  // Test Database Connection
  console.log('\n🗄️ Testing Database Connection...');
  try {
    const { storage } = await import('./storage');
    const testUser = await storage.getUserById(4);
    if (testUser) {
      console.log(`✅ Database: Connected successfully - User ${testUser.email} found`);
      console.log(`   - Has Google Token: ${!!testUser.accessToken}`);
      console.log(`   - Has Refresh Token: ${!!testUser.refreshToken}`);
    } else {
      console.log('❌ Database: Test user not found');
    }
  } catch (error) {
    console.log(`❌ Database: Failed - ${error.message}`);
  }

  // Test Calendar Events API
  console.log('\n📅 Testing Calendar Events API...');
  try {
    const { storage } = await import('./storage');
    const events = await storage.getEventsByUserId(4);
    console.log(`✅ Calendar Events: ${events.length} events found in database`);
    
    // Show breakdown by source
    const sources = events.reduce((acc: any, event: any) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(sources).forEach(([source, count]) => {
      console.log(`   - ${source}: ${count} events`);
    });
  } catch (error) {
    console.log(`❌ Calendar Events: Failed - ${error.message}`);
  }

  console.log('\n✨ Integration test complete!\n');
}

// Export for use in other modules