# Deployment Guide

This guide walks you through deploying the Wu Head TAs Directory to Vercel with a PostgreSQL database.

## Prerequisites

- GitHub account
- Vercel account
- Domain name (optional, for custom domain)

## Step 1: Prepare Your Repository

1. **Fork or clone this repository**
2. **Remove sensitive files**:
   ```bash
   rm -rf .env.local
   rm -rf .env
   ```
3. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

## Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `pnpm build` (auto-detected)
   - Install Command: `pnpm install` (auto-detected)

## Step 3: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. In your Vercel project dashboard, go to "Storage"
2. Click "Create Database" → "Postgres"
3. Choose a region close to your users
4. Copy all connection strings provided

### Option B: External PostgreSQL

Use any PostgreSQL provider (Supabase, Neon, Railway, etc.) and get your connection strings.

## Step 4: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

### Required Variables

```bash
# Database (copy all from Vercel Postgres)
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NO_SSL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Authentication
NEXTAUTH_URL="https://your-domain.vercel.app"  # Your deployment URL
NEXTAUTH_SECRET="..."  # Generate with: openssl rand -base64 32

# Email (Resend)
RESEND_API_KEY="re_..."  # From resend.com
RESEND_FROM_EMAIL="noreply@yourdomain.com"  # Verified domain in Resend
```

### Optional Variables

```bash
# App Settings (defaults shown)
INVITATION_EXPIRY_DAYS="7"
SESSION_EXPIRY_DAYS="30"
MAX_TA_HOURS_PER_WEEK="20"
RATE_LIMIT_LOGIN_ATTEMPTS="5"
RATE_LIMIT_WINDOW_MINUTES="15"
```

## Step 5: Set Up Database Schema

1. **Connect to your database**:
   - For Vercel Postgres: Use the query editor in Vercel dashboard
   - For external DB: Use your provider's interface or psql

2. **Run the migration script**:
   - Copy contents of `scripts/migrate.sql`
   - Execute in your database

3. **Create admin user**:
   - Generate a bcrypt hash for your password:
     ```bash
     # Using Node.js
     node -e "console.log(require('bcryptjs').hashSync('YourPassword123!', 10))"
     ```
   - Update `scripts/create-admin.sql` with your details
   - Run the SQL script

## Step 6: Configure Email (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Get your API key
4. Update `RESEND_FROM_EMAIL` with your verified email

## Step 7: Deploy

1. In Vercel, click "Deploy"
2. Wait for the build to complete
3. Visit your deployment URL

## Step 8: Post-Deployment

1. **Test the deployment**:
   - Visit `/api/health` to check system status
   - Try logging in with your admin account
   - Send a test invitation

2. **Set up monitoring**:
   - Enable Vercel Analytics (optional)
   - Set up uptime monitoring for `/api/health`
   - Configure error tracking (Sentry) if desired

3. **Configure custom domain** (optional):
   - In Vercel project settings → Domains
   - Add your custom domain
   - Update DNS records as instructed
   - Update `NEXTAUTH_URL` to your custom domain

## Troubleshooting

### Database Connection Issues
- Ensure all `POSTGRES_*` variables are correctly set
- Check if Vercel's IP needs to be whitelisted (for external DBs)
- Verify SSL settings match your database requirements

### Authentication Issues
- `NEXTAUTH_URL` must match your deployment URL exactly
- `NEXTAUTH_SECRET` must be at least 32 characters
- Clear browser cookies and try again

### Email Issues
- Verify domain in Resend dashboard
- Check API key starts with `re_`
- Review email logs in Resend

### Build Failures
- Check build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

## Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Database credentials are secure
- [ ] Email domain is verified
- [ ] Admin password is strong
- [ ] Environment variables are not in code
- [ ] Production URL in `NEXTAUTH_URL`

## Maintenance

### Database Backups
- Vercel Postgres: Automatic daily backups
- External DB: Follow your provider's backup strategy

### Updates
1. Test updates locally first
2. Deploy to a preview branch
3. Test on preview URL
4. Merge to main for production

### Monitoring
- Check `/api/health` endpoint regularly
- Monitor Vercel Functions logs
- Review Resend email logs
- Track user growth in admin dashboard

## Support

For issues specific to:
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Database**: Your database provider's documentation
- **Resend**: [resend.com/docs](https://resend.com/docs)
- **This app**: Create an issue on GitHub