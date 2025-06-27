# Remove Custom Performance Monitoring Plan

## Overview
This plan outlines the steps to remove all custom performance monitoring code from the codebase, keeping only the default Next.js and Vercel monitoring capabilities.

## Files to Delete

The following files should be completely removed:

1. `lib/monitoring.ts` - Custom monitoring service with Sentry preparation
2. `lib/performance-monitoring.ts` - Web Vitals and performance utilities
3. `components/dashboard/PerformanceMonitor.tsx` - Performance monitoring component
4. `components/dashboard/PerformanceDebugger.tsx` - Performance debugging UI
5. `components/dashboard/StreamingPerformanceMarks.tsx` - Streaming performance marks
6. `app/api/analytics/vitals/route.ts` - Analytics endpoint for Web Vitals

## Code Modifications

### 1. Update `app/dashboard/page.tsx`
- Remove imports:
  ```typescript
  // Remove these lines
  import { PerformanceMonitor } from "@/components/dashboard/PerformanceMonitor";
  import { PerformanceDebugger } from "@/components/dashboard/PerformanceDebugger";
  ```
- Remove any JSX usage of `<PerformanceMonitor />` and `<PerformanceDebugger />` components

### 2. Update `components/dashboard/EnhancedDashboardStats.tsx`
- Remove import:
  ```typescript
  // Remove this line
  import { StreamingPerformanceMarks } from './StreamingPerformanceMarks';
  ```
- Remove any JSX usage of `<StreamingPerformanceMarks />` component

### 3. Update `app/api/cron/cleanup-expired-invitations/route.ts`
- Remove import:
  ```typescript
  // Remove this line
  import { monitoring, ErrorSeverity } from '@/lib/monitoring';
  ```
- Remove monitoring calls:
  - `const transactionId = monitoring.startTransaction('cron.cleanup-invitations');`
  - All `monitoring.finishTransaction()` calls
  - All `monitoring.captureMessage()` calls
  - All `monitoring.captureException()` calls

### 4. Update `app/api/cron/backup-database/route.ts`
- Remove import:
  ```typescript
  // Remove this line
  import { monitoring, ErrorSeverity } from '@/lib/monitoring';
  ```
- Remove monitoring calls:
  - `const transactionId = monitoring.startTransaction('cron.backup-database');`
  - All `monitoring.finishTransaction()` calls
  - All `monitoring.captureMessage()` calls
  - All `monitoring.captureException()` calls

### 5. Update `lib/env.ts`
- Remove the Analytics & Monitoring section (lines 51-55):
  ```typescript
  // Remove this entire section
  // Analytics & Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  LOGROCKET_PROJECT_ID: z.string().optional(),
  ```

### 6. Update `package.json`
- Remove the `web-vitals` dependency:
  ```json
  // Remove this line
  "web-vitals": "^4.2.4",
  ```

## Post-Removal Steps

1. Run `pnpm install` to update dependencies after removing `web-vitals`
2. Run `pnpm lint` to catch any remaining references
3. Run `pnpm test:all` to ensure no tests break
4. Search for any remaining references to the deleted files/imports
5. Update CLAUDE.md to remove references to "monitoring-usage" and OTel

## Verification Checklist

- [ ] All monitoring-related files deleted
- [ ] All monitoring imports removed
- [ ] All monitoring function calls removed
- [ ] Environment variables cleaned up
- [ ] Dependencies updated
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] Application runs without errors

## Notes

- The `lib/error-logger.ts` file contains basic error logging to console and can be kept as it doesn't implement actual monitoring
- This removal keeps all default Next.js and Vercel monitoring intact
- The monitoring code was prepared for Sentry integration but wasn't actively using it
- Most monitoring focused on Web Vitals collection and streaming performance marks