# Authentication & Invitation System

## Authentication Strategy

### Primary Approach: NextAuth.js with Vercel
- **Library**: NextAuth.js v5 (Auth.js)
- **Provider**: Email/Password with database sessions
- **Database**: Vercel Postgres for user storage
- **Session Management**: JWT tokens with database persistence
- **Security**: Built-in CSRF protection, secure cookie handling

### Alternative: Supabase Auth
- **Provider**: Supabase Auth (if using Supabase for database)
- **Benefits**: Integrated with database, built-in email verification
- **Features**: Row Level Security (RLS), real-time subscriptions

## User Registration Flow

### 1. Invitation Process
```typescript
// Invitation creation by existing Head TA
interface CreateInvitationRequest {
  email: string;
  message?: string;
  suggestedRole?: 'head_ta' | 'ta';
}

// Email template with secure token
const invitationEmail = {
  subject: "Invitation to Join CS Department Head TA Directory",
  template: `
    You've been invited to join the CS Department Head TA Directory.
    
    Click here to create your account:
    ${process.env.NEXT_PUBLIC_APP_URL}/auth/register?token=${token}
    
    This invitation expires in 7 days.
  `
};
```

### 2. Registration Process
```typescript
// Registration form fields
interface RegistrationForm {
  // From invitation
  email: string; // pre-filled, read-only
  
  // Required fields
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  
  // Optional profile fields
  gradYear?: number;
  degreeProgram?: string;
  linkedinUrl?: string;
  personalSite?: string;
  location?: string;
  bio?: string;
}
```

### 3. Verification & Activation
```typescript
// Account activation flow
1. Validate invitation token (not expired, not used)
2. Create user account with hashed password
3. Mark invitation as used
4. Send welcome email
5. Auto-login user to complete profile
```

## Authentication Pages

### Login Page (`app/auth/login/page.tsx`)
```typescript
// Clean, minimal login form
// - Email input
// - Password input
// - "Remember me" checkbox
// - Forgot password link
// - Register link (disabled - invitation only)

// Error handling
// - Invalid credentials
// - Account not activated
// - Rate limiting protection
```

### Registration Page (`app/auth/register/page.tsx`)
```typescript
// Token-protected registration
// - Validate invitation token on page load
// - Show invitation details (invited by, date)
// - Progressive form with validation
// - Password strength requirements
// - Profile completion optional

// Error handling
// - Expired/invalid tokens
// - Email already registered
// - Server validation errors
```

### Invitation Page (`app/auth/invite/page.tsx`)
```typescript
// Head TA only - send invitations
// - Email input with validation
// - Optional message field
// - Role suggestion dropdown
// - Batch invitation support (multiple emails)
// - Invitation status tracking
```

## Authorization Levels

### Role-Based Access Control
```typescript
enum UserRole {
  HEAD_TA = 'head_ta',
  TA = 'ta',
  ADMIN = 'admin' // Future: department admin
}

// Permission matrix
const permissions = {
  head_ta: [
    'read:all_profiles',
    'update:own_profile', 
    'create:invitations',
    'read:all_courses'
  ],
  ta: [
    'read:public_profiles',
    'update:own_profile',
    'read:own_courses'
  ],
  admin: [
    'create:courses',
    'update:any_profile',
    'delete:users',
    'manage:system'
  ]
};
```

### Page Protection
```typescript
// Middleware for route protection
// app/middleware.ts
export function middleware(request: NextRequest) {
  const protectedRoutes = [
    '/auth/invite',     // Head TAs only
    '/profile',         // Authenticated users
    '/api/invitations', // Head TAs only
  ];
  
  // Check authentication status
  // Redirect to login if needed
  // Verify role permissions
}

// Higher order component for page protection
export function withAuth(Component, requiredRole?) {
  return function AuthenticatedComponent(props) {
    const { session, status } = useSession();
    
    if (status === 'loading') return <LoadingSpinner />;
    if (!session) return <LoginRedirect />;
    if (requiredRole && !hasPermission(session.user, requiredRole)) {
      return <UnauthorizedPage />;
    }
    
    return <Component {...props} />;
  };
}
```

## Security Features

### Password Requirements
```typescript
const passwordValidation = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // Keep it simple
  blacklist: ['password', '12345678', 'qwerty'] // Common passwords
};
```

### Rate Limiting
```typescript
// Login attempts
const loginRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDuration: 30 * 60 * 1000 // 30 minutes
};

// Invitation sending  
const invitationRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxInvitations: 10, // Per Head TA
  dailyLimit: 50
};
```

### Token Security
```typescript
// Invitation tokens
const tokenConfig = {
  algorithm: 'HS256',
  expiresIn: '7d',
  issuer: 'head-ta-directory',
  audience: 'registration'
};

// Session tokens
const sessionConfig = {
  algorithm: 'HS256',
  expiresIn: '30d',
  rolling: true, // Extend on activity
  secure: process.env.NODE_ENV === 'production'
};
```

## Email Service Integration

### Vercel Approach: Resend
```typescript
// Email service configuration
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const templates = {
  invitation: 'template_invitation_001',
  welcome: 'template_welcome_001',
  passwordReset: 'template_password_reset_001'
};
```

### Supabase Approach: Built-in
```typescript
// Supabase handles email automatically
// - Invitation emails
// - Email verification
// - Password reset emails
// - Custom templates via dashboard
```

## Database Schema Additions

### Session Management (NextAuth.js)
```sql
-- NextAuth.js required tables
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invitation Tracking Enhancement
```sql
-- Add invitation status tracking
ALTER TABLE invitations ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE invitations ADD COLUMN invited_role VARCHAR(20) DEFAULT 'ta';
ALTER TABLE invitations ADD COLUMN custom_message TEXT;

-- Create invitation status enum
CREATE TYPE invitation_status AS ENUM ('pending', 'used', 'expired', 'revoked');
```

## API Endpoints

### Authentication Routes
```typescript
// app/api/auth/[...nextauth]/route.ts - NextAuth.js handler
// app/api/invitations/route.ts - Create invitations (POST)
// app/api/invitations/[id]/route.ts - Manage invitations (GET, DELETE)
// app/api/users/profile/route.ts - Update user profile (PUT)
// app/api/users/password/route.ts - Change password (PUT)
```

## Implementation Priority

### Phase 1: Basic Auth
1. NextAuth.js setup with email/password
2. User registration with invitation tokens
3. Basic login/logout functionality
4. Profile management

### Phase 2: Advanced Features  
1. Role-based permissions
2. Invitation management UI
3. Password reset functionality
4. Email templates and notifications

### Phase 3: Security Hardening
1. Rate limiting implementation
2. Advanced session management
3. Audit logging
4. Security monitoring