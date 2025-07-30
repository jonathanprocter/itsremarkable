// Session Debug and Fix Script
// This script tests and fixes session persistence issues

console.log('🔧 Starting session debug and fix...');

async function testSessionPersistence() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('\n1. 🍪 Testing session cookie creation...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/status`, {
      credentials: 'include' // Include cookies in request
    });
    
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('✅ Session cookie created:', setCookieHeader);
    } else {
      console.log('⚠️ No session cookie in response');
    }
    
    const data = await response.json();
    console.log('✅ Auth status response:', data);
  } catch (error) {
    console.error('❌ Session cookie test failed:', error.message);
  }

  console.log('\n2. 🔐 Testing OAuth initiation with session tracking...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'include'
    });
    
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log('✅ OAuth sets session cookie:', cookies.includes('remarkable.sid'));
    } else {
      console.log('⚠️ OAuth does not set session cookie');
    }
    
    console.log('✅ OAuth redirect status:', response.status);
  } catch (error) {
    console.error('❌ OAuth session test failed:', error.message);
  }

  console.log('\n3. 🧪 Testing session validation helper...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/debug`, {
      credentials: 'include'
    });
    const debugData = await response.json();
    console.log('✅ Session debug info:', {
      authenticated: debugData.authenticated,
      hasValidTokens: debugData.hasValidTokens,
      sessionId: debugData.sessionId ? 'Present' : 'Missing',
      timestamp: debugData.timestamp
    });
  } catch (error) {
    console.error('❌ Session debug test failed:', error.message);
  }

  console.log('\n4. 🔄 Testing manual session creation...');
  try {
    // Try to create a test session
    const response = await fetch(`${baseUrl}/api/auth/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testUser: true }),
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test session creation:', result);
    } else {
      console.log('⚠️ Test session endpoint not available');
    }
  } catch (error) {
    console.log('⚠️ Test session creation not implemented');
  }

  console.log('\n📝 Session Debug Summary:');
  console.log('- Check if session cookies are being set properly');
  console.log('- Verify OAuth flow maintains session state');
  console.log('- Ensure session store is connected to PostgreSQL');
  console.log('- Confirm passport.session() is enabled');
  
  console.log('\n🎯 Recommended fixes:');
  console.log('1. Enable passport.session() middleware');
  console.log('2. Set saveUninitialized: false in session config');
  console.log('3. Use rolling: true to maintain active sessions');
  console.log('4. Ensure cookies are httpOnly: true for security');
  console.log('5. Verify session store connection');
}

// Run the test
testSessionPersistence().catch(console.error);