# Head TA Dashboard Implementation Plan

## Overview
Currently, only admin users have access to a comprehensive dashboard with management capabilities. Head TAs are limited to basic navigation and minimal functionality. This plan implements a dedicated Head TA Dashboard that provides appropriate management capabilities while maintaining proper role separation.

## Current State Analysis

### Admin Capabilities (Keep Exclusive)
- User banning/deletion
- Role changes (admin/head_ta)
- System analytics and audit logs
- Full user management with bulk operations
- Privacy setting overrides

### Head TA Current Limitations
- No dedicated dashboard (only basic auth pages)
- Cannot add courses (admin-only via `canManageCourses()`)
- Cannot add professors (admin-only)
- Limited invitation capabilities
- No centralized management interface

## Proposed Head TA Dashboard Features

### 1. Course Management
- **Add new courses**: Create course entries with proper validation
- **Edit existing courses**: Modify course details and schedules
- **Course offering management**: Create semester-specific offerings
- **TA assignment interface**: Assign TAs to courses they manage

### 2. Professor Management
- **Add new professors**: Create professor profiles
- **Edit professor details**: Update contact info and affiliations
- **Associate professors with courses**: Link professors to course offerings

### 3. Enhanced Profile Management
- **Extended profile editing**: Beyond basic profile updates
- **Privacy settings**: Granular control over profile visibility
- **Profile image management**: Upload and manage profile photos

### 4. Head TA Operations
- **Invite other Head TAs**: Streamlined invitation process
- **Placeholder HTA management**: Create temporary/placeholder TA entries
- **Manage TA assignments**: Assign and reassign TAs to courses

### 5. Dashboard Widgets
- **My Courses**: Quick view of courses they're associated with
- **Pending Invitations**: Track invitation status
- **TA Workload**: Overview of current TA assignments
- **Missing TAs**: Identify courses needing TA assignments

## Implementation Strategy

### Phase 1: Core Infrastructure
1. **Create Head TA Dashboard Route**
   - New page: `/app/dashboard/head-ta/page.tsx`
   - Update routing logic to redirect head_ta users appropriately

2. **Update Permissions System**
   - Extend `lib/permissions.ts` with new head TA capabilities
   - Add `canManageCoursesAsHeadTA()`, `canManageProfessorsAsHeadTA()`

3. **Navigation Updates**
   - Update `NavigationWithSearch.tsx` to show Head TA dashboard link
   - Add conditional rendering for head TA specific navigation items

### Phase 2: Course & Professor Management
1. **Course Management Components**
   - Adapt existing `CourseManagement.tsx` for head TA use
   - Create simplified course creation form
   - Implement head TA course filtering (only courses they're associated with)

2. **Professor Management Components**
   - Create `HeadTAProfessorManagement.tsx` component
   - Implement professor creation and editing forms
   - Add professor-course association interface

3. **API Route Updates**
   - Update `/api/courses/route.ts` to allow head TA course creation
   - Update `/api/professors/route.ts` to allow head TA professor management
   - Add proper permission checks in route handlers

### Phase 3: Enhanced Features  
1. **Placeholder HTA Management**
   - Create system for temporary/placeholder TA entries
   - Add database schema changes if needed
   - Implement placeholder TA creation and management UI

2. **Enhanced Invitation Interface**
   - Create dedicated invitation management page for head TAs
   - Improve invitation tracking and status updates
   - Add bulk invitation capabilities

3. **Dashboard Widgets**
   - Create head TA specific dashboard widgets
   - Implement real-time updates for assignment changes
   - Add quick action buttons for common tasks

### Phase 4: Integration & Polish
1. **Role-Based Routing**
   - Update middleware to handle head TA dashboard routes
   - Implement proper redirects based on user role
   - Add authorization checks at component level

2. **UI/UX Improvements**
   - Ensure consistent design with existing admin dashboard
   - Add responsive design for mobile head TA users
   - Implement loading states and error handling

3. **Testing & Validation**
   - Add tests for new permission logic
   - Test role-based routing and access control
   - Validate all CRUD operations work correctly

## Database Schema Changes

### New Tables (if needed)
```sql
-- Placeholder TAs table (optional)
CREATE TABLE placeholder_tas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  course_id UUID REFERENCES courses(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_placeholder BOOLEAN DEFAULT true
);
```

### Permission Matrix Updates
```typescript
// lib/permissions.ts additions
export const canManageCoursesAsHeadTA = (userRole: string) => userRole === 'head_ta' || userRole === 'admin';
export const canManageProfessorsAsHeadTA = (userRole: string) => userRole === 'head_ta' || userRole === 'admin';
export const canCreatePlaceholderTAs = (userRole: string) => userRole === 'head_ta' || userRole === 'admin';
```

## Security Considerations

### Role-Based Access Control
- Head TAs can only manage courses they're associated with
- Professor management limited to courses they oversee
- Cannot access admin-only features (user management, system stats)
- Maintain audit logging for head TA actions

### Data Privacy
- Head TAs cannot override privacy settings
- Limited access to other users' private information
- Can only invite head TAs, not admins

## Success Metrics
- Head TAs can independently manage their courses and professors
- Reduced admin workload for routine course/professor management
- Improved user experience for head TA role
- Maintained security boundaries between admin and head TA roles

## Technical Requirements
- Maintain existing admin dashboard functionality
- Ensure proper role-based access control
- Follow existing component patterns and design system
- Implement comprehensive error handling and validation
- Add appropriate loading states and user feedback

## Future Enhancements
- Course analytics for head TAs (enrollment trends, TA performance)
- Advanced TA scheduling and conflict resolution
- Integration with university course catalog systems
- Mobile app considerations for head TA dashboard