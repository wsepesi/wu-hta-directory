// Environment variable validation
// Ensures all required environment variables are set

const requiredEnvVars = [
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NO_SSL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_USER',
  'POSTGRES_HOST',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
] as const;

const optionalEnvVars = [
  'INVITATION_EXPIRY_DAYS',
  'SESSION_EXPIRY_DAYS',
  'MAX_TA_HOURS_PER_WEEK',
  'RATE_LIMIT_LOGIN_ATTEMPTS',
  'RATE_LIMIT_WINDOW_MINUTES',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'VERCEL_ANALYTICS_ID',
  'NODE_ENV',
  'VERCEL_ENV',
] as const;

type RequiredEnvVars = typeof requiredEnvVars[number];
type OptionalEnvVars = typeof optionalEnvVars[number];

// Extend process.env types
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<RequiredEnvVars, string>, Partial<Record<OptionalEnvVars, string>> {}
  }
}

export function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate specific formats
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_')) {
    console.warn('Warning: RESEND_API_KEY should start with "re_"');
  }

  if (process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes('@')) {
    throw new Error('RESEND_FROM_EMAIL must be a valid email address');
  }

  // Parse numeric environment variables with defaults
  const config = {
    invitationExpiryDays: parseInt(process.env.INVITATION_EXPIRY_DAYS || '7'),
    sessionExpiryDays: parseInt(process.env.SESSION_EXPIRY_DAYS || '30'),
    maxTaHoursPerWeek: parseInt(process.env.MAX_TA_HOURS_PER_WEEK || '20'),
    rateLimitLoginAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS || '5'),
    rateLimitWindowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15'),
  };

  return config;
}

// Run validation on module load in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnv();
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
  }
}

export const envConfig = {
  database: {
    url: process.env.POSTGRES_URL!,
    prismaUrl: process.env.POSTGRES_PRISMA_URL!,
    urlNoSsl: process.env.POSTGRES_URL_NO_SSL!,
    urlNonPooling: process.env.POSTGRES_URL_NON_POOLING!,
  },
  auth: {
    url: process.env.NEXTAUTH_URL!,
    secret: process.env.NEXTAUTH_SECRET!,
  },
  email: {
    apiKey: process.env.RESEND_API_KEY!,
    fromEmail: process.env.RESEND_FROM_EMAIL!,
  },
  app: {
    invitationExpiryDays: parseInt(process.env.INVITATION_EXPIRY_DAYS || '7'),
    sessionExpiryDays: parseInt(process.env.SESSION_EXPIRY_DAYS || '30'),
    maxTaHoursPerWeek: parseInt(process.env.MAX_TA_HOURS_PER_WEEK || '20'),
    rateLimitLoginAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS || '5'),
    rateLimitWindowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15'),
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN,
    vercelAnalyticsId: process.env.VERCEL_ANALYTICS_ID,
  },
  env: {
    nodeEnv: process.env.NODE_ENV || 'development',
    vercelEnv: process.env.VERCEL_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
};