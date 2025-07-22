/**
 * Immediate test to run in browser console
 * Copy and paste this entire block into your browser console
 */

(async function testDeleteFunctionality() {
  console.log('🧪 Testing delete functionality...');
  
  try {
    // First, check auth status
    const authResponse = await fetch('/api/auth/status', { credentials: 'include' });
    const authData = await authResponse.json();
    console.log('Auth status:', authData);
    
    if (!authData.authenticated) {
      console.log('❌ Not authenticated - please log in first');
      return;
    }
    
    // Test deleting Sarah Palladino's appointment
    const eventId = 't55klaku1emr7rg1ojp3oenjq8';
    console.log(`🗑️ Attempting to delete event: ${eventId}`);
    
    const deleteResponse = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Delete response status:', deleteResponse.status);
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Delete successful:', result);
    } else {
      const error = await deleteResponse.json();
      console.log('❌ Delete failed:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
})();