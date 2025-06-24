# Wu Head TAs Directory

A comprehensive directory system for managing Head Teaching Assistants, course assignments, and professor relationships at Washington University.

## 🚀 Features

- **Invitation-based Registration**: Secure system where existing members invite new head TAs
- **Course Management**: Track courses, professors, and TA assignments by semester
- **Missing TA Detection**: Automatically identify courses that need TAs
- **Admin Dashboard**: Comprehensive analytics and user management
- **Public Directory**: Searchable public-facing directory of head TAs
- **Role-based Access**: Admin and head TA roles with appropriate permissions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL (via Vercel Postgres), Drizzle ORM
- **Email**: Resend
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Vercel Postgres recommended)
- Resend account for email
- Vercel account for deployment

## 🏃 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wu-head-tas.git
   cd wu-head-tas
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your actual values.

4. **Set up the database**
   ```bash
   # Run migrations
   psql $POSTGRES_URL < scripts/migrate.sql
   
   # Seed with sample data (optional)
   psql $POSTGRES_URL < scripts/seed.sql
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Using Vercel Postgres

1. Create a new Postgres database in your Vercel project
2. Copy all the connection strings to your `.env.local`
3. Run the migration script

### Manual PostgreSQL Setup

1. Create a new PostgreSQL database
2. Update the `POSTGRES_*` variables in `.env.local`
3. Run `scripts/migrate.sql` to create tables
4. Optionally run `scripts/seed.sql` for sample data

## 🔐 Authentication Setup

1. Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to `.env.local`:
   ```
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

## 📧 Email Setup

1. Sign up for [Resend](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

### Environment Variables in Vercel

Add all variables from `.env.example` to your Vercel project settings.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Register with invitation token
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session

### User Endpoints
- `GET /api/users` - List users (with filters)
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (admin only)

### Course Endpoints
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/[id]` - Update course (admin only)
- `DELETE /api/courses/[id]` - Delete course (admin only)

### TA Assignment Endpoints
- `GET /api/ta-assignments` - List assignments
- `POST /api/ta-assignments` - Create assignment
- `PUT /api/ta-assignments/[id]` - Update assignment
- `DELETE /api/ta-assignments/[id]` - Delete assignment

## 🔧 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Check TypeScript

## 🏗️ Project Structure

```
wu-head-tas/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin pages
│   └── ...                # Other pages
├── components/            # React components
│   ├── ui/                # UI components
│   ├── auth/              # Auth components
│   └── ...                # Feature components
├── lib/                   # Utilities and logic
│   ├── db/                # Database schema
│   ├── repositories/      # Data access layer
│   └── ...                # Business logic
├── hooks/                 # React hooks
├── scripts/               # Database scripts
└── public/                # Static assets
```

## 🛡️ Security

- All routes are protected by authentication (except public directory)
- Role-based access control for admin features
- Password requirements enforced
- Rate limiting on authentication endpoints
- SQL injection prevention via parameterized queries
- XSS protection through React's built-in escaping

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure all `POSTGRES_*` variables are set correctly
- Check if database is accessible from your network
- Verify SSL settings match your database configuration

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL
- Clear cookies and try again

### Email Not Sending
- Verify Resend API key is correct
- Check sender email is verified in Resend
- Review email logs in Resend dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details