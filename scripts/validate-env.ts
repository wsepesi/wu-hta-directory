#!/usr/bin/env node
import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Simple dotenv parser
function loadEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^['"]|['"]$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    log(`❌ Error reading environment file: ${error}`, 'red');
    process.exit(1);
  }
}

// Load environment variables
const envFile = process.argv[2] || '.env.local';
const envPath = path.resolve(process.cwd(), envFile);

if (!fs.existsSync(envPath)) {
  log(`❌ Environment file not found: ${envPath}`, 'red');
  process.exit(1);
}

log(`📋 Validating environment file: ${envPath}`, 'blue');
loadEnvFile(envPath);

// Define validation schema
const envSchema = z.object({
  // Required variables
  NEXTAUTH_URL: z.string().url('Must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'Must be at least 32 characters'),
  POSTGRES_URL: z.string().min(1, 'Database URL is required'),
  POSTGRES_URL_NON_POOLING: z.string().min(1, 'Non-pooling database URL is required'),
  
  // Optional but recommended
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  
  // Feature flags
  ENABLE_PUBLIC_DIRECTORY: z.string().transform(val => val === 'true').optional(),
  ENABLE_COURSE_PREDICTIONS: z.string().transform(val => val === 'true').optional(),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').optional(),
});

// Validate environment
try {
  const result = envSchema.parse(process.env);
  
  log('\n✅ Environment validation passed!', 'green');
  
  // Check for optional but recommended variables
  const warnings: string[] = [];
  
  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY is not set - email functionality will be disabled');
  }
  
  if (!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    warnings.push('SENTRY_DSN is not set - error tracking will be disabled');
  }
  
  if (warnings.length > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    warnings.forEach(warning => log(`   • ${warning}`, 'yellow'));
  }
  
  // Display summary
  log('\n📊 Environment Summary:', 'blue');
  log(`   • Environment: ${process.env.NODE_ENV || 'development'}`, 'gray');
  log(`   • NextAuth URL: ${process.env.NEXTAUTH_URL}`, 'gray');
  log(`   • Database: ${process.env.POSTGRES_DATABASE || 'Connected'}`, 'gray');
  log(`   • Email: ${process.env.RESEND_API_KEY ? 'Configured' : 'Not configured'}`, 'gray');
  
  // Check for common issues
  if (process.env.NEXTAUTH_URL?.includes('localhost') && process.env.NODE_ENV === 'production') {
    log('\n❌ Error: NEXTAUTH_URL contains localhost in production!', 'red');
    process.exit(1);
  }
  
  if (process.env.NEXTAUTH_SECRET === 'your-secret-key-here') {
    log('\n❌ Error: NEXTAUTH_SECRET has not been changed from default!', 'red');
    process.exit(1);
  }
  
} catch (error) {
  if (error instanceof z.ZodError) {
    log('\n❌ Environment validation failed:', 'red');
    error.errors.forEach(err => {
      log(`   • ${err.path.join('.')}: ${err.message}`, 'red');
    });
    
    log('\n💡 Tip: Check .env.example for required variables', 'yellow');
    process.exit(1);
  }
  
  throw error;
}

log('\n✨ Environment is properly configured!', 'green');