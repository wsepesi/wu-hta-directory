# Frontend Architecture & Views

## Page Structure (App Router)

```
app/
├── layout.tsx              # Root layout with navigation
├── page.tsx               # Homepage/dashboard
├── auth/
│   ├── login/page.tsx     # Login form
│   ├── register/page.tsx  # Registration (via invitation)
│   └── invite/page.tsx    # Send invitations
├── semesters/
│   ├── page.tsx          # All semesters overview
│   └── [semester]/page.tsx # Head TAs by specific semester
├── courses/
│   ├── page.tsx          # All courses overview  
│   └── [courseNumber]/page.tsx # Course family tree
├── people/
│   ├── page.tsx          # All TAs directory
│   └── [userId]/page.tsx # Individual TA profile
├── professors/
│   ├── page.tsx          # All professors
│   └── [professorId]/page.tsx # Professor's courses & TAs
├── profile/
│   └── page.tsx          # Current user's profile
├── manage/
│   ├── courses/page.tsx  # Course schedule management
│   └── invitations/page.tsx # Send invitations for missing TAs
├── admin/
│   ├── page.tsx          # Admin dashboard
│   ├── users/page.tsx    # User management
│   └── invitations/page.tsx # Invitation tracking
├── directory/
│   └── page.tsx          # Public directory view
└── api/
    ├── search/route.ts   # Global search endpoint
    ├── admin/
    │   ├── users/route.ts # Admin user management
    │   └── users/[id]/route.ts # Delete/manage users
    ├── courses/
    │   └── [id]/offerings/route.ts # Update course offerings
    └── invitations/
        └── route.ts      # Send targeted invitations
```

## Core Components

### Layout Components

#### `components/layout/Navigation.tsx`
```typescript
// Main navigation following style guide
// - Horizontal layout with serif font
// - All caps navigation items
// - Clean hover states
// - Responsive collapse for mobile
```

#### `components/layout/Header.tsx`
```typescript
// Page headers with elegant typography
// - Script font for main titles (72-96px)
// - Proper heading hierarchy
// - Centered alignment
```

### Data Display Components

#### `components/ta/TACard.tsx`
```typescript
interface TACardProps {
  ta: {
    id: string;
    firstName: string;
    lastName: string;
    gradYear?: number;
    degreeProgram?: string;
    email: string;
    personalSite?: string;
    linkedinUrl?: string;
    location?: string;
  };
  course?: {
    courseNumber: string;
    courseName: string;
  };
}
```

#### `components/course/CourseTimeline.tsx`
```typescript
// Linear timeline showing course progression
// - Clean typography with generous spacing
// - Semester progression left-to-right
// - Professor assignments clearly marked
// - Missing Head TA indicators with invite CTAs

interface CourseTimelineProps {
  course: {
    courseNumber: string;
    courseName: string;
    offeringPattern: 'both' | 'fall_only' | 'spring_only' | 'sparse';
  };
  offerings: Array<{
    semester: string;
    year: number;
    season: 'Fall' | 'Spring';
    professor?: { firstName: string; lastName: string };
    headTA?: { firstName: string; lastName: string; id: string };
    hasMissingTA: boolean;
  }>;
}
```

#### `components/course/MissingTAIndicator.tsx`
```typescript
// Shows "???" for missing Head TA assignments
// - Elegant placeholder following style guide
// - Clear call-to-action for invitations
// - Role-aware (only show invite option to authenticated users)

interface MissingTAIndicatorProps {
  courseOffering: {
    id: string;
    courseNumber: string;
    semester: string;
    professor?: string;
  };
  onInviteClick?: () => void;
  canInvite: boolean; // Based on user permissions
}
```

#### `components/course/CourseScheduleEditor.tsx`
```typescript
// Allows Head TAs to edit course offering schedule
// - Add/remove semester offerings
// - Update professor assignments
// - Manage course offering patterns

interface CourseScheduleEditorProps {
  course: {
    id: string;
    courseNumber: string;
    courseName: string;
    offeringPattern: string;
  };
  offerings: CourseOffering[];
  onUpdate: (offerings: CourseOffering[]) => void;
}
```

#### `components/semester/SemesterView.tsx`
```typescript
// Bold semester headers with TA listings
// - Typography hierarchy per style guide
// - Grouped by course within semester
// - Clean metadata display (right-aligned)
```

#### `components/search/GlobalSearch.tsx`
```typescript
// Global search bar component
// - Autocomplete with search suggestions
// - Multi-type results (users, courses, professors)
// - Keyboard navigation support
// - Mobile-responsive design

interface GlobalSearchProps {
  placeholder?: string;
  onResultSelect: (result: SearchResult) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface SearchResult {
  type: 'user' | 'course' | 'professor';
  id: string;
  name: string;
  email?: string;
  extraInfo?: string;
}
```

#### `components/admin/UserManagement.tsx`
```typescript
// Admin interface for managing users
// - User list with search and filtering
// - Delete user functionality
// - Invitation tracking display
// - Role management

interface UserManagementProps {
  users: UserWithInviter[];
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: string) => Promise<void>;
}

interface UserWithInviter extends User {
  invitedByName?: string;
  taAssignmentsCount: number;
  invitationDate?: Date;
}
```

#### `components/directory/PublicDirectory.tsx`
```typescript
// Public directory view (no authentication required)
// - Basic TA information display
// - Course assignments with recent focus
// - Clean, elegant presentation following style guide
// - Call-to-action for joining the directory
// - Mobile-optimized layout

interface PublicDirectoryProps {
  entries: PublicDirectoryEntry[];
  onJoinClick?: () => void;
}

interface PublicDirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  gradYear?: number;
  degreeProgram?: string;
  currentRole?: string;
  location?: string;
  courses: Array<{
    courseNumber: string;
    courseName: string;
    semester: string;
  }>;
}
```

## Key Views Detail

### 1. Homepage (`app/page.tsx`)
- **Layout**: Centered single-column with search bar
- **Content**: 
  - Global search bar prominently placed
  - Current semester Head TAs (top 6-8)
  - Quick stats (total TAs, courses, professors)
  - Recent additions/updates
- **Navigation**: Quick links to main sections
- **Style**: Generous whitespace, elegant typography
- **Search**: Global search with autocomplete and result previews

### 2. Semesters View (`app/semesters/[semester]/page.tsx`)
```typescript
// URL: /semesters/fall-2024
interface SemesterPageProps {
  params: { semester: string };
}

// Display Structure:
// - Search bar for filtering within semester
// - Bold semester header (Fall 2024)
// - Courses grouped with Head TAs
// - Missing TA indicators ("???") with invite CTAs
// - Metadata: professor, TA count
// - Links to individual profiles and course management
// - Mobile-responsive course cards
```

### 3. Course Family Tree (`app/courses/[courseNumber]/page.tsx`)
```typescript
// URL: /courses/cs101
// Linear timeline of course offerings
// - Chronological progression with offering pattern display
// - Professor changes highlighted
// - Head TA history with missing TA indicators
// - Course schedule editing capabilities for authenticated users
// - "???" placeholders with invitation CTAs for missing assignments
```

### 4. Individual Profile (`app/people/[userId]/page.tsx`)
```typescript
// Personal information section
// - Photo, name, graduation year, degree
// - Contact info (email, LinkedIn, personal site, location)
// - Clean, minimal profile display

// Head TA History section  
// - Chronological list of TA positions
// - Course numbers, names, semesters
// - Hours per week and responsibilities
// - Professors worked with
// - Links to course pages and professor profiles
```

### 5. Professor Dashboard (`app/professors/[professorId]/page.tsx`)
```typescript
// Professor information
// - Name, email, CS department affiliation
// - Courses taught (current & historical) with offering patterns

// Current Head TAs section
// - All current Head TAs across courses
// - Course assignments with semester details
// - Contact information and links to profiles

// Historical Head TAs section
// - Previous semester Head TAs
// - Course-specific filtering and timeline view
// - Missing TA indicators with invitation options
```

### 6. Public Directory (`app/directory/page.tsx`)
```typescript
// No authentication required
// Clean, elegant showcase of the Head TA community
// - Search bar for public directory
// - Grid layout of Head TAs with basic info
// - Current roles and recent graduation years highlighted
// - Course assignments from last 2 years
// - Call-to-action: "Join the Directory" button
// - Mobile-optimized card layout
// - Follows style guide typography and spacing
```

### 7. Admin Dashboard (`app/admin/page.tsx`)
```typescript
// Admin-only access (role-based protection)
// - Overview statistics and metrics
// - Recent user registrations
// - Invitation tracking and management
// - System health indicators
// - Quick actions: bulk operations, announcements
```

### 8. Admin User Management (`app/admin/users/page.tsx`)
```typescript
// Admin-only user management interface
// - Search and filter all users
// - View invitation tree (who invited whom)
// - Delete users with confirmation
// - Change user roles (head_ta <-> admin)
// - Export user data
// - Bulk operations for user management
// - TA assignment counts per user
```

### 9. Admin Invitation Tracking (`app/admin/invitations/page.tsx`)
```typescript
// Track and manage invitation system
// - All invitations (pending, used, expired)
// - Invitation analytics and conversion rates
// - Revoke pending invitations
// - Resend expired invitations
// - View invitation chains and network growth
```

## UI Component Library

### Typography Components
```typescript
// Following style guide specifications
export const ScriptHeading = ({ children, className, ...props }) => (
  <h1 className={`font-script text-7xl text-charcoal text-center ${className}`} {...props}>
    {children}
  </h1>
);

export const SerifHeading = ({ level = 2, children, className, ...props }) => (
  <Heading as={`h${level}`} className={`font-serif font-bold text-charcoal ${className}`} {...props}>
    {children}
  </Heading>
);

export const BodyText = ({ children, className, ...props }) => (
  <p className={`font-serif text-charcoal leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);
```

### Navigation Components
```typescript
export const NavLink = ({ href, children, isActive }) => (
  <Link 
    href={href}
    className={`font-serif uppercase tracking-wide text-sm hover:text-gray-700 ${
      isActive ? 'border-b border-charcoal' : ''
    }`}
  >
    {children}
  </Link>
);
```

## State Management

### Local State (useState/useReducer)
- Form inputs and validation
- UI state (modals, dropdowns)
- Component-level filtering

### Server State (SWR/TanStack Query)
- Database queries with caching
- Real-time updates for collaborative features
- Optimistic updates for better UX

### URL State (searchParams)
- Semester filtering
- Search queries
- Pagination state

## Performance Optimizations

### Code Splitting
- Route-based splitting (automatic with App Router)
- Component-level splitting for heavy components
- Dynamic imports for admin features

### Data Loading
- Parallel data fetching where possible
- Streaming with Suspense boundaries
- Progressive enhancement

### Caching Strategy
- Static generation for course/professor pages
- ISR for frequently updated TA listings
- Client-side caching for user interactions

## Responsive Design

### Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

### Layout Adaptations
- Navigation collapses to hamburger menu with search icon
- Card layouts stack vertically on mobile
- Typography scales appropriately while maintaining hierarchy
- Generous spacing maintained across devices but optimized for touch
- Search bar becomes prominent on mobile with appropriate touch targets
- Admin interfaces adapt to mobile with swipe actions for management tasks

### Mobile-Specific Considerations
- **Touch Targets**: Minimum 44px for buttons and interactive elements
- **Search UX**: Full-width search bar on mobile, overlay results
- **Navigation**: Bottom navigation bar for main sections on mobile
- **Cards**: Touch-friendly card layouts with clear tap areas
- **Forms**: Mobile-optimized form inputs with appropriate keyboards
- **Admin Tools**: Simplified admin interface on mobile with essential functions

## Accessibility Features
- Semantic HTML structure
- ARIA labels for complex interactions
- Keyboard navigation support
- High contrast ratios per style guide
- Screen reader optimized content hierarchy