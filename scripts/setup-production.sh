#!/bin/bash

# Production Database Setup Script
# This script sets up the production database for Wu Head TAs Directory

set -e  # Exit on error

echo "🚀 Wu Head TAs Directory - Production Setup"
echo "=========================================="

# Check if environment variables are set
if [ -z "$POSTGRES_URL" ]; then
    echo "❌ Error: POSTGRES_URL environment variable is not set"
    echo "Please set your database connection string first"
    exit 1
fi

echo "📊 Setting up database schema..."

# Run migration
psql $POSTGRES_URL < scripts/migrate.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Failed to create database schema"
    exit 1
fi

echo ""
echo "🔍 Verifying tables..."

# Verify tables were created
psql $POSTGRES_URL -c "\dt" | grep -E "(users|courses|professors|course_offerings|ta_assignments|invitations|sessions)"

if [ $? -eq 0 ]; then
    echo "✅ All tables verified"
else
    echo "❌ Some tables are missing"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Create your first admin user:"
echo "   - Visit your deployed app URL"
echo "   - Use the database to manually insert an admin user"
echo "   - Or update the role of the first registered user"
echo ""
echo "2. Set up environment variables in Vercel:"
echo "   - Go to your Vercel project settings"
echo "   - Add all variables from .env.example"
echo ""
echo "3. Configure email domain:"
echo "   - Verify your domain in Resend"
echo "   - Update RESEND_FROM_EMAIL"
echo ""
echo "✅ Production database setup complete!"