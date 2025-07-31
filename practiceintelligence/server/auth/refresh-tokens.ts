import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Token refresh requested...');

    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'No refresh token available',
        message: 'Please re-authenticate with Google' 
      });
    }

    // Refresh the access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens = await tokenResponse.json();
    
    // Update environment variables
    process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;
    
    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    const updateEnvVariable = (content: string, key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const line = `${key}=${value}`;
      
      if (regex.test(content)) {
        return content.replace(regex, line);
      } else {
        return content + (content.endsWith('\n') ? '' : '\n') + line + '\n';
      }
    };

    envContent = updateEnvVariable(envContent, 'GOOGLE_ACCESS_TOKEN', tokens.access_token);
    
    // Update refresh token if provided
    if (tokens.refresh_token) {
      envContent = updateEnvVariable(envContent, 'GOOGLE_REFRESH_TOKEN', tokens.refresh_token);
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
    }

    fs.writeFileSync(envPath, envContent);

    console.log('✅ Tokens refreshed successfully');

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      expiresIn: tokens.expires_in,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return res.status(500).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
}