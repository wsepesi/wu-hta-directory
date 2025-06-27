# Query and Cache Invalidation Audit

This document lists all instances in the codebase where data fetching and cache invalidation patterns need improvement, based on the best practices outlined in `query.md`.

## Summary of Issues

- **0 API routes** use `revalidatePath` or `revalidateTag` (verified across all mutation endpoints)
- **13 instances** of `router.refresh()` across 8 components
- **8 pages** use `force-dynamic` or pass server data as props to client components
- **Multiple instances** of stale data after mutations affecting core functionality

## Detailed Findings by Category

### 1. Course Management System

#### Files Affected:
- `/app/manage/courses/page.tsx` (force-dynamic, passes initial data)
- `/components/course/CourseManagementWrapper.tsx` 
- `/components/course/CourseManagement.tsx` (5 router.refresh() calls)
- `/components/course/CourseForm.tsx` (1 router.refresh() call)
- `/components/course/CourseOfferingForm.tsx` (1 router.refresh() call)
- `/app/api/courses/route.ts` (no revalidation)
- `/app/api/course-offerings/route.ts` (no revalidation)

#### Issues:
```typescript
// app/manage/courses/page.tsx (lines 71-76)
<CourseManagementWrapper
  initialCourses={courses}           // Static server data
  initialProfessors={professors}     // Won't update after mutations
  coursesWithOfferings={coursesWithOfferings}
  semesters={semesters}
/>

// components/course/CourseManagement.tsx
// 5 router.refresh() calls at lines 59, 64, 69, 74, 91
const handleCourseSuccess = () => {
  setShowCourseForm(false);
  router.refresh(); // Full page refresh
};

// components/course/CourseForm.tsx (line 63)
router.refresh();

// components/course/CourseOfferingForm.tsx (line 125)
router.refresh();

// app/api/courses/route.ts (POST handler)
export async function POST(request) {
  const course = await courseRepository.create(courseInput);
  // Missing: revalidatePath('/courses');
  // Missing: revalidatePath('/manage/courses');
  return NextResponse.json({ data: course });
}
```

### 2. Professor Management

#### Files Affected:
- `/app/professors/page.tsx` (force-dynamic export)
- `/components/professor/ProfessorForm.tsx` (1 router.refresh() call)
- `/app/api/professors/route.ts` (no revalidation)
- `/hooks/useProfessors.ts` (exists but unused in main flow)

#### Issues:
```typescript
// app/professors/page.tsx (line 8)
export const dynamic = 'force-dynamic';

// components/professor/ProfessorForm.tsx (line 81)
router.push('/professors');
router.refresh(); // After professor creation

// app/api/professors/route.ts (POST handler)
export async function POST(request) {
  const professor = await professorRepository.create(professorInput);
  // Missing: revalidatePath('/professors');
  // Missing: revalidatePath('/manage/courses');
  return NextResponse.json({ data: professor });
}

// Note: useProfessors hook exists but isn't used in the main professor pages
```

### 3. TA Assignment System

#### Files Affected:
- `/components/course/TAAssignmentModal.tsx` (no router.refresh)
- `/components/course/TAAssignmentModalWrapper.tsx`
- `/app/api/ta-assignments/route.ts` (no revalidation)
- `/app/api/ta-assignments/[id]/route.ts` (no revalidation)
- `/components/dashboard/MissingTAWidget.tsx`

#### Issues:
```typescript
// components/course/TAAssignmentModal.tsx
// Uses onSuccess callback but parent needs to handle refresh

// app/api/ta-assignments/route.ts (POST handler)
export async function POST(request) {
  const assignment = await taAssignmentRepository.create(assignmentData);
  // Missing: revalidatePath('/courses/[courseNumber]');
  // Missing: revalidatePath('/dashboard');
  // Missing: revalidateTag('ta-assignments');
  return NextResponse.json({ data: assignment });
}

// Dashboard widgets show stale data after assignments
```

### 4. User Management

#### Files Affected:
- `/app/admin/page.tsx`
- `/components/admin/EnhancedUserManagement.tsx`
- `/app/api/users/[id]/route.ts`
- `/app/api/users/[id]/toggle-role/route.ts`

#### Issues:
```typescript
// components/admin/EnhancedUserManagement.tsx (lines 55, 72)
await refetch(); // Manual refetch after mutations

// app/api/users/[id]/route.ts
// No revalidatePath after user updates
```

### 5. Invitation System

#### Files Affected:
- `/app/manage/invitations/page.tsx` (server-side with InvitationsContent)
- `/app/manage/invitations/InvitationsContent.tsx` (2 router.refresh() calls)
- `/app/api/invitations/route.ts` (no revalidation)
- `/components/admin/InvitationTree.tsx`

#### Issues:
```typescript
// app/manage/invitations/InvitationsContent.tsx
// Line 47: router.refresh(); // After resending invitation
// Line 63: router.refresh(); // After deleting invitation

// app/api/invitations/route.ts
// No revalidation after creating/deleting invitations
```

### 6. Authentication Flow

#### Files Affected:
- `/components/auth/LoginForm.tsx` (1 router.refresh() call)
- `/components/auth/RegisterForm.tsx` (1 router.refresh() call)
- `/app/api/auth/login/route.ts` (no revalidation)
- `/app/api/auth/signup/route.ts` (no revalidation)

#### Issues:
```typescript
// components/auth/LoginForm.tsx (line 75)
router.refresh(); // After successful login

// components/auth/RegisterForm.tsx (line 158)
router.refresh(); // After successful registration

// API routes don't invalidate user-related caches
```

### 7. Profile Management

#### Files Affected:
- `/app/profile/edit/page.tsx`
- `/app/profile/page.tsx` 
- `/components/profile/ProfileImageUpload.tsx`
- `/components/profile/ClaimProfileModal.tsx` (1 router.refresh() call)
- `/app/api/users/[id]/route.ts` (no revalidation)
- `/app/api/users/[id]/upload-image/route.ts` (no revalidation)

#### Issues:
```typescript
// components/profile/ClaimProfileModal.tsx (line 48)
router.refresh(); // After claiming profile

// No cache invalidation in API routes after:
// - Profile updates
// - Image uploads
// - Privacy settings changes
```

### 8. Directory Pages

#### Files Affected:
- `/app/directory/page.tsx`
- `/app/directory/PublicDirectoryClient.tsx`

#### Issues:
```typescript
// Uses force-dynamic but passes static data to client
// Search/filter happens client-side on stale data
```

### 9. Dashboard Components

#### Files Affected:
- `/app/dashboard/page.tsx` (force-dynamic)
- `/components/dashboard/DashboardContent.tsx`
- `/components/dashboard/TAWorkloadWidget.tsx`
- `/components/dashboard/MissingTAWidget.tsx`

#### Issues:
```typescript
// app/dashboard/page.tsx (line 10)
export const dynamic = 'force-dynamic';

// Dashboard fetches data server-side but widgets receive static props
// Widgets don't update after TA assignments or course changes
```

### 10. Semester Planning

#### Files Affected:
- `/app/manage/semester-planning/page.tsx`
- `/components/semester/SemesterPlanning.tsx`

#### Issues:
```typescript
// Complex state management without proper invalidation
// Multiple related entities need coordination
```

## Priority Matrix

### 🔴 Critical (Affects Core Functionality)
1. **Course Management** - Students can't see new courses
2. **TA Assignments** - Missing TAs not reflected
3. **Professor Management** - New professors don't appear

### 🟡 High (Poor UX)
4. **User Management** - Admin operations feel slow
5. **Profile Updates** - Changes don't reflect immediately
6. **Directory Search** - Shows outdated information

### 🟢 Medium (Optimization)
7. **Invitation System** - Already uses client-side fetching
8. **Authentication** - One-time operations
9. **Dashboard Widgets** - Can be refreshed manually

## Recommended Fix Order

### Phase 1: Add revalidatePath to all API routes (1 day)
```typescript
// Template for all POST/PUT/DELETE routes
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request) {
  // ... mutation logic
  
  // Revalidate affected paths
  revalidatePath('/courses');
  revalidatePath('/manage/courses');
  revalidateTag('courses');
  
  return NextResponse.json(result);
}
```

### Phase 2: Replace router.refresh() with targeted updates (3 days)
- Implement proper success callbacks
- Use toast notifications for feedback
- Add loading overlays during transitions

### Phase 3: Migrate to consistent patterns (1 week)
- Choose server-side or client-side per feature
- Implement optimistic updates for critical paths
- Add proper error boundaries

### Phase 4: Performance optimization (ongoing)
- Add React Query for complex client state
- Implement progressive enhancement
- Monitor and optimize slow queries

## Quick Wins

These can be fixed immediately for big UX improvements:

1. **Add to all mutation API routes**:
```typescript
import { revalidatePath } from 'next/cache';

// In POST/PUT/DELETE handlers
revalidatePath('/'); // Revalidate all pages (temporary fix)
// Better: revalidatePath('/specific-path');
```

2. **Most critical API routes to fix first**:
- `/api/professors/route.ts` - affects professor lists
- `/api/courses/route.ts` - affects course management
- `/api/ta-assignments/route.ts` - affects dashboards
- `/api/users/[id]/route.ts` - affects profiles

3. **Replace router.refresh() with better UX**:
```typescript
// Old
router.refresh();

// New
await refetch(); // If using hooks
showToast('success', 'Changes saved');
```

## Testing Checklist

- [ ] After creating a course, it appears in the list immediately
- [ ] After assigning a TA, dashboard updates
- [ ] After adding a professor, they appear without refresh
- [ ] Profile updates reflect across all pages
- [ ] Admin changes propagate to affected users
- [ ] Directory search shows current data
- [ ] Missing TA alerts update in real-time

## Monitoring

Add logging to track cache invalidation issues:

```typescript
// lib/cache-debug.ts
export function logCacheInvalidation(path: string, reason: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cache] Invalidating ${path}: ${reason}`);
  }
}
```