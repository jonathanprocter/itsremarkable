import { google } from "googleapis";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

// Get the current domain dynamically
function getCurrentDomain(): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) {
    return `https://${domain}`;
  }
  
  // Fallback to current domain from environment
  return `https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev`;
}

// Configure OAuth2 client with proper redirect URI
export function createOAuth2Client() {
  const redirectUri = `${getCurrentDomain()}/api/auth/google/callback`;
  console.log(`🔗 OAuth redirect URI: ${redirectUri}`);
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID?.trim(),
    process.env.GOOGLE_CLIENT_SECRET?.trim(),
    redirectUri
  );
}

// Configure Google OAuth strategy
export function configureGoogleStrategy() {
  const callbackURL = `${getCurrentDomain()}/api/auth/google/callback`;
  
  console.log(`🔗 Configuring Google OAuth with callback: ${callbackURL}`);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID?.trim() || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
        callbackURL: callbackURL,
        scope: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'openid'
        ]
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log('✅ Google OAuth callback received');
        console.log('👤 User profile:', profile.emails?.[0]?.value);
        
        try {
          // Store user in database
          const userId = 1; // Using fixed user ID for now
          
          // Create user object with tokens
          const user = {
            id: userId,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || '',
            profilePicture: profile.photos?.[0]?.value || '',
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiry: new Date(Date.now() + 3600 * 1000) // 1 hour from now
          };
          
          // Update environment variables with fresh tokens
          process.env.GOOGLE_ACCESS_TOKEN = accessToken;
          if (refreshToken) {
            process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
          }
          
          console.log('✅ User authenticated and tokens stored');
          
          return done(null, user);
        } catch (error) {
          console.error('❌ OAuth callback error:', error);
          return done(error, null);
        }
      }
    )
  );
}

// Passport serialization
export function configurePassportSerialization() {
  passport.serializeUser((user: any, done) => {
    console.log('📦 Serializing user:', user.email);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Simple user lookup - only include safe properties for frontend
      const user = {
        id: id,
        email: 'jonathan.procter@gmail.com', // Fixed for now
        name: 'Jonathan Procter'
      };
      
      done(null, user);
    } catch (error) {
      console.error('❌ User deserialization failed:', error);
      done(error, null);
    }
  });
}

// Test OAuth configuration
export async function testOAuthConfiguration() {
  console.log('🔍 Testing OAuth configuration...');
  
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const currentDomain = getCurrentDomain();
  
  console.log('📊 OAuth Configuration Status:');
  console.log(`- Client ID: ${hasClientId ? '✅ Present' : '❌ Missing'}`);
  console.log(`- Client Secret: ${hasClientSecret ? '✅ Present' : '❌ Missing'}`);
  console.log(`- Current Domain: ${currentDomain}`);
  console.log(`- Redirect URI: ${currentDomain}/api/auth/google/callback`);
  
  if (!hasClientId || !hasClientSecret) {
    console.log('❌ OAuth configuration incomplete');
    return false;
  }
  
  console.log('✅ OAuth configuration complete');
  return true;
}