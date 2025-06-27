import { z } from 'zod';

// Define the environment schema
const envSchema = z.object({
  // Application Settings
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('WU Head TA Directory'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // NextAuth Configuration
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Database Configuration
  POSTGRES_URL: z.string().min(1, 'Database URL is required'),
  POSTGRES_URL_NON_POOLING: z.string().min(1, 'Non-pooling database URL is required'),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().positive().default(20),
  DATABASE_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(30000),
  
  // Email Configuration
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_REPLY_TO: z.string().email().optional(),
  
  // Security Settings
  SESSION_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),
  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(60),
  INVITATION_EXPIRY_DAYS: z.coerce.number().int().positive().default(7),
  MAX_INVITATIONS_PER_USER: z.coerce.number().int().positive().default(5),
  MIN_PASSWORD_LENGTH: z.coerce.number().int().min(8).default(8),
  REQUIRE_PASSWORD_COMPLEXITY: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  
  // Feature Flags
  ENABLE_PUBLIC_DIRECTORY: z.coerce.boolean().default(true),
  ENABLE_COURSE_PREDICTIONS: z.coerce.boolean().default(true),
  ENABLE_EMAIL_NOTIFICATIONS: z.coerce.boolean().default(true),
  ENABLE_ADMIN_REPORTS: z.coerce.boolean().default(true),
  ENABLE_USER_UPLOADS: z.coerce.boolean().default(true),
  
  // File Upload Settings
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(5242880),
  ALLOWED_IMAGE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  UPLOAD_DIR: z.string().default('./public/uploads'),
  
  // External APIs
  UNIVERSITY_API_URL: z.string().url().optional(),
  UNIVERSITY_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  
  // Development Settings
  DEBUG: z.coerce.boolean().default(false),
  LOG_SQL_QUERIES: z.coerce.boolean().default(false),
  MOCK_EMAIL_SENDING: z.coerce.boolean().default(true),
  DISABLE_RATE_LIMITING: z.coerce.boolean().default(true),
  
  // Cache Configuration
  REDIS_URL: z.string().optional(),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  CACHE_MAX_SIZE: z.coerce.number().int().positive().default(100),
  
  // CORS Settings
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  CORS_ALLOW_CREDENTIALS: z.coerce.boolean().default(true),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      
      // In development, continue with defaults instead of crashing
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Using fallback values for development');
        return envSchema.parse({
          ...process.env,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-key-min-32-chars-long-for-security-purposes',
          POSTGRES_URL: process.env.POSTGRES_URL || 'postgresql://localhost:5432/wu-head-tas',
          POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING || 'postgresql://localhost:5432/wu-head-tas',
        });
      }
      
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Re-export as env-validation for better naming
export { env as envValidation };

// Environment-specific configurations
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isStaging: env.NODE_ENV === 'staging',
  isProduction: env.NODE_ENV === 'production',
  
  // Feature flags as booleans
  features: {
    publicDirectory: env.ENABLE_PUBLIC_DIRECTORY,
    coursePredictions: env.ENABLE_COURSE_PREDICTIONS,
    emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
    adminReports: env.ENABLE_ADMIN_REPORTS,
    userUploads: env.ENABLE_USER_UPLOADS,
  },
  
  // Security settings
  security: {
    sessionExpiryDays: env.SESSION_EXPIRY_DAYS,
    sessionIdleTimeoutMinutes: env.SESSION_IDLE_TIMEOUT_MINUTES,
    invitationExpiryDays: env.INVITATION_EXPIRY_DAYS,
    maxInvitationsPerUser: env.MAX_INVITATIONS_PER_USER,
    minPasswordLength: env.MIN_PASSWORD_LENGTH,
    requirePasswordComplexity: env.REQUIRE_PASSWORD_COMPLEXITY,
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    enabled: !env.DISABLE_RATE_LIMITING,
  },
  
  // Email settings
  email: {
    apiKey: env.RESEND_API_KEY || '',
    fromEmail: env.RESEND_FROM_EMAIL || 'noreply@example.com',
    replyTo: env.RESEND_REPLY_TO || 'support@example.com',
    mock: env.MOCK_EMAIL_SENDING,
  },
  
  // Database settings
  database: {
    url: env.POSTGRES_URL,
    directUrl: env.POSTGRES_URL_NON_POOLING,
    maxConnections: env.DATABASE_MAX_CONNECTIONS,
    connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
  },
  
  // File upload settings
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedImageTypes: env.ALLOWED_IMAGE_TYPES.split(','),
    uploadDir: env.UPLOAD_DIR,
  },
  
  // CORS settings
  cors: {
    allowedOrigins: env.CORS_ALLOWED_ORIGINS.split(','),
    allowCredentials: env.CORS_ALLOW_CREDENTIALS,
  },
  
  // Cache settings
  cache: {
    redisUrl: env.REDIS_URL,
    ttlSeconds: env.CACHE_TTL_SECONDS,
    maxSize: env.CACHE_MAX_SIZE,
  },
};

// Type exports
export type Env = z.infer<typeof envSchema>;
export type Config = typeof config;