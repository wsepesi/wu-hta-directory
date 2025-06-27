# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WU Head TAs** is a Washington University Computer Science Head Teaching Assistant Directory application. It manages and showcases Head TAs, tracks course assignments, and facilitates connections between students, TAs, and faculty. Built with Next.js 15, TypeScript, and PostgreSQL with comprehensive authentication and admin features.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Testing
- `pnpm test:all` - Run all tests (unit + integration)
- `pnpm test` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

### Database Management
- `pnpm db:setup` - Initialize database with schema
- `pnpm db:ensure-indexes` - Create/verify database indexes for performance
- `pnpm migrate:run` - Run pending migrations
- `pnpm migrate:rollback` - Rollback last migration
- `pnpm migrate:create` - Create new migration
- `pnpm migrate:status` - Check migration status
- `pnpm db:backup` - Backup database
- `pnpm db:restore` - Restore from backup

### Utilities
- `pnpm env:validate` - Validate environment variables
- `pnpm health:check` - Check application health

## Architecture & Tech Stack

### Frontend
- **Next.js 15** with App Router architecture
- **React 19** with TypeScript strict mode
- **Tailwind CSS v4** with PostCSS
- **Package Manager**: pnpm

### Backend & Database
- **PostgreSQL** via @vercel/postgres
- **Drizzle ORM** with comprehensive schema
- **NextAuth.js v4** with custom credentials provider
- **bcryptjs** for password hashing

### Testing & Quality
- **Jest** with React Testing Library for unit tests
- **Playwright** for end-to-end testing
- **ESLint** with Next.js configuration

## Database Schema & Entities

The application manages these core entities with UUID primary keys:
- **users** - Head TAs and admins with profiles and privacy settings
- **courses** - CS courses with offering patterns
- **professors** - Faculty members
- **courseOfferings** - Specific course instances per semester
- **taAssignments** - TA-to-course assignments
- **invitations** - Tree-based invitation system with referral tracking
- **sessions** - NextAuth session management
- **auditLogs** - Admin activity tracking

## Repository Pattern

Data access uses repository pattern in `/lib/repositories/`:
- **UserRepository** - User CRUD with relations and privacy
- **CourseRepository** - Course and offering management
- **InvitationRepository** - Invitation system with tree structure
- **TAAssignmentRepository** - TA assignment tracking
- **ProfessorRepository** - Faculty management

## Key Application Features

### Authentication & Security
- Role-based access control (admin vs head_ta)
- Comprehensive middleware with security headers, CORS, rate limiting
- Password reset tokens and secure session management
- Privacy controls with granular settings per user

### Admin Dashboard
- Enhanced user management with invitation trees
- Activity tracking and audit logs
- Analytics dashboard with user growth charts
- Bulk operations for TA assignments
- Report generation system

### Core Functionality
- Global search across TAs, courses, and professors
- Public directory with privacy controls
- Course prediction algorithms
- TA workload tracking and missing TA alerts
- Semester planning tools

## Directory Structure

```
/app                 # Next.js App Router pages
  /admin            # Admin dashboard and management
  /api              # REST API endpoints
  /auth             # Authentication pages
  /courses          # Course browsing and management
  /dashboard        # User dashboard
  /directory        # Public TA directory
  /profile          # User profile management

/components          # Reusable React components
  /admin            # Admin-specific components
  /auth             # Authentication forms
  /course           # Course management UI
  /search           # Global search functionality
  /ui               # Base UI components (virtualized lists, dialogs, etc.)

/lib                # Business logic and utilities
  /db               # Database schema and connection
  /repositories     # Data access layer
  /*                # Business logic modules (auth, courses, invitations, etc.)

/hooks              # Custom React hooks
/scripts            # Database and deployment scripts
/__tests__          # Comprehensive test suite
```

## TypeScript & Type Safety

- Comprehensive interfaces in `/lib/types.ts`
- Drizzle ORM provides end-to-end type safety
- Zod validation for input validation
- Path aliases: `@/*` maps to project root

## Performance Features

- Virtual lists for large datasets (`components/ui/VirtualList.tsx`)
- Lazy loading for images and components
- LRU caching layer
- Optimistic updates for better UX
- Database query optimization

## Development Patterns

- Use repository pattern for data access
- Follow existing component structure in `/components`
- Implement proper error boundaries and recovery
- Use toast notifications for user feedback
- Follow privacy-first design patterns
- Maintain comprehensive test coverage

## Testing Infrastructure

### Test Setup
- Tests require a PostgreSQL database running locally
- Create test database: `createdb test`
- Set `TEST_DATABASE_URL` or use default: `postgresql://test:test@localhost:5432/test`

### Test Organization
- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API endpoints, database operations, user flows
- Tests use transaction rollback for database isolation
- Test utilities in `/test/` directory provide factories and helpers

### Test Coverage Areas
- Data integrity and foreign key constraints
- Authorization and security boundaries  
- Concurrency and race conditions
- Business logic (workload calculations, predictions)
- API contracts and response validation
- End-to-end user flows