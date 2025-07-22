import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Force token restoration requested...');

    // Check if user is authenticated via session
    if (!req.session || !req.session.passport?.user) {
      console.log('❌ No authenticated session found');
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please log in with Google first' 
      });
    }

    const user = req.session.passport.user;
    const { accessToken, refreshToken } = user;
    
    if (!accessToken || !refreshToken) {
      console.log('❌ Session exists but tokens are missing');
      return res.status(400).json({ 
        error: 'Missing tokens',
        message: 'Session exists but OAuth tokens are missing. Please re-authenticate.',
        requiresReauth: true
      });
    }

    // Update process.env in current process
    process.env.GOOGLE_ACCESS_TOKEN = accessToken;
    process.env.GOOGLE_REFRESH_TOKEN = refreshToken;

    console.log('✅ Tokens successfully restored to environment');

    // Test the tokens by making a quick Google API call
    try {
      const testResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (testResponse.ok) {
        const userInfo = await testResponse.json();
        console.log('✅ Token validation successful:', userInfo.email);
        
        return res.status(200).json({
          success: true,
          message: 'Tokens restored and validated successfully',
          userEmail: userInfo.email,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('⚠️ Token validation failed, may need refresh');
        return res.status(200).json({
          success: true,
          message: 'Tokens restored but validation failed - may need refresh',
          warning: 'Tokens may be expired',
          timestamp: new Date().toISOString()
        });
      }
    } catch (testError) {
      console.log('⚠️ Token validation test failed:', testError);
      return res.status(200).json({
        success: true,
        message: 'Tokens restored but validation test failed',
        warning: 'Could not validate tokens',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Token restoration failed:', error);
    return res.status(500).json({
      error: 'Token restoration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}