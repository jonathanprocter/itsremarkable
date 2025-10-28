import { z } from 'zod';

/**
 * Environment variable schema with validation
 * All required variables must be present at startup
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server configuration
  PORT: z.coerce.number().default(5000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Session security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  // Optional: Replit-specific variables
  REPLIT_DOMAINS: z.string().optional(),
  REPLIT_URL: z.string().optional(),
  REPL_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup
 * Throws detailed error if validation fails
 */
export function validateEnvironment(): Env {
  try {
    const validated = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });

      // Provide helpful error message
      console.error('\nRequired environment variables:');
      console.error('  - DATABASE_URL: PostgreSQL connection string');
      console.error('  - SESSION_SECRET: Secret for session encryption (min 32 chars)');
      console.error('  - GOOGLE_CLIENT_ID: Google OAuth client ID');
      console.error('  - GOOGLE_CLIENT_SECRET: Google OAuth client secret');
      console.error('\nPlease set these in your .env file or environment');

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated and type-safe environment configuration
 * Use this instead of process.env directly
 */
export const env = validateEnvironment();
