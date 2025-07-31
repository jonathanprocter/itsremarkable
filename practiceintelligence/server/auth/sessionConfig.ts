/**
 * Development Environment Session Configuration
 * Provides safe development settings while maintaining security
 */

export interface SessionConfig {
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  rolling: boolean;
  saveUninitialized: boolean;
}

export class SessionConfigManager {
  /**
   * Get session configuration based on environment
   */
  static getSessionConfig(): SessionConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      return {
        secure: true, // HTTPS required in production
        httpOnly: true, // Secure cookie - prevents XSS
        sameSite: 'strict', // Strict CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        rolling: true,
        saveUninitialized: false
      };
    } else {
      // Development configuration - more permissive for debugging
      return {
        secure: false, // HTTP allowed in development
        httpOnly: true, // Still secure against XSS
        sameSite: 'lax', // More permissive for development
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        rolling: true,
        saveUninitialized: false // Only save when data exists
      };
    }
  }

  /**
   * Get cookie clearing options for logout
   */
  static getCookieClearOptions() {
    const config = this.getSessionConfig();
    return {
      path: '/',
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite
    };
  }

  /**
   * Validate session configuration
   */
  static validateConfig(): { isValid: boolean; warnings: string[] } {
    const config = this.getSessionConfig();
    const warnings: string[] = [];
    
    // Check for security issues
    if (process.env.NODE_ENV === 'production' && !config.secure) {
      warnings.push('Production environment should use secure cookies');
    }
    
    if (!config.httpOnly) {
      warnings.push('HttpOnly should be enabled to prevent XSS attacks');
    }
    
    if (config.saveUninitialized) {
      warnings.push('saveUninitialized: true creates unnecessary sessions');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}