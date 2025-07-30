// Test Google Drive integration functionality
console.log('🧪 Testing Google Drive Integration...\n');

async function testGoogleDriveIntegration() {
  try {
    console.log('🔧 Setting up authenticated session...');
    
    // Force fix authentication first
    const forceFixResponse = await fetch('http://localhost:5000/api/auth/force-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const forceFixResult = await forceFixResponse.json();
    console.log(`✅ Authentication: ${forceFixResult.message}`);
    
    // Get session cookie
    const cookies = forceFixResponse.headers.get('set-cookie');
    const sessionCookie = cookies;
    
    console.log('\n☁️  Testing Google Drive access...');
    const driveResponse = await fetch('http://localhost:5000/api/google-drive/status', {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (driveResponse.ok) {
      const driveResult = await driveResponse.json();
      console.log('✅ Google Drive status check result:');
      console.log(`   Connected: ${driveResult.connected}`);
      if (driveResult.folders) {
        console.log(`   Folders found: ${driveResult.folders.length}`);
      }
    } else {
      const errorText = await driveResponse.text();
      console.log(`❌ Google Drive status failed: ${errorText}`);
    }
    
    console.log('\n📁 Testing Drive folder creation...');
    const folderResponse = await fetch('http://localhost:5000/api/google-drive/create-folder', {
      method: 'POST',
      headers: { 
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderName: 'reMarkable Calendar Test' })
    });
    
    if (folderResponse.ok) {
      const folderResult = await folderResponse.json();
      console.log('✅ Folder creation test completed');
      console.log(`   Folder ID: ${folderResult.folderId || 'N/A'}`);
    } else {
      const errorText = await folderResponse.text();
      console.log(`❌ Folder creation failed: ${errorText}`);
    }
    
    console.log('\n📤 Testing file upload to Drive...');
    const uploadResponse = await fetch('http://localhost:5000/api/google-drive/upload', {
      method: 'POST',
      headers: { 
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        fileName: 'test-calendar-export.txt',
        content: 'This is a test file from the calendar integration system.',
        mimeType: 'text/plain'
      })
    });
    
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ File upload test completed');
      console.log(`   File ID: ${uploadResult.fileId || 'N/A'}`);
    } else {
      const errorText = await uploadResponse.text();
      console.log(`❌ File upload failed: ${errorText}`);
    }
    
    console.log('\n🎉 GOOGLE DRIVE INTEGRATION TEST COMPLETE!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGoogleDriveIntegration().catch(console.error);