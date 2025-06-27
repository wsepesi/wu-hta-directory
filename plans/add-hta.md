# Add HTA Without Invitation Feature Plan

## Overview

This plan outlines the implementation of a feature to create Head TA (HTA) profiles without sending email invitations, similar to how professors are currently created. This allows administrators to pre-create HTA profiles that can be claimed when the actual person signs up.

## Current State Analysis

### Existing Infrastructure

1. **Unclaimed Profile System**: Fully implemented with the following capabilities:
   - Database fields: `isUnclaimed`, `claimedBy`, `claimedAt`, `originalUnclaimedId`
   - Additional fields: `invitationSent`, `recordedBy`, `recordedAt`
   - Multiple API endpoints:
     - `/api/users/[id]/claim` - Main claiming endpoint with name verification
     - `/api/unclaimed-profiles/[id]/claim` - Alternative claiming endpoint
     - `/api/users/[id]/claimable` - Check if profile can be claimed
     - `/api/users/unclaimed` - List unclaimed profiles
     - `/api/users/[id]/send-claim-invitation` - Send invitation to claim
     - `/api/users/[id]/invitation-history` - Track invitation history
   - UI components: `UnclaimedProfileBadge`, `ClaimProfileModal`, `UnclaimedTAMarker`
   - Repository methods: `createUnclaimedProfile()`, `getUnclaimedByName()`, `claimProfile()`
   - Currently accessible through:
     - TA assignment workflow
     - Bulk historical imports (`/api/hta-records/bulk-historical`)
     - Bulk HTA recording UI (`BulkHTARecording.tsx`)

2. **Professor Creation**: Simple form-based creation with:
   - `ProfessorForm` component with first name, last name, email fields
   - Integrated into Course Management interface
   - No user account or authentication required
   - Stored in separate `professors` table

3. **HTA Creation Methods**:
   - Regular signup with invitation (creates full user account)
   - Unclaimed profile creation through TA assignment
   - Bulk historical imports for multiple HTAs
   - No direct admin UI for creating individual HTAs without invitation

## Proposed Solution

### User Flow

1. **Admin creates HTA profile** from admin dashboard:
   - Navigate to "Manage HTAs" section (new)
   - Click "Add New HTA" button
   - Enter first name, last name, email (optional for unclaimed profiles)
   - System creates unclaimed user profile with placeholder email if none provided

2. **HTA signs up** later:
   - During signup, system checks if name matches any unclaimed profile
   - If match found, prompt to claim the profile using existing `ClaimProfileModal`
   - Name verification uses sophisticated matching (handles nicknames)
   - All existing assignments transfer to the new account

3. **Profile management**:
   - Unclaimed HTAs already appear in directory with `UnclaimedProfileBadge`
   - Can be assigned to courses like regular HTAs (existing functionality)
   - Admin can edit/delete unclaimed profiles
   - Can send claim invitations to unclaimed profiles

### Implementation Details

#### 1. Database Schema
No changes needed - existing schema supports this:
```sql
-- users table already has:
isUnclaimed BOOLEAN DEFAULT FALSE
claimedBy UUID REFERENCES users(id)
claimedAt TIMESTAMP
originalUnclaimedId UUID
```

#### 2. API Endpoints

**New endpoint**: `POST /api/admin/htas`
```typescript
// Create unclaimed HTA profile
{
  firstName: string;
  lastName: string;
  email?: string; // Optional - will use placeholder if not provided
}
```

**Modify**: `POST /api/auth/signup`
- Check for unclaimed profiles with matching name (not just email)
- Use existing `userRepository.getUnclaimedByName()` method
- If found, show claim modal after successful signup
- Leverage existing claim logic in `/api/users/[id]/claim`

**Existing endpoints to leverage**:
- `GET /api/users/unclaimed` - Already lists unclaimed profiles
- `POST /api/users/[id]/claim` - Already handles claiming with name verification
- `POST /api/users/[id]/send-claim-invitation` - Send invitations if email provided

#### 3. UI Components

**New component**: `HTAManagement.tsx`
- Similar to existing `EnhancedUserManagement` but focused on HTAs
- Reuse existing `EnhancedDataTable` for display
- Integrate with existing unclaimed profile endpoints
- Add "Create HTA" button to toolbar
- Show both claimed and unclaimed HTAs with status indicators

**New component**: `HTAForm.tsx`
- Based on existing `ProfessorForm` pattern
- Fields: firstName (required), lastName (required), email (optional)
- If email provided, validate @wustl.edu domain
- Use `userRepository.createUnclaimedProfile()` for creation

**Modify**: `RegisterForm.tsx` at `/components/auth/RegisterForm.tsx`
- After successful registration, check for unclaimed profiles by name
- If found, show existing `ClaimProfileModal` component
- Handle profile claiming using existing `/api/users/[id]/claim` endpoint

#### 4. Admin Dashboard Integration

Add new section to admin dashboard:
- "Manage HTAs" link in quick actions
- Stats showing unclaimed vs claimed HTAs
- Recent unclaimed profiles list

#### 5. Directory and Assignment Updates

- Unclaimed HTAs appear in directory with visual indicator
- Can be assigned to courses through existing interfaces
- Profile pages show "Unclaimed" status prominently

### Security Considerations

1. **Access Control**:
   - Only admins can create unclaimed HTA profiles (existing admin middleware)
   - Email validation for @wustl.edu domain if provided
   - Name verification already implemented in claim endpoint (handles nicknames)

2. **Data Integrity**:
   - Check for existing profiles with same name before creation
   - Use existing `claimProfile()` method for safe assignment transfer
   - Audit logging already implemented via `auditLogs` table
   - Maintain `originalUnclaimedId` for tracking

3. **Privacy**:
   - Unclaimed profiles use placeholder emails when none provided
   - Privacy settings default to minimal visibility
   - Existing `UnclaimedProfileBadge` provides clear status indication

### Migration Path

1. No database migration needed - schema already supports this
2. Existing unclaimed profiles (created via TA assignment) remain unchanged
3. New UI provides easier access to existing functionality

### Testing Requirements

1. **Unit Tests**:
   - HTA creation validation
   - Profile claiming logic
   - Email duplicate prevention

2. **Integration Tests**:
   - Full flow from creation to claiming
   - Assignment transfer verification
   - Auth flow with claimable profiles

3. **UI Tests**:
   - Admin HTA management interface
   - Claim profile modal during signup
   - Directory display of unclaimed HTAs

### Implementation Phases

**Phase 1**: Backend API (1-2 hours) - REDUCED
- Create `/api/admin/htas` endpoint using existing `userRepository.createUnclaimedProfile()`
- Endpoint mostly wraps existing functionality
- Leverage existing validation and error handling

**Phase 2**: Admin UI (2-3 hours) - REDUCED
- Build HTAManagement component reusing `EnhancedDataTable`
- Create HTAForm based on `ProfessorForm` pattern
- Add link to admin dashboard quick actions

**Phase 3**: Signup Flow Integration (1-2 hours) - REDUCED
- Modify RegisterForm to check for claimable profiles
- Reuse existing `ClaimProfileModal` component
- Claim logic already handles assignment transfers

**Phase 4**: Polish & Testing (2 hours)
- Write tests for new endpoints and UI components
- Verify integration with existing unclaimed profile system
- Update CLAUDE.md documentation

**Total: 6-9 hours** (reduced from 10-13 hours due to extensive existing infrastructure)

### Benefits

1. **Flexibility**: Create HTA profiles before they join
2. **Consistency**: Same workflow as professor creation
3. **Efficiency**: Pre-assign HTAs to courses
4. **Visibility**: See all HTAs (current and future) in one place

### Risks & Mitigations

1. **Risk**: Confusion between invited and unclaimed HTAs
   - **Mitigation**: Clear visual indicators and status labels

2. **Risk**: Accidental creation of duplicate profiles
   - **Mitigation**: Email uniqueness validation

3. **Risk**: Privacy concerns with pre-created profiles
   - **Mitigation**: Limited data, clear unclaimed status

### Success Criteria

1. Admins can create HTA profiles without sending invitations
2. HTAs can claim profiles during signup based on name matching
3. All assignments transfer correctly when claimed (existing functionality)
4. Clear distinction between claimed/unclaimed profiles (existing badges)
5. No disruption to existing invitation flow
6. Integration with existing bulk import features

### Notes on Existing Implementation

The codebase already has extensive support for unclaimed profiles:
- Name-based matching with nickname support (e.g., "Will" matches "William")
- Placeholder email generation for unclaimed profiles
- Complete API infrastructure for claiming
- UI components for status indication
- Bulk import capabilities for historical data

This feature primarily adds a convenient single-profile creation UI to complement the existing bulk import functionality.