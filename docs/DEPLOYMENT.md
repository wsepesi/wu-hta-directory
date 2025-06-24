# Deployment Guide

This guide covers deploying the WU Head TA Directory to production using Vercel.

## Prerequisites

- Vercel account
- GitHub repository
- Production database (Vercel Postgres recommended)
- Resend account for emails
- Domain name (optional)

## Initial Setup

### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

### 2. Configure Environment Variables

In the Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add all required variables from `.env.example`
3. Set different values for Production, Preview, and Development

Critical production variables:
```
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
POSTGRES_URL=[your production database URL]
POSTGRES_URL_NON_POOLING=[direct connection URL]
RESEND_API_KEY=[your Resend API key]
```

### 3. Database Setup

#### Option A: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard → Storage
2. Create a new Postgres database
3. Copy connection strings to environment variables
4. Run initial setup:
   ```bash
   pnpm db:setup
   ```

#### Option B: External PostgreSQL
1. Ensure your database allows connections from Vercel IPs
2. Use connection pooling for better performance
3. Set appropriate connection limits

### 4. Configure Build Settings

In `vercel.json`:
- Build command: `pnpm build`
- Output directory: `.next`
- Install command: `pnpm install`

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup existing data (if updating)

### 2. Deploy to Preview

```bash
# Deploy to preview environment
pnpm deploy:preview

# Or use Git integration
git push origin feature/your-branch
```

Test thoroughly in preview environment.

### 3. Deploy to Production

```bash
# Deploy to production
pnpm deploy:vercel

# Or merge to main branch for auto-deploy
git push origin main
```

### 4. Post-deployment

1. Run database migrations:
   ```bash
   pnpm migrate:run
   ```

2. Verify deployment:
   ```bash
   curl https://your-domain.com/api/health
   ```

3. Test critical paths:
   - User login
   - Course search
   - Admin access

## Rollback Procedures

### Quick Rollback

In Vercel Dashboard:
1. Go to Deployments
2. Find previous stable deployment
3. Click "..." → "Promote to Production"

### Database Rollback

```bash
# Rollback last migration
pnpm migrate:rollback

# Restore from backup
pnpm db:restore backup-production-2024-01-01.json
```

## Performance Optimization

### 1. Enable Caching

Configure cache headers in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 2. Database Connection Pooling

Vercel automatically handles connection pooling with Vercel Postgres.
For external databases, use:
```javascript
DATABASE_MAX_CONNECTIONS=20
DATABASE_CONNECTION_TIMEOUT=30000
```

### 3. Edge Functions

Move appropriate routes to Edge Runtime:
```typescript
export const runtime = 'edge';
```

## Monitoring

### 1. Health Checks

Set up monitoring for:
```
https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production"
}
```

### 2. Error Tracking

Enable Sentry:
1. Add `SENTRY_DSN` to environment
2. Install SDK: `pnpm add @sentry/nextjs`
3. Initialize in application

### 3. Performance Monitoring

Monitor in Vercel Dashboard:
- Function execution time
- Error rate
- Traffic patterns

## Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Environment variables secure
- [ ] Database access restricted
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## Troubleshooting

### Build Failures

1. Check build logs in Vercel
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility

### Runtime Errors

1. Check function logs
2. Verify environment variables
3. Test database connectivity

### Performance Issues

1. Review function duration
2. Check database query performance
3. Enable caching where appropriate

## Maintenance

### Regular Tasks

- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit

### Updates

1. Test in development
2. Deploy to preview
3. Run automated tests
4. Deploy to production
5. Monitor for issues

## Emergency Contacts

- Vercel Support: support.vercel.com
- Database Admin: [contact]
- Development Team: [contact]

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Main_Page)